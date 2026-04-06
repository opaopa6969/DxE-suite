// Onboarding overlay — first-time user guide

import { useState } from "preact/hooks";

interface Props {
  onDismiss: () => void;
}

function renderInline(text: string) {
  // Bold + code
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} style={{ background: "#edf2f7", padding: "1px 4px", borderRadius: "3px", fontSize: "12px" }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function renderMd(body: string) {
  const lines = body.split("\n");
  const elements: any[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    elements.push(
      <table key={`t-${elements.length}`} style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", margin: "8px 0" }}>
        <tbody>
          {tableRows.map((cells, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #e2e8f0" }}>
              {cells.map((cell, ci) => {
                const Tag = ri === 0 ? "th" : "td";
                return <Tag key={ci} style={{ padding: "4px 8px", textAlign: "left", fontWeight: ri === 0 ? "bold" : "normal" }}>{renderInline(cell)}</Tag>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table row
    if (line.startsWith("|")) {
      // Skip separator row (|---|---|)
      if (/^\|[\s-|]+\|$/.test(line)) continue;
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    }

    if (inTable) { flushTable(); inTable = false; }

    // Empty line
    if (!line.trim()) { continue; }

    // List item
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0" }}>
          {"• "}{renderInline(line.slice(2))}
        </div>
      );
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i} style={{ margin: "6px 0" }}>{renderInline(line)}</p>);
  }

  if (inTable) flushTable();
  return elements;
}

const STEPS = [
  {
    title: "DVE へようこそ",
    body: `DVE (Decision Visualization Engine) は、プロジェクトの **設計判断の経緯** を可視化するツールです。

「なぜこの仕様なのか？」を 3 クリックで辿れます。`,
    icon: "\u{1F5FA}\uFE0F",
  },
  {
    title: "グラフの見方",
    body: `画面に表示されるのは **Decision Map** です。

- **四角いノード** = DD（設計判断）。大きいほど多くの Gap を解決した重要な判断
- **丸いノード** = Gap（設計の穴）。赤 = Critical、橙 = High
- **矢印** = 因果関係。Session → Gap → Decision の流れ

DD をクリックすると関連する Gap が展開されます。`,
    icon: "\u{1F4CA}",
  },
  {
    title: "用語ガイド",
    body: `| 用語 | 意味 |
|------|------|
| **Session** | DGE の会話劇。キャラクターが設計について議論 |
| **Gap** | 会話劇で発見された「設計の穴」 |
| **DD** | Design Decision — Gap を解決する設計判断 |
| **Annotation** | 後から追加するコメント・異議・撤回 |
| **Spec** | Gap から生成された仕様書 |`,
    icon: "\u{1F4D6}",
  },
  {
    title: "できること",
    body: `- **DD をクリック** → 右パネルに詳細 + 関連 Gap
- **「DGE で再検討」ボタン** → 過去の文脈で新しい DGE を起動
- **「コメント」ボタン** → Annotation を追加
- **検索バー** → キーワードでノードを絞り込み
- **State タブ** → プロジェクトの開発フェーズを表示
- **Coverage タブ** → キャラクター別の Gap 発見数`,
    icon: "\u{1F3AF}",
  },
];

export function Onboarding({ onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200,
    }}>
      <div style={{
        background: "#fff", borderRadius: "12px", padding: "28px", maxWidth: "500px", width: "90%",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>{current.icon}</div>
        <h2 style={{ fontSize: "18px", textAlign: "center", marginBottom: "12px" }}>{current.title}</h2>
        <div style={{ fontSize: "14px", lineHeight: 1.8 }}>
          {renderMd(current.body)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
          <span style={{ fontSize: "12px", color: "#999" }}>
            {step + 1} / {STEPS.length}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} style={btnStyle("#e2e8f0", "#333")}>
                Back
              </button>
            )}
            {isLast ? (
              <button onClick={onDismiss} style={btnStyle("#4299e1", "#fff")}>
                Start
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)} style={btnStyle("#4299e1", "#fff")}>
                Next
              </button>
            )}
          </div>
        </div>

        <button onClick={onDismiss} style={{
          position: "absolute" as any, top: "12px", right: "16px",
          border: "none", background: "none", fontSize: "18px", color: "#999", cursor: "pointer",
        }}>
          &times;
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg: string, color: string): Record<string, any> {
  return {
    padding: "8px 16px", fontSize: "13px", border: "none", borderRadius: "6px",
    background: bg, color, cursor: "pointer", fontWeight: "bold",
  };
}
