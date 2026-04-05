# TECH Spec: DVE Architecture & Stack

- **Status**: draft
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Resolves**: Gap #4, #6, #7, #8, #9, #17, #18, #19, #22, #24, #26, #27

---

## Architecture

```
dve/kit (data layer)          dve/app (view layer)
┌──────────────────┐          ┌──────────────────┐
│ parser/           │          │ Preact            │
│   session-parser  │──JSON──→│ Cytoscape.js      │
│   decision-parser │          │ Vite (SSG)        │
│   annotation-parser│         └──────────────────┘
│ graph/            │                ↑
│   schema          │          graph.json
│   builder         │          changelog.json
│   query           │
│ context/          │
│   bundle          │──JSON──→ DGE (prompt text)
│ cli/              │
│   dve-tool        │
└──────────────────┘
```

**原則**: kit と app は完全に分離。kit は JSON を吐く。app は JSON を食う。app を差し替えても kit に影響しない。

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Parser | TypeScript + remark/unified | markdown AST。自前パーサーを書かない |
| Graph | TypeScript (pure) | 外部依存なし。Node/Edge/Query のみ |
| CLI | TypeScript + Node.js | `npx dve build/serve/trace/search/annotate` |
| UI Framework | Preact | React 互換で軽量。DVE の規模に適切 |
| Graph Viz | Cytoscape.js (dagre layout) | インタラクティブ。click/hover 組み込み。1000 ノードまで実用的 |
| Build | Vite | SSG モード。静的 HTML + JS + JSON 出力 |
| Server | **なし** | read-only 可視化。FS 完結 |

---

## Directory Structure

```
dve/
├── kit/                    @unlaxer/dve-toolkit
│   ├── package.json        version: 4.0.0
│   ├── parser/
│   │   ├── session-parser.ts   "→ Gap 発見:" 抽��、段階的パース
│   │   ├── decision-parser.ts  DD-*.md パース
│   │   └── annotation-parser.ts dve/annotations/*.md パース
│   ├── graph/
│   │   ├── schema.ts       Node/Edge TypeScript 型定義
│   │   ├── builder.ts      parser 出力 → graph 構築
│   │   └── query.ts        traceDecision, impactOf, orphanGaps, overturned
│   ├── context/
│   │   └── bundle.ts       ContextBundle 生成 + prompt_template 出力
│   ├── cli/
│   │   └── dve-tool.ts     build, serve, trace, search, annotate, orphans
│   └── version.txt
├── app/                    @unlaxer/dve-app
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── views/
│       │   ├── DecisionMap.tsx     L1: DD 折りたたみグラフ
│       │   ├── GapDetail.tsx       L2: 右パネル詳細
│       │   └── DialogueView.tsx    L3: 会話ハイライト表示
│       ├── components/
│       │   ├── GraphContainer.tsx  Cytoscape.js wrapper (~20行)
│       │   ├── NodeStyles.ts      active/overturned/drifted スタイル定義
│       │   └── Badge.tsx           NEW バッジ
│       └── lib/
│           └── graph-loader.ts    graph.json + changelog.json fetch
├── annotations/            ユーザー Annotation 保存先
├── contexts/               ContextBundle 出力先
├── dist/                   ビルド成果物 (gitignore)
│   ├── graph.json
│   ├── changelog.json
│   ├── index.html
│   └── assets/
└── README.md
```

---

## Parser Specification

### 段階��抽出 (Graduated Extraction)

パーサーはエラーで止まらない。部��的な結果を常に返す。

```typescript
interface ParseResult<T> {
  node: Partial<T>
  confidence: number      // 0.0 - 1.0
  warnings: string[]
  source: { file: string, line?: number }
}
```

| Level | 抽出対象 | 信頼度 | 失敗時の振る舞い |
|-------|----------|--------|------------------|
| 1 | ファイル名 → date + id | 1.0 | ファイル自体をスキップ |
| 2 | `→ Gap 発見:` マーカー → Gap | 0.9 | Gap なしの Session ノードのみ |
| 3 | Gap テーブル → category + severity | 0.8 | severity: "Unknown" |
| 4 | DD 内の Session/Gap フィールド → Edge | 1.0 (explicit) | 孤立 DD ノード |

### 複数フォーマット対応

```
v3以前:  Gap マーカーなし → Level 2 失敗 → Session のみ
v3:      "→ Gap 発見:" あり、テーブルなし → Level 3 失敗 → severity Unknown
v4+:     マーカー + テーブル → 全 Level 成功
```

---

## Build Pipeline

