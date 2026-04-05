// Clustering — group decisions by supersedes chains and theme similarity

import type { DVEGraph, GraphNode, Decision } from "./schema.js";

export interface Cluster {
  id: string;
  label: string;
  ddIds: string[];
  gapCount: number;
}

// Group DDs by supersedes chains (connected components)
export function clusterBySupersedes(graph: DVEGraph): Cluster[] {
  const ddNodes = graph.nodes.filter((n) => n.type === "decision");
  const supersedesEdges = graph.edges.filter((e) => e.type === "supersedes");

  // Union-Find
  const parent: Record<string, string> = {};
  for (const dd of ddNodes) parent[dd.id] = dd.id;

  function find(x: string): string {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a: string, b: string) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  for (const edge of supersedesEdges) {
    if (parent[edge.source] !== undefined && parent[edge.target] !== undefined) {
      union(edge.source, edge.target);
    }
  }

  // Group by root
  const groups: Record<string, string[]> = {};
  for (const dd of ddNodes) {
    const root = find(dd.id);
    if (!groups[root]) groups[root] = [];
    groups[root].push(dd.id);
  }

  // Build clusters
  const clusters: Cluster[] = [];
  for (const [root, ddIds] of Object.entries(groups)) {
    // Find the latest DD's title as cluster label
    const latestDD = ddIds
      .map((id) => graph.nodes.find((n) => n.id === id))
      .filter(Boolean)
      .sort((a, b) => ((b!.data as any).date ?? "").localeCompare((a!.data as any).date ?? ""))
      [0];

    const label = (latestDD?.data as any)?.title ?? root;

    // Count related gaps
    const gapCount = ddIds.reduce((sum, ddId) => {
      return sum + graph.edges.filter((e) => e.target === ddId && e.type === "resolves").length;
    }, 0);

    clusters.push({
      id: `cluster-${root}`,
      label: label.slice(0, 60),
      ddIds,
      gapCount,
    });
  }

  return clusters.sort((a, b) => b.gapCount - a.gapCount);
}

// Simple keyword-based theme clustering for DDs not in supersedes chains
export function clusterByTheme(graph: DVEGraph): Cluster[] {
  const ddNodes = graph.nodes.filter((n) => n.type === "decision");
  const keywords: Record<string, string[]> = {};

  for (const dd of ddNodes) {
    const title = ((dd.data as any).title ?? "").toLowerCase();
    // Extract significant words (3+ chars, not common)
    const words = title.split(/[\s\-_\/]+/).filter((w: string) => w.length >= 3);
    for (const word of words) {
      if (!keywords[word]) keywords[word] = [];
      keywords[word].push(dd.id);
    }
  }

  // Find keyword groups with 2+ DDs
  const clusters: Cluster[] = [];
  const used = new Set<string>();
  for (const [word, ids] of Object.entries(keywords)) {
    if (ids.length < 2) continue;
    const uniqueIds = ids.filter((id) => !used.has(id));
    if (uniqueIds.length < 2) continue;

    for (const id of uniqueIds) used.add(id);
    clusters.push({
      id: `theme-${word}`,
      label: word,
      ddIds: uniqueIds,
      gapCount: 0,
    });
  }

  return clusters;
}
