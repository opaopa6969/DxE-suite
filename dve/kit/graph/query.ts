// Graph queries — traceDecision, impactOf, orphanGaps, overturned

import type { DVEGraph, GraphNode, Edge, Gap, Decision } from "./schema.js";

// Trace a decision back to its originating sessions and gaps
export function traceDecision(graph: DVEGraph, ddId: string): GraphNode[] {
  const chain: GraphNode[] = [];
  const visited = new Set<string>();

  function walkBack(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node) chain.push(node);

    // Find edges where this node is the target
    const incoming = graph.edges.filter((e) => e.target === nodeId);
    for (const edge of incoming) {
      walkBack(edge.source);
    }
  }

  walkBack(ddId);
  return chain;
}

// Forward traversal — find all nodes affected by a change to this node
export function impactOf(graph: DVEGraph, nodeId: string): GraphNode[] {
  const impacted: GraphNode[] = [];
  const visited = new Set<string>();

  function walkForward(nid: string) {
    if (visited.has(nid)) return;
    visited.add(nid);

    const outgoing = graph.edges.filter((e) => e.source === nid);
    for (const edge of outgoing) {
      const target = graph.nodes.find((n) => n.id === edge.target);
      if (target && !visited.has(target.id)) {
        impacted.push(target);
        walkForward(target.id);
      }
    }
  }

  walkForward(nodeId);
  return impacted;
}

// Orphan gaps — gaps not linked to any decision
export function orphanGaps(graph: DVEGraph): GraphNode[] {
  const gapNodes = graph.nodes.filter((n) => n.type === "gap");
  const resolvedGapIds = new Set(
    graph.edges.filter((e) => e.type === "resolves").map((e) => e.source)
  );
  return gapNodes.filter((g) => !resolvedGapIds.has(g.id));
}

// Overturned decisions + their impact
export function overturned(graph: DVEGraph): { decision: GraphNode; impact: GraphNode[] }[] {
  const overturnedDDs = graph.nodes.filter(
    (n) => n.type === "decision" && (n.data as Decision).status === "overturned"
  );
  return overturnedDDs.map((dd) => ({
    decision: dd,
    impact: impactOf(graph, dd.id),
  }));
}

// Search nodes by keyword
export function search(graph: DVEGraph, keyword: string): GraphNode[] {
  const lower = keyword.toLowerCase();
  return graph.nodes.filter((n) => {
    const data = n.data as any;
    const searchFields = [
      data.title, data.theme, data.summary, data.body, data.rationale,
      n.id,
    ].filter(Boolean);
    return searchFields.some((f: string) => f.toLowerCase().includes(lower));
  });
}
