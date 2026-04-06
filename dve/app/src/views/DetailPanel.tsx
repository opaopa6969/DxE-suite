// L2 + L3: Detail panel — shows DD/Gap/Session details + dialogue view

import { useState } from "preact/hooks";
import { AnnotationDialog } from "../components/AnnotationDialog";
import type { GraphNode, DVEGraph, Edge } from "../types";

interface Props {
  node: GraphNode | null;
  graph: DVEGraph;
  onClose: () => void;
  onDGERestart: (node: GraphNode) => void;
}

const severityColor: Record<string, string> = {
  Critical: "#e53e3e",
  High: "#dd6b20",
  Medium: "#d69e2e",
  Low: "#38a169",
  Unknown: "#999",
};

function RelatedGaps({ ddId, graph }: { ddId: string; graph: DVEGraph }) {
  const gapIds = graph.edges
    .filter((e) => e.target === ddId && e.type === "resolves")
    .map((e) => e.source);
  const gaps = graph.nodes.filter((n) => gapIds.includes(n.id));

  if (gaps.length === 0) return <p style={{ color: "#999", fontSize: "12px" }}>No linked gaps</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {gaps.map((g) => {
        const d = g.data as any;
        return (
          <li key={g.id} style={{ marginBottom: "6px", fontSize: "13px" }}>
            <span style={{ color: severityColor[d.severity] ?? "#999", fontWeight: "bold" }}>
              {d.severity === "Critical" ? "\u{1F534}" : d.severity === "High" ? "\u{1F7E0}" : "\u{1F7E1}"}{" "}
            </span>
            <strong>{g.id.split("#")[1]}</strong>: {d.summary?.slice(0, 80)}
          </li>
        );
      })}
    </ul>
  );
}

function RelatedSessions({ ddId, graph }: { ddId: string; graph: DVEGraph }) {
  const sessionRefs = (graph.nodes.find((n) => n.id === ddId)?.data as any)?.session_refs ?? [];
  const sessions = graph.nodes.filter((n) => n.type === "session" && sessionRefs.includes(n.id));

  if (sessions.length === 0) return null;

  return (
    <div style={{ marginTop: "12px" }}>
      <h4 style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Sessions</h4>
      {sessions.map((s) => {
        const d = s.data as any;
        return (
          <div key={s.id} style={{ fontSize: "12px", color: "#4299e1", marginBottom: "2px" }}>
            {d.date} — {d.theme} ({(d.characters ?? []).join(", ")})
          </div>
        );
      })}
    </div>
  );
}

export function DetailPanel({ node, graph, onClose, onDGERestart }: Props) {
  const [showAnnotation, setShowAnnotation] = useState(false);

  if (!node) {
    return (
      <div style={panelStyle}>
        <p style={{ color: "#999", padding: "20px", textAlign: "center" }}>
          Click a node to see details
        </p>
      </div>
    );
  }

  const d = node.data as any;

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "15px", margin: 0 }}>{node.id}</h3>
        <button onClick={onClose} style={closeBtnStyle}>&times;</button>
      </div>

      {node.type === "decision" && (
        <>
          <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>{d.title}</h2>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
            {d.date} | {d.status}
            {d.supersedes?.length > 0 && ` | supersedes: ${d.supersedes.join(", ")}`}
          </div>
          {d.rationale && (
            <div style={{ marginBottom: "12px" }}>
              <h4 style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Rationale</h4>
              <p style={{ fontSize: "13px", lineHeight: 1.5 }}>{d.rationale}</p>
            </div>
          )}
          <div style={{ marginBottom: "12px" }}>
            <h4 style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
              Gaps ({graph.edges.filter((e) => e.target === node.id && e.type === "resolves").length})
            </h4>
            <RelatedGaps ddId={node.id} graph={graph} />
          </div>
          <RelatedSessions ddId={node.id} graph={graph} />
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => onDGERestart(node)} style={actionBtnStyle}>
              {"🔄 DGEで再検討"}
            </button>
            <button onClick={() => setShowAnnotation(true)} style={actionBtnStyle}>
              {"💬 コメント"}
            </button>
          </div>
          {showAnnotation && (
            <AnnotationDialog
              targetId={node.id}
              onClose={() => setShowAnnotation(false)}
              onCreated={() => { setShowAnnotation(false); alert("Annotation saved. Run dve build to update graph."); }}
            />
          )}
        </>
      )}

      {node.type === "gap" && (
        <>
          <div style={{ marginBottom: "8px" }}>
            <span style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "bold",
              color: "#fff",
              backgroundColor: severityColor[d.severity] ?? "#999",
            }}>
              {d.severity}
            </span>
            {d.category && (
              <span style={{ marginLeft: "8px", fontSize: "12px", color: "#666" }}>{d.category}</span>
            )}
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, marginBottom: "12px" }}>{d.summary}</p>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Status: {d.status}
          </div>
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => onDGERestart(node)} style={actionBtnStyle}>
              {"🔄 このGapでDGE"}
            </button>
            <button onClick={() => setShowAnnotation(true)} style={actionBtnStyle}>
              {"💬 コメント"}
            </button>
          </div>
          {showAnnotation && (
            <AnnotationDialog
              targetId={node.id}
              onClose={() => setShowAnnotation(false)}
              onCreated={() => { setShowAnnotation(false); alert("Annotation saved. Run dve build to update graph."); }}
            />
          )}
        </>
      )}

      {node.type === "session" && (
        <>
          <div style={{ fontSize: "13px", marginBottom: "8px" }}>
            <strong>{d.theme}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
            {d.date} | {d.flow} | {d.structure}
          </div>
          <div style={{ fontSize: "12px" }}>
            Characters: {(d.characters ?? []).join(", ")}
          </div>
        </>
      )}

      {node.warnings.length > 0 && (
        <div style={{ marginTop: "12px", padding: "8px", background: "#fffff0", borderRadius: "4px", fontSize: "11px", color: "#d69e2e" }}>
          {"⚠️"} {node.warnings.join("; ")}
        </div>
      )}
    </div>
  );
}

const panelStyle: Record<string, any> = {
  width: "100%",
  height: "100%",
  padding: "16px",
  overflowY: "auto",
  background: "#fff",
  fontSize: "14px",
};

const closeBtnStyle: Record<string, any> = {
  border: "none",
  background: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#999",
};

const actionBtnStyle: Record<string, any> = {
  padding: "6px 12px",
  fontSize: "12px",
  border: "1px solid #4299e1",
  borderRadius: "4px",
  background: "#ebf8ff",
  color: "#2b6cb0",
  cursor: "pointer",
};
