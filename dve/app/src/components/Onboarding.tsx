// Onboarding overlay — first-time user guide

import { useState } from "preact/hooks";
import { Markdown } from "./Markdown";

interface Props {
  onDismiss: () => void;
}

const STEPS = [
  {
    title: "DVE へようこそ",
    body: `DVE (Decision Visualization Engine) は、プロジェクトの **設計判断の経緯** を可視化するツールです。

「なぜこの仕様なのか？」を 3 クリックで辿れます。`,
    icon: "🗺️",
  },
  {
    title: "グラフの見方",
    body: `画面に表示されるのは **Decision Map** です。

- **四角いノード** = DD（設計判断）。大きいほど多くの Gap を解決した重要な判断
- **丸いノード** = Gap（設計の穴）。赤 = Critical、橙 = High
- **矢印** = 因果関係。Session → Gap → Decision の流れ

DD をクリックすると関連する Gap が展開されます。`,
    icon: "📊",
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
    icon: "📖",
  },
  {
    title: "できること",
    body: `- **DD をクリック** → 右パネルに詳細 + 関連 Gap
- **「🔄 DGE で再検討」ボタン** → 過去の文脈で新しい DGE を起動
- **「💬 コメント」ボタン** → Annotation を追加
- **検索バー** → キーワードでノードを絞り込み
- **State タブ** → プロジェクトの開発フェーズを表示
- **Coverage タブ** → キャラクター別の Gap 発見数`,
    icon: "🎯",
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
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)", position: "relative",
      }}>
        <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>{current.icon}</div>
        <h2 style={{ fontSize: "18px", textAlign: "center", marginBottom: "12px" }}>{current.title}</h2>
        <div style={{ fontSize: "14px", lineHeight: 1.8 }}>
          <Markdown text={current.body} fontSize="14px" />
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
          position: "absolute", top: "12px", right: "16px",
          border: "none", background: "none", fontSize: "18px", color: "#999", cursor: "pointer",
        }}>
          ×
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
