// Project list view — overview of all projects

interface ProjectInfo {
  name: string;
  path: string;
  graphFile: string;
  stats: {
    sessions: number;
    gaps: number;
    decisions: number;
    annotations: number;
    specs?: number;
  };
}

interface ProjectIndex {
  version: string;
  generated_at: string;
  projects: ProjectInfo[];
}

interface Props {
  index: ProjectIndex;
  onSelectProject: (name: string | null) => void;  // null = all projects (merged)
}

export function ProjectList({ index, onSelectProject }: Props) {
  const totalSessions = index.projects.reduce((s, p) => s + p.stats.sessions, 0);
  const totalGaps = index.projects.reduce((s, p) => s + p.stats.gaps, 0);
  const totalDDs = index.projects.reduce((s, p) => s + p.stats.decisions, 0);

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>DVE — Projects</h1>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        {index.projects.length} projects | {totalSessions} sessions | {totalGaps} gaps | {totalDDs} decisions
      </p>

      {/* All projects button */}
      <button
        onClick={() => onSelectProject(null)}
        style={{
          width: "100%", padding: "12px 16px", marginBottom: "12px",
          border: "2px solid #4299e1", borderRadius: "8px", background: "#ebf8ff",
          cursor: "pointer", textAlign: "left", fontSize: "14px",
        }}
      >
        <strong>All Projects (Overview)</strong>
        <span style={{ float: "right", color: "#666", fontSize: "12px" }}>
          S:{totalSessions} G:{totalGaps} DD:{totalDDs}
        </span>
      </button>

      {/* Individual projects */}
      {index.projects.map((p) => (
        <button
          key={p.name}
          onClick={() => onSelectProject(p.name)}
          style={{
            width: "100%", padding: "12px 16px", marginBottom: "8px",
            border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff",
            cursor: "pointer", textAlign: "left", fontSize: "14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div>
            <strong>{p.name}</strong>
            <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
              {p.path}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#666", textAlign: "right" }}>
            <div>S:{p.stats.sessions} G:{p.stats.gaps} DD:{p.stats.decisions}</div>
          </div>
        </button>
      ))}

      <p style={{ fontSize: "11px", color: "#999", marginTop: "16px" }}>
        Generated: {new Date(index.generated_at).toLocaleString()}
      </p>
    </div>
  );
}
