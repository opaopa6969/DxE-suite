// L2 + L3: Detail panel — shows DD/Gap/Session details + dialogue view

import { useState } from "preact/hooks";
import { AnnotationDialog } from "../components/AnnotationDialog";
import { Markdown } from "../components/Markdown";
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
          {/* DD Content — full markdown rendering */}
          <div style={{ marginBottom: "12px" }}>
            <Markdown text={d.content ?? d.rationale ?? ""} fontSize="13px" />
          </div>
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
          <div style={{ marginBottom: "12px" }}>
            <Markdown text={d.summary ?? ""} fontSize="13px" />
          </div>
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
        <SessionDetail node={node} graph={graph} onDGERestart={onDGERestart} />
      )}

      {node.warnings.length > 0 && (
        <div style={{ marginTop: "12px", padding: "8px", background: "#fffff0", borderRadius: "4px", fontSize: "11px", color: "#d69e2e" }}>
          {"⚠️"} {node.warnings.join("; ")}
        </div>
      )}
    </div>
  );
}

// ─── Session Detail ───

function SessionDetail({ node, graph, onDGERestart }: { node: GraphNode; graph: DVEGraph; onDGERestart: (n: GraphNode) => void }) {
  const d = node.data as any;
  const [expanded, setExpanded] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const content: string | null = d.content ?? null;

  // Gaps in this session
  const gapIds = graph.edges
    .filter((e) => e.source === node.id && e.type === "discovers")
    .map((e) => e.target);
  const gaps = graph.nodes.filter((n) => gapIds.includes(n.id));

  // DDs linked from this session's gaps
  const ddIds = new Set<string>();
  for (const gap of gaps) {
    const resolves = graph.edges.filter((e) => e.source === gap.id && e.type === "resolves");
    for (const r of resolves) ddIds.add(r.target);
  }
  const dds = graph.nodes.filter((n) => ddIds.has(n.id));

  return (
    <>
      <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>{d.theme}</h2>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
        {d.date} | {d.flow} | {d.structure}
      </div>
      <div style={{ fontSize: "12px", marginBottom: "12px" }}>
        🎭 {(d.characters ?? []).join(", ")}
      </div>

      {/* Gaps */}
      {gaps.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4 style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
            Gaps ({gaps.length})
          </h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {gaps.map((g) => {
              const gd = g.data as any;
              return (
                <li key={g.id} style={{ marginBottom: "4px", fontSize: "12px" }}>
                  <span style={{ color: severityColor[gd.severity] ?? "#999", fontWeight: "bold" }}>
                    {gd.severity === "Critical" ? "🔴" : gd.severity === "High" ? "🟠" : "🟡"}{" "}
                  </span>
                  <strong>{g.id.split("#")[1]}</strong>: {(gd.summary ?? "").slice(0, 80)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Decisions */}
      {dds.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4 style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
            Decisions ({dds.length})
          </h4>
          {dds.map((dd) => {
            const ddd = dd.data as any;
            return (
              <div key={dd.id} style={{ fontSize: "12px", marginBottom: "2px" }}>
                📋 {dd.id}: {ddd.title}
              </div>
            );
          })}
        </div>
      )}

      {/* Session content */}
      {content ? (
        <div style={{ marginBottom: "12px" }}>
          <h4 style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
            {content.includes("Scene") || content.includes("先輩") || content.includes("Gap 発見")
              ? "会話劇"
              : "Session Content"}
          </h4>
          <div style={{
            maxHeight: expanded ? "none" : "300px",
            overflow: expanded ? "visible" : "hidden",
            position: "relative",
          }}>
            <Markdown text={content} fontSize="12px" />
            {!expanded && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "60px",
                background: "linear-gradient(transparent, #fff)",
              }} />
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              marginTop: "4px", padding: "4px 8px", fontSize: "11px",
              border: "1px solid #ccc", borderRadius: "4px", background: "#fff", cursor: "pointer",
            }}
          >
            {expanded ? "折りたたむ" : "全文表示"}
          </button>
        </div>
      ) : (
        <div style={{ padding: "12px", background: "#f7fafc", borderRadius: "6px", fontSize: "12px", color: "#666", marginBottom: "12px" }}>
          <p>📭 会話劇テキストは保存されていません。</p>
          <p style={{ marginTop: "4px" }}>DGE session skill の MUST ルール「会話劇は無条件で保存」に従い、次回のセッションから全文が含まれます。</p>
          {d.file_path && <p style={{ marginTop: "4px", color: "#999" }}>📁 {d.file_path}</p>}
        </div>
      )}

      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={() => onDGERestart(node)} style={actionBtnStyle}>
          {"🔄 この文脈でDGE"}
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
