// L3: DialogueView — show session file content with gap highlight + character colors

import { useState, useEffect } from "preact/hooks";

interface Props {
  sessionFilePath: string;
  highlightLine?: number;
  characters: string[];
}

// Character color palette
const CHAR_COLORS = [
  "#2b6cb0", "#c53030", "#2f855a", "#b7791f", "#6b46c1",
  "#d53f8c", "#2c7a7b", "#c05621", "#4a5568", "#9b2c2c",
];

const CHAR_ICONS: Record<string, string> = {
  "今泉": "👤", "ヤン": "☕", "千石": "🎩", "僕": "😰",
  "ラインハルト": "👑", "島耕作": "👔", "大和田": "🦈", "鷲津": "🦅",
  "リヴァイ": "⚔", "利根川": "🎰", "ハウス": "🏥", "ソウル": "⚖",
  "Red Team": "😈", "金八": "🧑‍🏫", "深澤": "🎨", "ビーン": "📊",
  "後輩": "🤝", "林": "🪄", "右京": "🕵", "ソクラテス": "🎭",
  "マンガー": "🧩", "舞台監督": "🎬", "opa": "🔭",
  "先輩": "🧑‍💼",
};

function getCharColor(name: string, characters: string[]): string | null {
  const idx = characters.indexOf(name);
  if (idx >= 0) return CHAR_COLORS[idx % CHAR_COLORS.length];
  // Check partial match
  const found = characters.findIndex((c) => name.includes(c) || c.includes(name));
  if (found >= 0) return CHAR_COLORS[found % CHAR_COLORS.length];
  return null;
}

function getIcon(name: string): string {
  for (const [key, icon] of Object.entries(CHAR_ICONS)) {
    if (name.includes(key)) return icon;
  }
  return "";
}

export function DialogueView({ sessionFilePath, highlightLine, characters }: Props) {
  const [lines, setLines] = useState<string[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to load the session file as text
    // In static build, session files aren't served. Show a message instead.
    setLines(null);
    setError(null);

    fetch(`./${sessionFilePath}`)
      .then((res) => {
        if (!res.ok) throw new Error("File not available in static build");
        return res.text();
      })
      .then((text) => setLines(text.split("\n")))
      .catch(() => setError(sessionFilePath));
  }, [sessionFilePath]);

  if (error) {
    return (
      <div style={{ padding: "12px", fontSize: "12px", color: "#666", background: "#f7fafc", borderRadius: "4px" }}>
        <p>Session file: <code>{error}</code></p>
        <p style={{ marginTop: "4px" }}>Open in editor to view full dialogue.</p>
      </div>
    );
  }

  if (!lines) return <div style={{ padding: "12px", color: "#999" }}>Loading...</div>;

  // Determine visible range
  const hl = highlightLine ?? 0;
  const contextRange = 15;
  const start = expanded ? 0 : Math.max(0, hl - contextRange);
  const end = expanded ? lines.length : Math.min(lines.length, hl + contextRange);
  const visible = lines.slice(start, end);

  return (
    <div style={{ fontSize: "12px", lineHeight: 1.6, fontFamily: "monospace", padding: "8px" }}>
      {!expanded && start > 0 && (
        <div style={{ color: "#999", marginBottom: "4px" }}>... ({start} lines above)</div>
      )}
      {visible.map((line, i) => {
        const lineNum = start + i + 1;
        const isHighlight = lineNum === hl;
        const isGapMarker = /→\s*Gap\s*発見/.test(line);

        // Detect character speaking
        let charColor: string | null = null;
        let charIcon = "";
        const charMatch = line.match(/^\*{0,2}([^\*:：]+?)\*{0,2}[:：]/);
        if (charMatch) {
          const name = charMatch[1].trim();
          charColor = getCharColor(name, characters);
          charIcon = getIcon(name);
        }

        return (
          <div
            key={lineNum}
            style={{
              padding: "1px 4px",
              background: isHighlight ? "#fefcbf" : isGapMarker ? "#fed7d7" : "transparent",
              borderLeft: charColor ? `3px solid ${charColor}` : "3px solid transparent",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {charIcon && <span style={{ marginRight: "4px" }}>{charIcon}</span>}
            {line}
          </div>
        );
      })}
      {!expanded && end < lines.length && (
        <div style={{ color: "#999", marginTop: "4px" }}>... ({lines.length - end} lines below)</div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginTop: "8px", padding: "4px 8px", fontSize: "11px",
          border: "1px solid #ccc", borderRadius: "4px", background: "#fff", cursor: "pointer",
        }}
      >
        {expanded ? "Collapse" : "Show full session"}
      </button>
    </div>
  );
}
