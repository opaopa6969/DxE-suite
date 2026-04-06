// Cytoscape.js wrapper — mounts graph into a DOM container

import { useEffect, useRef } from "preact/hooks";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { cytoscapeStyles } from "./NodeStyles";
import type { DVEGraph, Changelog, GraphNode } from "../types";

cytoscape.use(dagre);

interface Props {
  graph: DVEGraph;
  changelog: Changelog | null;
  onNodeClick: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null, pos: { x: number; y: number } | null) => void;
  expandedDecisions: Set<string>;
  searchQuery?: string;
}

function gapCount(graph: DVEGraph, ddId: string): number {
  return graph.edges.filter((e) => e.target === ddId && e.type === "resolves").length;
}

export function GraphContainer({ graph, changelog, onNodeClick, onNodeHover, expandedDecisions, searchQuery }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const newIds = new Set(changelog?.new_nodes ?? []);
    const elements: cytoscape.ElementDefinition[] = [];
    const sq = (searchQuery ?? "").toLowerCase();

    // Nodes
    for (const node of graph.nodes) {
      const d = node.data as any;
      const isDD = node.type === "decision";
      const isGap = node.type === "gap";
      const isSession = node.type === "session";

      // Default: only show DD nodes. Gaps/sessions shown if their DD is expanded
      let hidden = false;
      if (isGap) {
        // Find the DD this gap resolves to
        const resolvesEdge = graph.edges.find((e) => e.source === node.id && e.type === "resolves");
        const parentDD = resolvesEdge?.target;
        // Also check discovers edge (session → gap)
        const sessionEdge = graph.edges.find((e) => e.target === node.id && e.type === "discovers");
        const parentSession = sessionEdge?.source;
        hidden = !expandedDecisions.has(parentDD ?? "") && !expandedDecisions.has(parentSession ?? "");
        // If gap is orphan (no DD), always show
        const hasResolves = graph.edges.some((e) => e.source === node.id && e.type === "resolves");
        if (!hasResolves) hidden = false;
      }
      if (isSession) {
        hidden = !expandedDecisions.has(node.id);
        // Show session if any of its gaps are visible through an expanded DD
        const sessionGaps = graph.edges.filter((e) => e.source === node.id && e.type === "discovers").map((e) => e.target);
        const anyGapVisible = sessionGaps.some((gid) => {
          const gapResolves = graph.edges.find((e) => e.source === gid && e.type === "resolves");
          return gapResolves && expandedDecisions.has(gapResolves.target);
        });
        if (anyGapVisible) hidden = false;
      }

      let label = "";
      if (isDD) label = `${node.id}\n${(d.title ?? "").slice(0, 40)}`;
      else if (isGap) label = `G-${node.id.split("#G-")[1] ?? ""}`;
      else if (isSession) label = d.theme ?? node.id;
      else label = d.action ?? node.id;

      // Search match
      const searchFields = [d.title, d.theme, d.summary, d.body, d.rationale, node.id]
        .filter(Boolean)
        .map((f: string) => f.toLowerCase());
      const matchesSearch = !sq || searchFields.some((f) => f.includes(sq));

      const width = isDD ? Math.max(100, 100 + gapCount(graph, node.id) * 15) : undefined;

      elements.push({
        data: {
          id: node.id,
          label,
          type: node.type,
          severity: d.severity,
          overturned: d.status === "overturned" ? true : undefined,
          drifted: false, // TODO: check annotations
          isNew: newIds.has(node.id) && (changelog?.since ?? "") !== "" ? true : undefined,
          width,
          _raw: node,
        },
        classes: hidden ? "hidden" : (sq && !matchesSearch) ? "dimmed" : undefined,
      });
    }

    // Edges
    for (const edge of graph.edges) {
      elements.push({
        data: {
          id: `${edge.source}->${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          confidence: edge.confidence,
        },
      });
    }

    // Create / update cytoscape
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: cytoscapeStyles as any,
      layout: {
        name: "dagre",
        rankDir: "LR",
        nodeSep: 40,
        rankSep: 80,
        padding: 30,
      } as any,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cy.on("tap", "node", (evt) => {
      const nodeData = evt.target.data("_raw") as GraphNode;
      if (nodeData) onNodeClick(nodeData);
    });

    cy.on("mouseover", "node", (evt) => {
      const nodeData = evt.target.data("_raw") as GraphNode;
      const pos = evt.renderedPosition;
      if (nodeData && onNodeHover) onNodeHover(nodeData, { x: pos.x, y: pos.y + 40 });
    });

    cy.on("mouseout", "node", () => {
      if (onNodeHover) onNodeHover(null, null);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graph, changelog, expandedDecisions, searchQuery]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#fafafa",
        borderRight: "1px solid #e2e8f0",
      }}
    />
  );
}
