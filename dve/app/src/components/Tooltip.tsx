// Tooltip — hover explanation for graph nodes

import { useState } from "preact/hooks";
import type { GraphNode } from "../types";

const NODE_HELP: Record<string, string> = {
  decision: "DD (Design Decision) — DGE で発見された Gap を解決する設計判断。クリックで詳細表示。",
  dialogue: "会話劇 — キャラクターが議論するテキスト。クリックで全文表示。点線 = テキスト未保存。",
  gap: "Gap — 設計の穴。DGE の会話劇で発見。Critical(赤) > High(橙) > Medium(黄) > Low(緑)。",
  session: "Session — DGE セッション。テーマ、キャラクター構成、日付。",
  annotation: "Annotation — ユーザーが追加したコメント・異議・撤回。",
  spec: "Spec — Gap から生成された仕様書。UC / TECH / DD / DQ / ACT の5タイプ。",
};

interface Props {
  node: GraphNode | null;
  position: { x: number; y: number } | null;
}

export function Tooltip({ node, position }: Props) {
  if (!node || !position) return null;

  const d = node.data as any;
  const help = NODE_HELP[node.type] ?? "";
  const label = d.title ?? d.summary ?? d.theme ?? node.id;

  return (
    <div style={{
      position: "fixed",
      left: position.x + 12,
      top: position.y + 12,
      background: "#1a202c",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      maxWidth: "300px",
      lineHeight: 1.5,
      zIndex: 50,
      pointerEvents: "none",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}>
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{node.id}</div>
      <div style={{ marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#a0aec0", fontSize: "11px" }}>{help}</div>
    </div>
  );
}