```
npx dve build:
  1. Scan dge/sessions/*.md       → SessionParser
  2. Scan dge/decisions/DD-*.md   → DecisionParser
  3. Scan dve/annotations/*.md    → AnnotationParser
  4. GraphBuilder: nodes + edges → graph
  5. Compare with previous graph.json → changelog.json
  6. Write dve/dist/graph.json + changelog.json
  7. Build app/ → dve/dist/index.html + assets/

npx dve serve:
  → vite preview dve/dist/

npx dve serve --watch:
  → chokidar で dge/sessions/, dge/decisions/, dve/annotations/ を監視
  → 変更検知 → step 1-7 再実行 → Vite HMR でブラウザ更新
```

---

## UI Specifications

### L1 DecisionMap — 折りたたみ戦略 (Gap #17)

- **デフォルト**: DD ノードのみ表示。Gap/Session は非表示
- **DD クリック**: 関連 Gap が DD の下に展開（ツリー状）
- **Gap クリック**: L2 パネルが開く + L3 会話ビューが展開可能に
- **DD ノードサイズ**: `Math.max(30, 30 + gap_count * 5)` px (Gap #26)
- **Layout**: dagre (rankdir: LR, 時間軸 left-to-right)

### DD ノードスタイル (Gap #25)

```typescript
const nodeStyles = {
  active:     { border: 'solid 2px #333',  bg: '#fff' },
  overturned: { border: 'solid 2px #e53e3e', bg: '#fff5f5', textDecoration: 'line-through' },
  drifted:    { border: 'dashed 2px #d69e2e', bg: '#fffff0' },
  constrained:{ border: 'solid 2px #333',  bg: '#fff', badge: '🔒' },
}
```

annotation 優先度: overturn > drift > constrain > fork > comment
（最も優先度の高い action のスタイルを適用）

### "NEW" バッジ (Gap #27)

- `changelog.json` に含まれるノー���に "NEW" バッジ表示
- changelog は前回ビルドの graph.json との差分
- 初回ビルド時は全ノードが "NEW"（バッジ非���示にする）

### L3 DialogueView (Gap #28)

- Gap の `line_ref` を中心に ±10 行を表示
- `→ Gap 発見:` 行をハイライト（黄色背景）
- キャラ名に色分け（キャラ一覧の順番で色を割り当て）
- キャラ名の横にアイコン表示（`👤`, `☕`, `🎩` 等 — session ファ��ルから抽出）
- 「Show full session」ボタンで全文展開

### パーサーレポート (Gap #18)

```
DVE build complete (0.8s):
  Sessions:    45 (38 with gaps, 7 no markers)
  Gaps:        198 (12 severity unknown)
  Decisions:   23
  Annotations: 7
  Warnings:    7 sessions pre-v3 format

  → npx dve serve
```

---

## DxE-suite 統合 (Gap #19)

### root package.json

```json
"workspaces": [
  "dge/kit", "dge/server", "dre/kit",
  "dve/kit", "dve/app"
]
```

### bin/dxe.js TOOLKITS 追加

```javascript
dve: {
  pkg: '@unlaxer/dve-toolkit',
  localKit: 'dve/kit',
  install: 'install.sh', update: 'update.sh',
  desc: { ja: '決定の可視化', en: 'decision visualization' },
  phrase: { ja: '「DVE で見せて」', en: '"show me in DVE"' },
},
```

### DEFAULT_TOOLKITS 更新

```javascript
const DEFAULT_TOOLKITS = ['dge', 'dre', 'dve'];
```

---

## Dogfooding (Gap #24)

DVE 自身の DGE セッション (`dge/sessions/2026-04-05-dve-design.md`) を初期データとして使用。

```bash
# DVE の README に記載
npx dve build && npx dve serve
# → DVE 自身の設計判断を DVE で可視化
```

パーサーの validation を兼ねる: この session を正しくパースできなければバグ。

---

## Phase Plan

### Phase 1 (MVP)

```
Nodes:  Session + Gap + Decision + Annotation (4 types)
Edges:  discovers + resolves + supersedes + annotates (4 types)
CLI:    build, serve, serve --watch, trace, search, annotate, orphans
UI:     L1 DecisionMap + L2 GapDetail + L3 DialogueView
Output: graph.json, changelog.json, static HTML
DVE→DGE: inline prompt (clipboard copy)
```

### Phase 2

```
Nodes:  + Spec
Edges:  + produces, implements (git-linker)
CLI:    + impact
UI:     + 検索/フィルタ, クラスタリング, Web UI から Annotation 作成
DVE→DGE: + file ref (context: <path>)
Other:  ドリフト自動検出 (git diff), プロジェクト横断ビュー
```
