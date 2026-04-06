import { useState, useEffect, useCallback } from "preact/hooks";
import { GraphContainer } from "./components/GraphContainer";
import { DetailPanel } from "./views/DetailPanel";
import { SearchBar } from "./components/SearchBar";
import { ProjectList } from "./views/ProjectList";
import { StateChart } from "./views/StateChart";
import { CoverageView } from "./views/CoverageView";
import { Onboarding } from "./components/Onboarding";
import { Tooltip } from "./components/Tooltip";
import { ScanView } from "./views/ScanView";
import { loadGraph, loadChangelog } from "./lib/graph-loader";
import type { DVEGraph, Changelog, GraphNode } from "./types";

function getHashRoute(): { type?: string; id?: string; project?: string } {
  // Support both hash routes and path-based URLs
  // /sessions/xxx.md → redirect to /#/session/xxx
  const path = window.location.pathname;
  if (path !== "/" && path !== "/index.html") {
    const match = path.match(/\/(sessions|decisions|specs|annotations)\/(.*?)(?:\.md)?$/);
    if (match) {
      const typeMap: Record<string, string> = {
        sessions: "session", decisions: "decision", specs: "spec", annotations: "annotation",
      };
      window.location.replace(`/#/${typeMap[match[1]] ?? match[1]}/${match[2]}`);
      return { type: typeMap[match[1]], id: match[2] };
    }
  }

  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const parts = hash.split("/").filter(Boolean);
  // /#/session/xxx or /#/dd/DD-001 or /#/spec/dve-data-model or /#/project/name
  if (parts.length >= 2) {
    return { type: parts[0], id: parts.slice(1).join("/") };
  }
  if (parts.length === 1) {
    return { id: parts[0] };
  }
  return {};
}

function setHashRoute(type: string, id: string) {
  window.location.hash = `#/${type}/${id}`;
}

