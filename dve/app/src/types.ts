// Shared types matching dve/kit/graph/schema.ts (view-layer subset)

export interface GraphNode {
  type: "session" | "dialogue" | "gap" | "decision" | "annotation" | "spec";
  id: string;
  data: Record<string, any>;
  confidence: number;
  warnings: string[];
}

export interface Edge {
  source: string;
  target: string;
  type: string;
  confidence: "explicit" | "inferred";
  evidence?: string;
}

export interface DVEGraph {
  version: string;
  generated_at: string;
  stats: { sessions: number; gaps: number; decisions: number; annotations: number; specs?: number };
  nodes: GraphNode[];
  edges: Edge[];
  warnings: { file: string; message: string }[];
  glossary?: { term: string; definition: string; source: string; aliases?: string[] }[];
}

export interface Changelog {
  since: string;
  new_nodes: string[];
  removed_nodes: string[];
  changed_statuses: { id: string; from: string; to: string }[];
}
