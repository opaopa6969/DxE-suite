// Graph builder — assemble nodes + edges from parse results

import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { parseSession } from "../parser/session-parser.js";
import { parseDecision } from "../parser/decision-parser.js";
import { parseAnnotation } from "../parser/annotation-parser.js";
import { parseSpec } from "../parser/spec-parser.js";
import { gitLinkerEdges } from "../parser/git-linker.js";
import { buildGlossary } from "../parser/glossary-builder.js";
import type { DVEGraph, GraphNode, Edge } from "./schema.js";

export interface BuildOptions {
  sessionsDir: string;
  decisionsDir: string;
  specsDir: string;
  annotationsDir: string;
  cwd: string;
  enableGitLinker?: boolean;
}

function scanMd(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => path.join(dir, f))
    .sort();
}

export function buildGraph(opts: BuildOptions): DVEGraph {
  const nodes: GraphNode[] = [];
  const edges: Edge[] = [];
  const warnings: { file: string; message: string }[] = [];

  // Indexes for O(1) lookups (avoids O(n²) scans as graph grows).
  // nodeIds: every node id pushed so far — used for existence checks.
  // gapsBySession: session_id → Map<gapNum(zero-padded 3), GraphNode>
  // gapSuffixById: node id → zero-padded gap number — used for #N matching.
  const nodeIds = new Set<string>();
  const gapsBySession = new Map<string, Map<string, GraphNode>>();
  // Running counters per type — replaces the 5 full scans in stats.
  const counts = { session: 0, dialogue: 0, gap: 0, decision: 0, annotation: 0, spec: 0 };

  function trackNode(node: GraphNode) {
    nodes.push(node);
    nodeIds.add(node.id);
    counts[node.type] = (counts[node.type] ?? 0) + 1;
  }

  // 1. Parse sessions
  const sessionFiles = scanMd(opts.sessionsDir);
  for (const file of sessionFiles) {
    const { session, gaps } = parseSession(file);
    if (session.node.id) {
      trackNode({
        type: "session",
        id: session.node.id!,
        data: session.node as any,
        confidence: session.confidence,
        warnings: session.warnings,
      });
      for (const w of session.warnings) {
        warnings.push({ file, message: w });
      }
    }

    // Dialogue node — sits between Session and Gaps
    const dialogueId = `${session.node.id!}#dialogue`;
    const hasDialogue = !!(session.node as any).content &&
      /Scene|先輩|ナレーション|☕|👤|🎩|😰|⚔|🎨|📊/.test((session.node as any).content ?? "");
    trackNode({
      type: "dialogue" as any,
      id: dialogueId,
      data: {
        session_id: session.node.id!,
        has_content: hasDialogue,
        scene_count: ((session.node as any).content?.match(/##.*Scene/g) ?? []).length,
        char_count: ((session.node as any).content?.match(/☕|👤|🎩|😰|⚔|🎨|📊|🏥|😈|🧑‍💼/g) ?? []).length,
      } as any,
      confidence: hasDialogue ? 1.0 : 0.3,
      warnings: hasDialogue ? [] : ["会話劇テキスト未保存"],
    });
    // Session → Dialogue
    edges.push({
      source: session.node.id!,
      target: dialogueId,
      type: "contains",
      confidence: "explicit",
    });

    const sessId = session.node.id!;
    const gapMap = new Map<string, GraphNode>();
    for (const gap of gaps) {
      if (gap.node.id) {
        // Extract zero-padded gap number from id "{session_id}#G-{n}"
        const gapNum = sessId && gap.node.id!.startsWith(sessId + "#G-")
          ? gap.node.id!.slice(sessId.length + 3)
          : "";
        trackNode({
          type: "gap",
          id: gap.node.id!,
          data: gap.node as any,
          confidence: gap.confidence,
          warnings: gap.warnings,
        });
        // Dialogue → Gap (instead of Session → Gap)
        edges.push({
          source: dialogueId,
          target: gap.node.id!,
          type: "discovers",
          confidence: "explicit",
        });
        if (gapNum) gapMap.set(gapNum, nodes[nodes.length - 1]);
        for (const w of gap.warnings) {
          warnings.push({ file, message: `${gap.node.id}: ${w}` });
        }
      }
    }
    if (gapMap.size > 0) gapsBySession.set(sessId, gapMap);
  }

  // 2. Parse decisions
  const ddFiles = scanMd(opts.decisionsDir);
  for (const file of ddFiles) {
    const dd = parseDecision(file);
    if (dd.node.id) {
      trackNode({
        type: "decision",
        id: dd.node.id!,
        data: dd.node as any,
        confidence: dd.confidence,
        warnings: dd.warnings,
      });
      for (const w of dd.warnings) {
        warnings.push({ file, message: `${dd.node.id}: ${w}` });
      }

      // resolves edges: find gaps that this DD references
      // Match session_refs to gaps in those sessions via index (O(1) lookup).
      for (const sessionRef of dd.node.session_refs ?? []) {
        const sessionGaps = gapsBySession.get(sessionRef);
        // If DD has specific gap_refs (#N), match them
        if (dd.node.gap_refs && dd.node.gap_refs.length > 0) {
          for (const gapRef of dd.node.gap_refs) {
            const gapNum = gapRef.replace("#", "").padStart(3, "0");
            const matchingGap = sessionGaps?.get(gapNum);
            if (matchingGap) {
              edges.push({
                source: matchingGap.id,
                target: dd.node.id!,
                type: "resolves",
                confidence: "explicit",
                evidence: `DD references Gap ${gapRef}`,
              });
            }
          }
        } else {
          // No specific gap refs — link DD to session (inferred)
          edges.push({
            source: sessionRef,
            target: dd.node.id!,
            type: "resolves",
            confidence: "inferred",
            evidence: "DD references session without specific gap numbers",
          });
        }
      }

      // supersedes edges
      for (const sup of dd.node.supersedes ?? []) {
        edges.push({
          source: dd.node.id!,
          target: sup,
          type: "supersedes",
          confidence: "explicit",
        });
      }
    }
  }

  // 3. Parse annotations
  const annFiles = scanMd(opts.annotationsDir);
  for (const file of annFiles) {
    const ann = parseAnnotation(file);
    if (ann.node.id) {
      trackNode({
        type: "annotation",
        id: ann.node.id!,
        data: ann.node as any,
        confidence: ann.confidence,
        warnings: ann.warnings,
      });
      // annotates edge
      if (ann.node.target?.id) {
        edges.push({
          source: ann.node.id!,
          target: ann.node.target.id,
          type: "annotates",
          confidence: "explicit",
        });
      }
    }
  }

  // 4. Parse specs
  const specFiles = scanMd(opts.specsDir);
  for (const file of specFiles) {
    const spec = parseSpec(file);
    if (spec.node.id) {
      trackNode({
        type: "spec",
        id: spec.node.id!,
        data: spec.node as any,
        confidence: spec.confidence,
        warnings: spec.warnings,
      });
      // produces edges: Decision → Spec (O(1) existence check via nodeIds)
      for (const ddRef of spec.node.decision_refs ?? []) {
        if (nodeIds.has(ddRef)) {
          edges.push({
            source: ddRef,
            target: spec.node.id!,
            type: "produces",
            confidence: "inferred",
            evidence: `Spec references ${ddRef}`,
          });
        }
      }
    }
  }

  // 5. Git linker
  if (opts.enableGitLinker !== false) {
    // Reuse running counts.decision instead of scanning nodes again.
    const ddIds = new Set<string>();
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].type === "decision") ddIds.add(nodes[i].id);
    }
    const gitEdges = gitLinkerEdges(opts.cwd, ddIds);
    for (const edge of gitEdges) {
      // Add commit as external ref node if not exists (O(1) via nodeIds)
      if (!nodeIds.has(edge.target)) {
        trackNode({
          type: "annotation" as any, // reuse for external refs
          id: edge.target,
          data: { type: "commit", ref: edge.target, evidence: edge.evidence } as any,
          confidence: 0.8,
          warnings: [],
        });
      }
      edges.push(edge);
    }
  }

  // Stats — use running counters (single-pass accounting via trackNode).
  const stats = {
    sessions: counts.session ?? 0,
    gaps: counts.gap ?? 0,
    decisions: counts.decision ?? 0,
    annotations: counts.annotation ?? 0,
    specs: counts.spec ?? 0,
  };

  // Build glossary from completed graph
  const partialGraph = { version: "1.0.0", generated_at: "", stats, nodes, edges, warnings } as DVEGraph;
  const glossary = buildGlossary(partialGraph, opts.cwd);

  return {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    stats,
    nodes,
    edges,
    warnings,
    glossary: glossary.entries,
  };
}
