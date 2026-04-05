import { useState, useEffect, useCallback } from "preact/hooks";
import { GraphContainer } from "./components/GraphContainer";
import { DetailPanel } from "./views/DetailPanel";
import { SearchBar } from "./components/SearchBar";
import { ProjectList } from "./views/ProjectList";
import { StateChart } from "./views/StateChart";
import { CoverageView } from "./views/CoverageView";
import { loadGraph, loadChangelog } from "./lib/graph-loader";
import type { DVEGraph, Changelog, GraphNode } from "./types";

export function App() {
  const [graph, setGraph] = useState<DVEGraph | null>(null);
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [expandedDecisions, setExpandedDecisions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sideTab, setSideTab] = useState<"detail" | "state" | "coverage">("detail");
  const [projectIndex, setProjectIndex] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string | null | undefined>(undefined);
  // undefined = not determined yet, null = all projects, string = specific project

  useEffect(() => {
    // Check if multi-project
    fetch("./projects.json")
      .then((res) => res.ok ? res.json() : null)
      .then((idx) => {
        if (idx && idx.projects?.length > 1) {
          setProjectIndex(idx);
          // Don't auto-load graph yet — show project list
        } else {
          // Single project — load directly
          setSelectedProject("__single__");
          Promise.all([loadGraph(), loadChangelog()])
            .then(([g, c]) => { setGraph(g); setChangelog(c); })
            .catch((e) => setError(e.message));
        }
      })
      .catch(() => {
        // No projects.json — single project
        setSelectedProject("__single__");
        Promise.all([loadGraph(), loadChangelog()])
          .then(([g, c]) => { setGraph(g); setChangelog(c); })
          .catch((e) => setError(e.message));
      });
  }, []);

  const handleSelectProject = useCallback((name: string | null) => {
    setSelectedProject(name);
    setSelectedNode(null);
    setExpandedDecisions(new Set());
    setSearchQuery("");

    const graphFile = name ? `./graph-${name}.json` : "./graph.json";
    const clFile = name ? `./changelog-${name}.json` : "./changelog.json";

    Promise.all([
      fetch(graphFile).then((r) => r.json()),
      fetch(clFile).then((r) => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([g, c]) => { setGraph(g); setChangelog(c); })
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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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

  // Multi-project: show project list
  if (projectIndex && selectedProject === undefined) {
    return <ProjectList index={projectIndex} onSelectProject={handleSelectProject} />;
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
          {projectIndex && (
            <button
              onClick={() => { setSelectedProject(undefined); setGraph(null); }}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px", color: "#4299e1" }}
            >
              &larr;
            </button>
          )}
          <strong style={{ fontSize: "14px" }}>
            DVE{selectedProject && selectedProject !== "__single__" ? ` — ${selectedProject}` : ""}
            {selectedProject === null ? " — All Projects" : ""}
          </strong>
          <span style={{ fontSize: "12px", color: "#999" }}>
            S:{graph.stats.sessions} G:{graph.stats.gaps} DD:{graph.stats.decisions}
            {graph.stats.specs ? ` Spec:${graph.stats.specs}` : ""} A:{graph.stats.annotations}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <SearchBar onSearch={handleSearch} />
          {["detail", "state", "coverage"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSideTab(tab as any)}
              style={{
                padding: "2px 8px", fontSize: "11px", borderRadius: "4px", cursor: "pointer",
                border: sideTab === tab ? "1px solid #4299e1" : "1px solid #e2e8f0",
                background: sideTab === tab ? "#ebf8ff" : "#fff",
                color: sideTab === tab ? "#2b6cb0" : "#666",
              }}
            >
              {tab === "detail" ? "Detail" : tab === "state" ? "State" : "Coverage"}
            </button>
          ))}
          <span style={{ fontSize: "11px", color: "#999" }}>
            {new Date(graph.generated_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Graph (L1) */}
      <div style={{ flex: selectedNode ? "1 1 60%" : "1 1 100%", marginTop: "40px", transition: "flex 0.2s" }}>
        <GraphContainer
          graph={graph}
          changelog={changelog}
          onNodeClick={handleNodeClick}
          expandedDecisions={expandedDecisions}
          searchQuery={searchQuery}
        />
      </div>

      {/* Side Panel */}
      {(selectedNode || sideTab !== "detail") && (
        <div style={{ flex: "0 0 360px", marginTop: "40px", borderLeft: "1px solid #e2e8f0", overflow: "hidden" }}>
          {sideTab === "detail" && (
            <DetailPanel
              node={selectedNode}
              graph={graph}
              onClose={() => setSelectedNode(null)}
              onDGERestart={handleDGERestart}
            />
          )}
          {sideTab === "state" && <StateChart />}
          {sideTab === "coverage" && <CoverageView />}
        </div>
      )}
    </div>
  );
}
