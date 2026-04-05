// Shared types matching dve/kit/graph/schema.ts (view-layer subset)

export interface GraphNode {
  type: "session" | "gap" | "decision" | "annotation";
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
  stats: { sessions: number; gaps: number; decisions: number; annotations: number };
  nodes: GraphNode[];
  edges: Edge[];
  warnings: { file: string; message: string }[];
}

export interface Changelog {
  since: string;
  new_nodes: string[];
  removed_nodes: string[];
  changed_statuses: { id: string; from: string; to: string }[];
}
