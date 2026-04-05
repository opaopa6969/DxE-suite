// State chart — DRE install state + development phase per project

import { useState, useEffect } from "preact/hooks";

const API_BASE = "http://localhost:4174";

interface ProjectState {
  projectName: string;
  dre: {
    installState: string;
    localVersion: string | null;
    kitVersion: string | null;
    customizedFiles: string[];
    totalFiles: number;
  };
  phase: {
    phase: string;
    source: string;
  };
  dgeSessionCount: number;
  ddCount: number;
  lastSessionDate: string | null;
}

const PHASE_ORDER = ["spec", "implementation", "stabilization", "maintenance"];
const DRE_ORDER = ["FRESH", "INSTALLED", "CUSTOMIZED", "OUTDATED"];

const PHASE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  spec: { bg: "#ebf8ff", color: "#2b6cb0", icon: "\u{1F4DD}" },
  implementation: { bg: "#f0fff4", color: "#276749", icon: "\u{1F528}" },
  stabilization: { bg: "#fffff0", color: "#975a16", icon: "\u{1F6E1}\uFE0F" },
  maintenance: { bg: "#faf5ff", color: "#553c9a", icon: "\u{1F527}" },
  unknown: { bg: "#f7fafc", color: "#999", icon: "?" },
};

const DRE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  FRESH: { bg: "#f7fafc", color: "#999", icon: "\u{26AA}" },
  INSTALLED: { bg: "#f0fff4", color: "#276749", icon: "\u{1F7E2}" },
  CUSTOMIZED: { bg: "#fffff0", color: "#975a16", icon: "\u{1F7E1}" },
  OUTDATED: { bg: "#fff5f5", color: "#c53030", icon: "\u{1F534}" },
};

function Badge({ label, style: s }: { label: string; style: { bg: string; color: string; icon: string } }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "12px",
      fontSize: "11px", fontWeight: "bold", background: s.bg, color: s.color,
    }}>
      {s.icon} {label}
    </span>
  );
}

export function StateChart() {
  const [states, setStates] = useState<ProjectState[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then((r) => r.ok ? r.json() : Promise.reject("API not available"))
      .then((data) => setStates(data.projects))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div style={{ padding: "12px", fontSize: "12px", color: "#999" }}>State: API not available ({error})</div>;
  if (!states) return <div style={{ padding: "12px", color: "#999" }}>Loading state...</div>;

  return (
    <div style={{ padding: "16px" }}>
      <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>Project State</h3>

      {/* State chart legend */}
      <div style={{ marginBottom: "16px", fontSize: "11px", color: "#666" }}>
        <div style={{ marginBottom: "4px" }}>
          <strong>Phase:</strong>{" "}
          {PHASE_ORDER.map((p, i) => (
            <span key={p}>
              {i > 0 && " → "}
              <Badge label={p} style={PHASE_STYLE[p]} />
            </span>
          ))}
        </div>
        <div>
          <strong>DRE:</strong>{" "}
          {DRE_ORDER.map((s, i) => (
            <span key={s}>
              {i > 0 && " → "}
              <Badge label={s} style={DRE_STYLE[s]} />
            </span>
          ))}
        </div>
      </div>

      {/* Project rows */}
      {states.map((s) => (
        <div key={s.projectName} style={{
          padding: "10px 12px", marginBottom: "8px",
          border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <strong style={{ fontSize: "13px" }}>{s.projectName}</strong>
            <div style={{ display: "flex", gap: "6px" }}>
              <Badge label={s.phase.phase} style={PHASE_STYLE[s.phase.phase] ?? PHASE_STYLE.unknown} />
              <Badge label={s.dre.installState} style={DRE_STYLE[s.dre.installState] ?? DRE_STYLE.FRESH} />
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#666", display: "flex", gap: "12px" }}>
            <span>Sessions: {s.dgeSessionCount}</span>
            <span>DDs: {s.ddCount}</span>
            {s.dre.localVersion && <span>DRE: v{s.dre.localVersion}</span>}
            {s.lastSessionDate && <span>Last: {s.lastSessionDate}</span>}
            {s.dre.customizedFiles.length > 0 && (
              <span style={{ color: "#d69e2e" }}>{s.dre.customizedFiles.length} customized</span>
            )}
          </div>
          {s.dre.installState === "OUTDATED" && (
            <div style={{ fontSize: "11px", color: "#c53030", marginTop: "4px" }}>
              Update available: {s.dre.localVersion} → {s.dre.kitVersion}
            </div>
          )}
          <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>
            Phase source: {s.phase.source}
          </div>
        </div>
      ))}
    </div>
  );
}
