// Glossary builder — auto-extract terms from DDs, sessions, specs + custom glossary

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { DVEGraph } from "../graph/schema.js";

export interface GlossaryEntry {
  term: string;
  definition: string;
  source: string;       // "DD-001" | "session:xxx" | "custom"
  aliases?: string[];   // alternative forms
}

export interface Glossary {
  entries: GlossaryEntry[];
}

// Auto-extract terms from graph data
export function buildGlossary(graph: DVEGraph, projectPath: string): Glossary {
  const entries: GlossaryEntry[] = [];
  const seen = new Set<string>();

  function add(term: string, definition: string, source: string, aliases?: string[]) {
    const key = term.toLowerCase();
    if (seen.has(key) || term.length < 2) return;
    seen.add(key);
    entries.push({ term, definition, source, aliases });
  }

  // 1. DD titles → terms
  for (const node of graph.nodes) {
    if (node.type === "decision") {
      const d = node.data as any;
      add(node.id, d.title ?? "", node.id);
    }
  }

  // 2. Gap categories as terms
  const categories = new Set<string>();
  for (const node of graph.nodes) {
    if (node.type === "gap") {
      const d = node.data as any;
      if (d.category && d.category !== "Unknown") categories.add(d.category);
    }
  }
  const categoryDefs: Record<string, string> = {
    "missing-logic": "ロジックの欠落 — 実装すべき処理が spec に記述されていない",
    "missing logic": "ロジックの欠落 — 実装すべき処理が spec に記述されていない",
    "spec-impl-mismatch": "仕様と実装の不整合 — spec と実際のコードが矛盾",
    "spec-impl mismatch": "仕様と実装の不整合 — spec と実際のコードが矛盾",
    "error-quality": "エラー品質 — エラーメッセージやハンドリングの不足",
    "error quality": "エラー品質 — エラーメッセージやハンドリングの不足",
    "integration": "統合の問題 — コンポーネント間の接続や依存の欠陥",
    "UX": "ユーザー体験 — 操作性、表示、フィードバックの問題",
    "test-coverage": "テストカバレッジ — テストが不足している領域",
    "test coverage": "テストカバレッジ — テストが不足している領域",
  };
  for (const cat of categories) {
    add(cat, categoryDefs[cat] ?? `Gap カテゴリ: ${cat}`, "system");
  }

  // 3. DxE-specific terms
  const dxeTerms: [string, string, string[]][] = [
    ["DGE", "Design-Gap Extraction — 会話劇で設計の穴を発見するメソッド", ["Dialogue-driven Gap Extraction"]],
    ["DRE", "Document Rule Engine — rules/skills/agents をパッケージ化して配布", []],
    ["DVE", "Decision Visualization Engine — 決定プロセスの可視化ツール", []],
    ["DDE", "Document-Deficit Extraction — ドキュメントの穴を LLM+CLI で補完", []],
    ["DD", "Design Decision — 設計判断の記録。DGE session から生まれる", ["Design Decision"]],
    ["Gap", "設計の穴 — DGE の会話劇で発見される未定義・矛盾・考慮漏れ", []],
    ["Session", "DGE の会話劇セッション。キャラクターが設計について議論し Gap を発見する", []],
    ["Annotation", "後から追加するコメント・異議・撤回。session を汚さず別レイヤーで保存", []],
    ["Spec", "Gap から生成された仕様書。UC/TECH/DD/DQ/ACT の5タイプ", []],
    ["ContextBundle", "DVE → DGE の橋渡しデータ。過去の文脈を復元して DGE に渡す", []],
    ["orphan gap", "DD に紐づかない孤立 Gap。まだ決定されていない設計の穴", ["孤立Gap"]],
    ["overturn", "決定の撤回。DD のステータスが overturned に変わる", ["撤回"]],
    ["drift", "現実との乖離。DD の内容と実際のコードが食い違っている状態", ["ドリフト"]],
    ["supersedes", "DD の置き換え。新しい DD が古い DD を supersede する", []],
    ["enforcement", "Hook ベースのルール強制。PostToolUse + Stop hook で検証", []],
  ];
  for (const [term, def, aliases] of dxeTerms) {
    add(term, def, "system", aliases);
  }

  // 4. Characters
  const charDefs: Record<string, string> = {
    "今泉": "The Innocent Questioner — 前提を問う。5つの問いパターン（そもそも/要するに/他にないの/誰が困る/前もそうだった）",
    "ヤン": "The Lazy Strategist — 最もシンプルな解を見つける。「要らなくない？」",
    "千石": "品質を守る。「お客様への侮辱です」",
    "リヴァイ": "The Implementation Enforcer — 動くものを要求する。「汚い。作り直せ。」",
    "深澤": "The UX Feeler — ユーザーの感情と体験を言語化する",
    "ビーン": "The Data Evangelist — 「データは何て言ってる？」",
    "僕": "The Small-Scale Survivor — scope を縮小する。「もっと小規模にできませんか？」",
    "Red Team": "セキュリティ/攻撃視点。「競合がこうしたら？」",
    "ハウス": "隠れた問題を見つける。「全員嘘をついている」",
    "ソクラテス": "前提を問い続ける。「なぜそう思う？ もし逆だったら？」",
  };
  for (const [name, def] of Object.entries(charDefs)) {
    add(name, def, "character");
  }

  // 5. Custom glossary file
  const customPath = path.join(projectPath, "dve", "glossary.json");
  if (existsSync(customPath)) {
    try {
      const custom = JSON.parse(readFileSync(customPath, "utf-8"));
      for (const entry of custom.entries ?? []) {
        add(entry.term, entry.definition, "custom", entry.aliases);
      }
    } catch { /* ignore */ }
  }

  // Sort by term length descending (longer terms match first)
  entries.sort((a, b) => b.term.length - a.term.length);

  return { entries };
}
