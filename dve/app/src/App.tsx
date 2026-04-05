import { useState, useEffect, useCallback } from "preact/hooks";
import { GraphContainer } from "./components/GraphContainer";
import { DetailPanel } from "./views/DetailPanel";
import { loadGraph, loadChangelog } from "./lib/graph-loader";
import type { DVEGraph, Changelog, GraphNode } from "./types";

export function App() {
  const [graph, setGraph] = useState<DVEGraph | null>(null);
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [expandedDecisions, setExpandedDecisions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadGraph(), loadChangelog()])
      .then(([g, c]) => {
        setGraph(g);
        setChangelog(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      // Toggle expand for DD nodes
      if (node.type === "decision") {
        setExpandedDecisions((prev) => {
          const next = new Set(prev);
          if (next.has(node.id)) next.delete(node.id);
          else next.add(node.id);
          return next;
        });
      }
    },
    []
  );

  const handleDGERestart = useCallback(
    (node: GraphNode) => {
      const d = node.data as any;
      let prompt = "";
      if (node.type === "decision") {
        prompt = `${node.id} (${d.title}) を再検討。\ncontext: この決定の経緯を踏まえて DGE して。`;
      } else if (node.type === "gap") {
        prompt = `Gap "${d.summary}" を深掘り。\n前回のセッション: ${d.session_id}\nこの Gap を中心に DGE して。`;
      }
      navigator.clipboard.writeText(prompt).then(() => {
        alert("DGE プロンプトをクリップボードにコピーしました。\nClaude Code に貼り付けて実行してください。");
      });
    },
    []
  );

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "18px", marginBottom: "12px" }}>DVE</h1>
        <p style={{ color: "#e53e3e" }}>{error}</p>
        <p style={{ marginTop: "12px", color: "#666", fontSize: "13px" }}>
          Run <code>npx dve build</code> first to generate graph.json
        </p>
      </div>
    );
  }

  if (!graph) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading...</div>
    );
  }

  // Zero-state
  if (graph.stats.sessions === 0 && graph.stats.decisions === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", maxWidth: "500px", margin: "80px auto" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "16px" }}>DVE — Decision Visualization Engine</h1>
        <div style={{ padding: "24px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "16px", marginBottom: "16px" }}>{"\u{1F4ED}"} まだ決定の履歴がありません</p>
          <div style={{ textAlign: "left", fontSize: "14px", lineHeight: 1.8 }}>
            <p><strong>始め方:</strong></p>
            <ol style={{ paddingLeft: "20px" }}>
              <li>DGE セッションを実行 → 「DGE して」と伝える</li>
              <li>設計判断を記録 → 「設計判断を記録する」</li>
              <li>もう一度 <code>npx dve build</code></li>
            </ol>
          </div>
          <p style={{ marginTop: "16px", fontSize: "12px", color: "#999" }}>
            Session: {graph.stats.sessions} | Gap: {graph.stats.gaps} | DD: {graph.stats.decisions}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Header */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "40px", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", background: "#fff", borderBottom: "1px solid #e2e8f0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <strong style={{ fontSize: "14px" }}>DVE</strong>
          <span style={{ fontSize: "12px", color: "#999" }}>
            S:{graph.stats.sessions} G:{graph.stats.gaps} DD:{graph.stats.decisions} A:{graph.stats.annotations}
          </span>
        </div>
        <span style={{ fontSize: "11px", color: "#999" }}>
          {new Date(graph.generated_at).toLocaleString()}
        </span>
      </div>

      {/* Graph (L1) */}
      <div style={{ flex: selectedNode ? "1 1 60%" : "1 1 100%", marginTop: "40px", transition: "flex 0.2s" }}>
        <GraphContainer
          graph={graph}
          changelog={changelog}
          onNodeClick={handleNodeClick}
          expandedDecisions={expandedDecisions}
        />
      </div>

      {/* Detail Panel (L2/L3) */}
      {selectedNode && (
        <div style={{ flex: "0 0 360px", marginTop: "40px", borderLeft: "1px solid #e2e8f0", overflow: "hidden" }}>
          <DetailPanel
            node={selectedNode}
            graph={graph}
            onClose={() => setSelectedNode(null)}
            onDGERestart={handleDGERestart}
          />
        </div>
      )}
    </div>
  );
}
