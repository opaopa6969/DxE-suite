// DVE Data Model v2 — Node/Edge/Query types

// ─── Nodes ───

export interface Session {
  id: string;
  date: string;
  theme: string;
  flow: "quick" | "design-review" | "brainstorm" | string;
  structure: "roundtable" | "tribunal" | "wargame" | "pitch" | "consult" | "investigation" | string;
  characters: string[];
  file_path: string;
}

export interface Gap {
  id: string;           // "{session_id}#G-{n}"
  session_id: string;
  summary: string;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Unknown";
  status: "Active" | "Void" | "Archived";
  line_ref: number;
  discovered_by: string[];
}

export interface Decision {
  id: string;           // "DD-001"
  title: string;
  date: string;
  rationale: string;
  status: "active" | "overturned";
  supersedes: string[];
  superseded_by: string[];
  gap_refs: string[];
  session_refs: string[];
  file_path: string;
}

export interface Spec {
  id: string;
  title: string;
  type: "UC" | "TECH" | "DD" | "DQ" | "ACT";
  status: "draft" | "reviewed" | "migrated";
  decision_refs: string[];
  migrated_to?: string;
  file_path: string;
}

export type AnnotationAction = "comment" | "fork" | "overturn" | "constrain" | "drift";

export interface Annotation {
  id: string;           // "A-001"
  target: { type: "session" | "gap" | "decision"; id: string };
  target_line?: number;
  author: string;
  date: string;
  body: string;
  action: AnnotationAction;
}

// ─── Edges ───

export type EdgeType = "discovers" | "resolves" | "supersedes" | "annotates" | "produces" | "implements";
export type Confidence = "explicit" | "inferred";

export interface Edge {
  source: string;
  target: string;
  type: EdgeType;
  confidence: Confidence;
  evidence?: string;
}

// ─── Graph Node wrapper ───

export type NodeType = "session" | "gap" | "decision" | "spec" | "annotation";

export interface GraphNode {
  type: NodeType;
  id: string;
  data: Session | Gap | Decision | Spec | Annotation;
  confidence: number;   // 0.0 - 1.0
  warnings: string[];
}

// ─── Graph output ───

export interface DVEGraph {
  version: string;
  generated_at: string;
  stats: {
    sessions: number;
    gaps: number;
    decisions: number;
    annotations: number;
  };
  nodes: GraphNode[];
  edges: Edge[];
  warnings: { file: string; message: string }[];
}

// ─── Parse result ───

export interface ParseResult<T> {
  node: Partial<T>;
  confidence: number;
  warnings: string[];
  source: { file: string; line?: number };
}

// ─── Changelog ───

export interface Changelog {
  since: string;
  new_nodes: string[];
  removed_nodes: string[];
  changed_statuses: { id: string; from: string; to: string }[];
}

// ─── ContextBundle ───

export interface ContextBundle {
  type: "dve-context-bundle";
  version: "1.0.0";
  origin: {
    node_type: NodeType;
    node_id: string;
    file: string;
  };
  summary: {
    theme: string;
    date_range: string;
    prior_decisions: string[];
    prior_gaps: { id: string; summary: string; status: string }[];
    characters_used: string[];
    session_count: number;
    key_dialogue_excerpt?: string;
  };
  new_constraints: string[];
  annotations: { date: string; action: string; body: string }[];
  suggested_action: "revisit" | "deep_dive" | "new_angle" | "override";
  prompt_template: string;
}
