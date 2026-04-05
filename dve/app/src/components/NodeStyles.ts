// Cytoscape.js node/edge styles

export const cytoscapeStyles = [
  // ─── Decision nodes ───
  {
    selector: 'node[type="decision"]',
    style: {
      "label": "data(label)",
      "text-wrap": "wrap" as const,
      "text-max-width": "140px",
      "font-size": "11px",
      "text-valign": "center" as const,
      "text-halign": "center" as const,
      "background-color": "#fff",
      "border-width": 2,
      "border-color": "#333",
      "shape": "roundrectangle" as const,
      "width": "data(width)",
      "height": 50,
      "padding": "8px",
    },
  },
  {
    selector: 'node[type="decision"][?overturned]',
    style: {
      "border-color": "#e53e3e",
      "background-color": "#fff5f5",
      "text-decoration": "line-through" as const,
    },
  },
  {
    selector: 'node[type="decision"][?drifted]',
    style: {
      "border-style": "dashed" as const,
      "border-color": "#d69e2e",
      "background-color": "#fffff0",
    },
  },
  // ─── Gap nodes ───
  {
    selector: 'node[type="gap"]',
    style: {
      "label": "data(label)",
      "text-wrap": "wrap" as const,
      "text-max-width": "120px",
      "font-size": "9px",
      "text-valign": "center" as const,
      "text-halign": "center" as const,
      "background-color": "#fff",
      "border-width": 1,
      "border-color": "#999",
      "shape": "ellipse" as const,
      "width": 30,
      "height": 30,
    },
  },
  {
    selector: 'node[type="gap"][severity="Critical"]',
    style: { "border-color": "#e53e3e", "border-width": 2, "background-color": "#fff5f5" },
  },
  {
    selector: 'node[type="gap"][severity="High"]',
    style: { "border-color": "#dd6b20", "border-width": 2, "background-color": "#fffaf0" },
  },
  {
    selector: 'node[type="gap"][severity="Medium"]',
    style: { "border-color": "#d69e2e" },
  },
  // ─── Session nodes ───
  {
    selector: 'node[type="session"]',
    style: {
      "label": "data(label)",
      "text-wrap": "wrap" as const,
      "text-max-width": "120px",
      "font-size": "10px",
      "text-valign": "center" as const,
      "text-halign": "center" as const,
      "background-color": "#ebf8ff",
      "border-width": 1,
      "border-color": "#4299e1",
      "shape": "roundrectangle" as const,
      "width": 120,
      "height": 40,
    },
  },
  // ─── Annotation nodes ───
  {
    selector: 'node[type="annotation"]',
    style: {
      "label": "data(label)",
      "font-size": "8px",
      "background-color": "#fefcbf",
      "border-width": 1,
      "border-color": "#d69e2e",
      "shape": "diamond" as const,
      "width": 20,
      "height": 20,
    },
  },
  // ─── NEW badge ───
  {
    selector: "node[?isNew]",
    style: {
      "border-width": 3,
      "border-color": "#38a169",
    },
  },
  // ─── Hidden (collapsed) ───
  {
    selector: "node.hidden",
    style: { "display": "none" as const },
  },
  // ─── Dimmed (search non-match) ───
  {
    selector: "node.dimmed",
    style: { "opacity": 0.25 },
  },
  // ─── Edges ───
  {
    selector: "edge",
    style: {
      "width": 1.5,
      "line-color": "#aaa",
      "target-arrow-color": "#aaa",
      "target-arrow-shape": "triangle" as const,
      "curve-style": "bezier" as const,
      "arrow-scale": 0.8,
    },
  },
  {
    selector: 'edge[type="supersedes"]',
    style: {
      "line-color": "#e53e3e",
      "target-arrow-color": "#e53e3e",
      "line-style": "dashed" as const,
      "width": 2,
    },
  },
  {
    selector: 'edge[type="resolves"]',
    style: {
      "line-color": "#38a169",
      "target-arrow-color": "#38a169",
    },
  },
  {
    selector: 'edge[confidence="inferred"]',
    style: {
      "line-style": "dotted" as const,
      "opacity": 0.6,
    },
  },
];
