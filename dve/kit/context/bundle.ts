// ContextBundle generator — DVE → DGE bridge

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import type { DVEGraph, GraphNode, ContextBundle, Gap, Decision, Session } from "../graph/schema.js";
import { traceDecision } from "../graph/query.js";

export interface BundleOptions {
  graph: DVEGraph;
  originId: string;
  constraints?: string[];
  outputDir: string;
}

function findNode(graph: DVEGraph, id: string): GraphNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

function sessionGaps(graph: DVEGraph, sessionId: string): GraphNode[] {
  const gapIds = graph.edges
    .filter((e) => e.source === sessionId && e.type === "discovers")
    .map((e) => e.target);
  return graph.nodes.filter((n) => gapIds.includes(n.id));
}

function relatedDecisions(graph: DVEGraph, sessionId: string): GraphNode[] {
  const gaps = sessionGaps(graph, sessionId);
  const ddIds = new Set<string>();
  for (const gap of gaps) {
    const resolves = graph.edges.filter((e) => e.source === gap.id && e.type === "resolves");
    for (const edge of resolves) ddIds.add(edge.target);
  }
  return graph.nodes.filter((n) => ddIds.has(n.id));
}

function relatedAnnotations(graph: DVEGraph, targetId: string): GraphNode[] {
  const annIds = graph.edges
    .filter((e) => e.target === targetId && e.type === "annotates")
    .map((e) => e.source);
  return graph.nodes.filter((n) => annIds.includes(n.id));
}

export function generateBundle(opts: BundleOptions): ContextBundle {
  const { graph, originId, constraints = [], outputDir } = opts;
  const origin = findNode(graph, originId);
  if (!origin) throw new Error(`Node not found: ${originId}`);

  // Find related session
  let sessionNode: GraphNode | undefined;
  let sessionData: Partial<Session> = {};

  if (origin.type === "session") {
    sessionNode = origin;
  } else if (origin.type === "gap") {
    const gapData = origin.data as Partial<Gap>;
    sessionNode = findNode(graph, gapData.session_id ?? "");
  } else if (origin.type === "decision") {
    const ddData = origin.data as Partial<Decision>;
    const sessionRef = ddData.session_refs?.[0];
    if (sessionRef) sessionNode = findNode(graph, sessionRef);
  }

  if (sessionNode) sessionData = sessionNode.data as Partial<Session>;

  // Gather context
  const gaps = sessionNode ? sessionGaps(graph, sessionNode.id) : [];
  const decisions = sessionNode ? relatedDecisions(graph, sessionNode.id) : [];
  const annotations = relatedAnnotations(graph, originId);

  // Determine action
  let suggestedAction: ContextBundle["suggested_action"] = "revisit";
  if (origin.type === "gap") suggestedAction = "deep_dive";
  if (constraints.length > 0) suggestedAction = "new_angle";

  // Sessions date range
  const dates = [sessionData.date].filter(Boolean) as string[];
  const dateRange = dates.length > 0 ? dates.join(" ~ ") : "unknown";

  // Build prompt template
  const originLabel =
    origin.type === "decision"
      ? `${origin.id} (${(origin.data as any).title})`
      : origin.type === "gap"
        ? `Gap "${(origin.data as any).summary?.slice(0, 60)}"`
        : `Session "${sessionData.theme}"`;

  const priorDDs = decisions.map((d) => `${d.id}: ${(d.data as any).title}`);
  const priorGaps = gaps.slice(0, 5).map((g) => {
    const gd = g.data as Partial<Gap>;
    return `${g.id.split("#")[1]}: ${gd.summary?.slice(0, 50)}`;
  });

  let prompt = `${originLabel} を再検討。\n`;
  if (priorDDs.length > 0) prompt += `前回の決定: ${priorDDs.join(", ")}。\n`;
  if (priorGaps.length > 0) prompt += `前回の Gap: ${priorGaps.join("; ")}。\n`;
  if (sessionData.characters?.length) {
    prompt += `前回のキャラ: ${sessionData.characters.join(", ")}。\n`;
  }
  if (constraints.length > 0) {
    prompt += `追加制約: ${constraints.join("; ")}。\n`;
  }
  prompt += `この文脈を踏まえて DGE して。`;

  const bundle: ContextBundle = {
    type: "dve-context-bundle",
    version: "1.0.0",
    origin: {
      node_type: origin.type as any,
      node_id: origin.id,
      file: (origin.data as any).file_path ?? "",
    },
    summary: {
      theme: sessionData.theme ?? "unknown",
      date_range: dateRange,
      prior_decisions: priorDDs,
      prior_gaps: gaps.map((g) => ({
        id: g.id,
        summary: (g.data as any).summary ?? "",
        status: (g.data as any).status ?? "Active",
      })),
      characters_used: sessionData.characters ?? [],
      session_count: 1,
    },
    new_constraints: constraints,
    annotations: annotations.map((a) => ({
      date: (a.data as any).date ?? "",
      action: (a.data as any).action ?? "comment",
      body: (a.data as any).body ?? "",
    })),
    suggested_action: suggestedAction,
    prompt_template: prompt,
  };

  // Save to file
  mkdirSync(outputDir, { recursive: true });
  const slug = originId.replace(/[^a-zA-Z0-9-]/g, "_");
  const filename = `ctx-${new Date().toISOString().split("T")[0]}-${slug}.json`;
  const outPath = path.join(outputDir, filename);
  writeFileSync(outPath, JSON.stringify(bundle, null, 2));

  return bundle;
}
