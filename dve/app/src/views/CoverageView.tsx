// Character coverage heatmap — which characters found which gaps

import { useState, useEffect } from "preact/hooks";

const API_BASE = "http://localhost:4174";

interface CoverageData {
  coverage: Record<string, { total: number; critical: number; high: number }>;
}

export function CoverageView() {
  const [data, setData] = useState<CoverageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/coverage`)
      .then((r) => r.ok ? r.json() : Promise.reject("API not available"))
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div style={{ padding: "12px", fontSize: "12px", color: "#999" }}>Coverage: API not available</div>;
  if (!data) return <div style={{ padding: "12px", fontSize: "12px", color: "#999" }}>Loading coverage...</div>;

  const entries = Object.entries(data.coverage).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(...entries.map(([, v]) => v.total), 1);

  return (
    <div style={{ padding: "12px" }}>
      <h4 style={{ fontSize: "13px", margin: "0 0 8px", color: "#666" }}>Character Coverage</h4>
      {entries.map(([name, stats]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", marginBottom: "4px", fontSize: "12px" }}>
          <span style={{ width: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          <div style={{ flex: 1, height: "14px", background: "#edf2f7", borderRadius: "2px", position: "relative", marginLeft: "8px" }}>
            <div style={{
              height: "100%", borderRadius: "2px",
              width: `${(stats.total / maxTotal) * 100}%`,
              background: stats.critical > 0 ? "#e53e3e" : stats.high > 0 ? "#dd6b20" : "#38a169",
            }} />
          </div>
          <span style={{ width: "30px", textAlign: "right", marginLeft: "4px", color: "#666" }}>{stats.total}</span>
        </div>
      ))}
    </div>
  );
}
