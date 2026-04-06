// Graph builder — assemble nodes + edges from parse results

import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { parseSession } from "../parser/session-parser.js";
import { parseDecision } from "../parser/decision-parser.js";
import { parseAnnotation } from "../parser/annotation-parser.js";
import { parseSpec } from "../parser/spec-parser.js";
import { gitLinkerEdges } from "../parser/git-linker.js";
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

  // 1. Parse sessions
  const sessionFiles = scanMd(opts.sessionsDir);
  for (const file of sessionFiles) {
    const { session, gaps } = parseSession(file);
    if (session.node.id) {
      nodes.push({
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
    nodes.push({
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

    for (const gap of gaps) {
      if (gap.node.id) {
        nodes.push({
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
        for (const w of gap.warnings) {
          warnings.push({ file, message: `${gap.node.id}: ${w}` });
        }
      }
    }
  }

  // 2. Parse decisions
  const ddFiles = scanMd(opts.decisionsDir);
  for (const file of ddFiles) {
    const dd = parseDecision(file);
    if (dd.node.id) {
      nodes.push({
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
      // Match session_refs to gaps in those sessions
      for (const sessionRef of dd.node.session_refs ?? []) {
        const sessionGaps = nodes.filter(
          (n) => n.type === "gap" && (n.data as any).session_id === sessionRef
        );
        // If DD has specific gap_refs (#N), match them
        if (dd.node.gap_refs && dd.node.gap_refs.length > 0) {
          for (const gapRef of dd.node.gap_refs) {
            const gapNum = gapRef.replace("#", "");
            const matchingGap = sessionGaps.find((g) =>
              g.id.endsWith(`#G-${gapNum.padStart(3, "0")}`)
            );
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
      nodes.push({
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
      nodes.push({
        type: "spec",
        id: spec.node.id!,
        data: spec.node as any,
        confidence: spec.confidence,
        warnings: spec.warnings,
      });
      // produces edges: Decision → Spec
      for (const ddRef of spec.node.decision_refs ?? []) {
        if (nodes.some((n) => n.id === ddRef)) {
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
    const ddIds = new Set(nodes.filter((n) => n.type === "decision").map((n) => n.id));
    const gitEdges = gitLinkerEdges(opts.cwd, ddIds);
    for (const edge of gitEdges) {
      // Add commit as external ref node if not exists
      if (!nodes.some((n) => n.id === edge.target)) {
        nodes.push({
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

  // Stats
  const stats = {
    sessions: nodes.filter((n) => n.type === "session").length,
    gaps: nodes.filter((n) => n.type === "gap").length,
    decisions: nodes.filter((n) => n.type === "decision").length,
    annotations: nodes.filter((n) => n.type === "annotation").length,
    specs: nodes.filter((n) => n.type === "spec").length,
  };

  return {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    stats,
    nodes,
    edges,
    warnings,
  };
}