export function App() {
  const [graph, setGraph] = useState<DVEGraph | null>(null);
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [expandedDecisions, setExpandedDecisions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sideTab, setSideTab] = useState<"detail" | "state" | "coverage">("detail");
  const [showScan, setShowScan] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("dve-onboarding-done"); } catch { return true; }
  });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
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

  // Resolve hash route on graph load
  useEffect(() => {
    if (!graph) return;
    const route = getHashRoute();
    if (route.id) {
      // Find node by id (try various patterns)
      const node = graph.nodes.find((n) =>
        n.id === route.id ||
        n.id.endsWith(`/${route.id}`) ||
        n.id.includes(route.id!) ||
        (n.data as any).file_path?.includes(route.id!)
      );
      if (node) {
        setSelectedNode(node);
        setSideTab("detail");
        if (node.type === "decision" || node.type === "dialogue") {
          setExpandedDecisions((prev) => new Set([...prev, node.id]));
        }
      }
    }
  }, [graph]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      setSideTab("detail");
      setHashRoute(node.type, node.id);
      // Toggle expand for DD and dialogue nodes
      if (node.type === "decision" || node.type === "dialogue") {
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

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try { localStorage.setItem("dve-onboarding-done", "1"); } catch {}
  }, []);

  const buildContextPrompt = useCallback(
    (node: GraphNode, g: DVEGraph): string => {
      const d = node.data as any;
      const lines: string[] = [];

      if (node.type === "decision") {
        // Find related gaps
        const gapIds = g.edges
          .filter((e) => e.target === node.id && e.type === "resolves")
          .map((e) => e.source);
        const gaps = g.nodes.filter((n) => gapIds.includes(n.id));

        // Find sessions
        const sessionIds = new Set<string>();
        for (const gap of gaps) {
          const disc = g.edges.find((e) => e.target === gap.id && e.type === "discovers");
          if (disc) sessionIds.add(disc.source);
        }
        const sessions = g.nodes.filter((n) => sessionIds.has(n.id));

        // Find supersedes chain
        const supersedes = g.edges
          .filter((e) => e.source === node.id && e.type === "supersedes")
          .map((e) => e.target);

        // Find annotations
        const annIds = g.edges
          .filter((e) => e.target === node.id && e.type === "annotates")
          .map((e) => e.source);
        const annotations = g.nodes.filter((n) => annIds.includes(n.id));

        lines.push(`${node.id} (${d.title}) を再検討。`);
        lines.push("");
        lines.push("## 決定の経緯");
        lines.push(`Rationale: ${d.rationale ?? "N/A"}`);
        if (supersedes.length > 0) {
          lines.push(`Supersedes: ${supersedes.join(", ")}`);
        }
        lines.push("");

        if (gaps.length > 0) {
          lines.push(`## 関連 Gap (${gaps.length}件)`);
          for (const gap of gaps) {
            const gd = gap.data as any;
            lines.push(`- ${gap.id.split("#")[1] ?? gap.id} (${gd.severity}): ${gd.summary}`);
          }
          lines.push("");
        }

        if (sessions.length > 0) {
          const s = sessions[0].data as any;
          lines.push(`## セッション情報`);
          lines.push(`テーマ: ${s.theme ?? "N/A"}`);
          lines.push(`キャラ: ${(s.characters ?? []).join(", ")}`);
          lines.push(`日付: ${s.date ?? "N/A"}`);
          lines.push("");
        }

        if (annotations.length > 0) {
          lines.push(`## Annotation`);
          for (const ann of annotations) {
            const ad = ann.data as any;
            lines.push(`- [${ad.action}] ${ad.body}`);
          }
          lines.push("");
        }

        lines.push("上記の経緯を踏まえて DGE して。");

      } else if (node.type === "gap") {
        // Find session
        const disc = g.edges.find((e) => e.target === node.id && e.type === "discovers");
        const session = disc ? g.nodes.find((n) => n.id === disc.source) : null;
        const sd = session?.data as any;

        // Find related DDs
        const ddIds = g.edges
          .filter((e) => e.source === node.id && e.type === "resolves")
          .map((e) => e.target);
        const dds = g.nodes.filter((n) => ddIds.includes(n.id));

        lines.push(`Gap "${d.summary}" を深掘り。`);
        lines.push("");
        lines.push(`Severity: ${d.severity} | Category: ${d.category ?? "N/A"} | Status: ${d.status}`);
        lines.push("");

        if (session) {
          lines.push(`## 元のセッション`);
          lines.push(`テーマ: ${sd.theme ?? "N/A"}`);
          lines.push(`キャラ: ${(sd.characters ?? []).join(", ")}`);
          lines.push(`日付: ${sd.date ?? "N/A"}`);
          lines.push("");
        }

        if (dds.length > 0) {
          lines.push(`## 関連 DD`);
          for (const dd of dds) {
            const ddd = dd.data as any;
            lines.push(`- ${dd.id}: ${ddd.title}`);
          }
          lines.push("");
        }

        lines.push("この Gap を中心に DGE して。");
      }

      return lines.join("\n");
    },
    []
  );

  const handleDGERestart = useCallback(
    (node: GraphNode) => {
      if (!graph) return;
      const prompt = buildContextPrompt(node, graph);
      navigator.clipboard.writeText(prompt).then(() => {
        alert("DGE プロンプトをクリップボードにコピーしました。\nClaude Code に貼り付けて実行してください。");
      });
    },
    [graph, buildContextPrompt]
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

  // Scan view
  if (showScan) {
    return <ScanView onRegistered={() => { setShowScan(false); window.location.reload(); }} />;
  }

  // Multi-project: show project list
  if (projectIndex && selectedProject === undefined) {
    return (
      <div>
        <ProjectList index={projectIndex} onSelectProject={handleSelectProject} />
        <div style={{ textAlign: "center", padding: "0 0 24px" }}>
          <button
            onClick={() => setShowScan(true)}
            style={{
              padding: "8px 20px", fontSize: "13px", border: "1px solid #e2e8f0",
              borderRadius: "6px", background: "#fff", cursor: "pointer", color: "#666",
            }}
          >
            🔍 Scan for more projects
          </button>
        </div>
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
          <button
            onClick={() => setShowScan(true)}
            style={{
              marginTop: "12px", padding: "8px 16px", fontSize: "13px",
              border: "1px solid #4299e1", borderRadius: "6px",
              background: "#ebf8ff", color: "#2b6cb0", cursor: "pointer",
            }}
          >
            🔍 Scan for existing projects
          </button>
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
          <button
            onClick={() => setShowScan(true)}
            style={{
              padding: "2px 8px", fontSize: "11px", borderRadius: "4px", cursor: "pointer",
              border: "1px solid #e2e8f0", background: "#fff", color: "#666",
            }}
          >🔍 Scan</button>
          <button
            onClick={() => setShowOnboarding(true)}
            style={{
              border: "1px solid #e2e8f0", background: "#fff", borderRadius: "50%",
              width: "24px", height: "24px", fontSize: "12px", cursor: "pointer", color: "#666",
            }}
            title="Help"
          >?</button>
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
          onNodeHover={(node, pos) => { setHoveredNode(node); setHoverPos(pos); }}
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

      {/* Tooltip on hover */}
      <Tooltip node={hoveredNode} position={hoverPos} />

      {/* Onboarding */}
      {showOnboarding && <Onboarding onDismiss={dismissOnboarding} />}
    </div>
  );
}
