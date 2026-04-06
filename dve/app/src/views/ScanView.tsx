// Scan view — discover and register DxE projects

import { useState, useCallback } from "preact/hooks";

const API_BASE = "http://localhost:4174";

interface ScanResult {
  name: string;
  path: string;
  hasDGE: boolean;
  hasDRE: boolean;
  hasDVE: boolean;
  hasDDE: boolean;
  sessions: number;
  decisions: number;
}

interface Props {
  onRegistered: () => void;
}

export function ScanView({ onRegistered }: Props) {
  const [scanDir, setScanDir] = useState("");
  const [depth, setDepth] = useState(3);
  const [results, setResults] = useState<ScanResult[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setResults(null);
    try {
      const body: any = { depth };
      if (scanDir.trim()) body.dir = scanDir.trim();
      const res = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      setResults(data.projects);
      // Auto-select all
      setSelected(new Set(data.projects.map((p: ScanResult) => p.path)));
      if (!scanDir.trim()) setScanDir(data.dir);
    } catch (e: any) {
      setError(e.message ?? "API not available. Run: dve serve");
    } finally {
      setScanning(false);
    }
  }, [scanDir, depth]);

  const toggleSelect = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!results) return;
    setSelected(new Set(results.map((r) => r.path)));
  }, [results]);

  const selectNone = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleRegister = useCallback(async () => {
    if (!results) return;
    setRegistering(true);
    try {
      const projects = results.filter((r) => selected.has(r.path));
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });
      if (!res.ok) throw new Error("Register failed");
      const data = await res.json();
      alert(`${data.registered} projects registered.\nRun: dve build`);
      onRegistered();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRegistering(false);
    }
  }, [results, selected, onRegistered]);

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>🔍 Project Scan</h2>

      {/* Scan form */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
            Scan directory (empty = auto)
          </label>
          <input
            type="text"
            value={scanDir}
            onInput={(e) => setScanDir((e.target as HTMLInputElement).value)}
            placeholder="/home/user/work"
            style={{
              width: "100%", padding: "8px", fontSize: "13px",
              border: "1px solid #e2e8f0", borderRadius: "6px",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>Depth</label>
          <input
            type="number"
            value={depth}
            min={1}
            max={5}
            onInput={(e) => setDepth(parseInt((e.target as HTMLInputElement).value) || 3)}
            style={{ width: "60px", padding: "8px", fontSize: "13px", border: "1px solid #e2e8f0", borderRadius: "6px" }}
          />
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          style={{
            padding: "8px 20px", fontSize: "13px", fontWeight: "bold",
            border: "none", borderRadius: "6px", cursor: scanning ? "default" : "pointer",
            background: scanning ? "#ccc" : "#4299e1", color: "#fff",
          }}
        >
          {scanning ? "Scanning..." : "Scan"}
        </button>
      </div>

      {error && <div style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

      {/* Results */}
      {results && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#666" }}>
              {results.length} projects found — {selected.size} selected
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={selectAll} style={linkBtnStyle}>Select all</button>
              <button onClick={selectNone} style={linkBtnStyle}>Select none</button>
            </div>
          </div>

          {results.map((r) => (
            <label
              key={r.path}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", marginBottom: "6px",
                border: selected.has(r.path) ? "2px solid #4299e1" : "1px solid #e2e8f0",
                borderRadius: "6px", background: "#fff", cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(r.path)}
                onChange={() => toggleSelect(r.path)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{r.name}</div>
                <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{r.path}</div>
              </div>
              <div style={{ display: "flex", gap: "4px", fontSize: "11px" }}>
                {r.hasDGE && <Badge label="DGE" color="#2b6cb0" />}
                {r.hasDRE && <Badge label="DRE" color="#276749" />}
                {r.hasDVE && <Badge label="DVE" color="#553c9a" />}
                {r.hasDDE && <Badge label="DDE" color="#975a16" />}
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", color: "#666", minWidth: "60px" }}>
                <div>S:{r.sessions}</div>
                <div>DD:{r.decisions}</div>
              </div>
            </label>
          ))}

          <button
            onClick={handleRegister}
            disabled={registering || selected.size === 0}
            style={{
              marginTop: "12px", padding: "10px 24px", fontSize: "14px", fontWeight: "bold",
              border: "none", borderRadius: "6px", cursor: selected.size === 0 ? "default" : "pointer",
              background: selected.size === 0 ? "#ccc" : "#38a169", color: "#fff",
              width: "100%",
            }}
          >
            {registering ? "Registering..." : `Register ${selected.size} projects`}
          </button>
        </>
      )}

      {!results && !scanning && (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          <p style={{ fontSize: "14px" }}>Click Scan to discover DxE projects</p>
          <p style={{ fontSize: "12px", marginTop: "8px" }}>Detects: DGE, DRE, DVE, DDE installations</p>
        </div>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold",
      background: `${color}15`, color, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

const linkBtnStyle = {
  border: "none", background: "none", color: "#4299e1",
  fontSize: "12px", cursor: "pointer", textDecoration: "underline",
};
