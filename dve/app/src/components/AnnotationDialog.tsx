// Annotation creation dialog — posts to DVE API

import { useState, useCallback } from "preact/hooks";

interface Props {
  targetId: string;
  onClose: () => void;
  onCreated: () => void;
}

const ACTIONS = [
  { value: "comment", label: "Comment" },
  { value: "fork", label: "Fork (DGE restart)" },
  { value: "overturn", label: "Overturn (revoke decision)" },
  { value: "constrain", label: "Constrain (add constraint)" },
  { value: "drift", label: "Drift (reality diverged)" },
];

const API_BASE = "http://localhost:4174";

export function AnnotationDialog({ targetId, onClose, onCreated }: Props) {
  const [action, setAction] = useState("comment");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetId, action, body: body.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      onCreated();
    } catch (e: any) {
      setError(e.message ?? "Failed to save. Is DVE API running? (dve serve)");
    } finally {
      setSaving(false);
    }
  }, [targetId, action, body, onCreated]);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100,
    }}>
      <div style={{
        background: "#fff", borderRadius: "8px", padding: "20px", width: "400px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>Annotate: {targetId}</h3>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ fontSize: "12px", color: "#666" }}>Action</label>
          <select
            value={action}
            onChange={(e) => setAction((e.target as HTMLSelectElement).value)}
            style={{ width: "100%", padding: "6px", fontSize: "13px", marginTop: "4px", borderRadius: "4px", border: "1px solid #e2e8f0" }}
          >
            {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ fontSize: "12px", color: "#666" }}>Comment</label>
          <textarea
            value={body}
            onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
            rows={4}
            style={{ width: "100%", padding: "6px", fontSize: "13px", marginTop: "4px", borderRadius: "4px", border: "1px solid #e2e8f0", resize: "vertical" }}
            placeholder="Your annotation..."
          />
        </div>

        {error && <div style={{ color: "#e53e3e", fontSize: "12px", marginBottom: "8px" }}>{error}</div>}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "6px 12px", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px", background: "#fff", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !body.trim()} style={{
            padding: "6px 12px", fontSize: "12px", border: "none", borderRadius: "4px",
            background: saving ? "#ccc" : "#4299e1", color: "#fff", cursor: saving ? "default" : "pointer",
          }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
