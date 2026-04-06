# DGE Session: DVE — Decision Visualization Engine 設計

- **Date**: 2026-04-05
- **Flow**: design-review (auto-iterate)
- **Structure**: roundtable
- **Characters**: 今泉, ヤン, 深澤, ビーン, リヴァイ, 僕
- **Rounds**: 7

**Decisions:** [DD-001](../decisions/DD-001-dve-serverless.md), [DD-002](../decisions/DD-002-dve-data-model-v2.md), [DD-003](../decisions/DD-003-dve-tech-stack.md), [DD-004](../decisions/DD-004-dve-dge-hub.md), [DD-005](../decisions/DD-005-dve-model-view-separation.md)

**Specs:** [dve-data-model](../specs/dve-data-model.md), [dve-uc](../specs/dve-uc.md), [dve-tech](../specs/dve-tech.md)

---

## テーマ

DGE/DRE ループの決定プロセスをドリルダウン可能に可視化するツール「DVE (Decision Visualization Engine)」の設計。20プロジェクトを並行運用するユーザーが、過去の決定経緯を高速に閲覧し、そこから新たな DGE セッションを起動できるハブとしての設計。

---

## Gap 一覧 (20 件)

| # | Gap | Category | Severity | Status |
|---|-----|----------|----------|--------|
| 1 | session の Gap に一意 ID がない。因果リンクが機械的に辿れない | spec-impl mismatch | Critical | **Resolved** — `{session_id}#G-{n}` session scoped 複合キー |
| 2 | パーサーによるリンク推定の信頼度表現 | error quality | High | **Resolved** — Edge.confidence (explicit/inferred) |
| 3 | L1 表示方針（全体マップ vs 検索+因果チェーン） | UX | High | **Resolved** — DD メイン + 展開式ドリルダウン |
| 4 | server の必要性 | integration | Medium | **Resolved** — 不要。Vite SSG で静的ビルド |
| 5 | Phase 分離（Phase 1 = 因果チェーン + Annotation） | missing logic | Medium | **Resolved** |
| 6 | Mermaid のスケール限界 | integration | Medium | **Resolved** — Cytoscape.js に変更 |
| 7 | Phase 1 でもインタラクティブ UI は必須 | UX | High | **Resolved** — Preact + Cytoscape.js |
| 8 | session フォーマットのバージョン間不統一 | missing logic | High | **Resolved** — 段階的抽出 + partial result |
| 9 | 不完全データの graceful degradation | UX | Medium | **Resolved** — ⚠ ホバーで warning 表示 |
| 10 | 「未決定の可視化」が DVE のコアバリュー | missing logic | High | **Resolved** — orphanGaps() クエリ |
| 11 | kit 出力 JSON スキーマが API contract | integration | High | **Resolved** — data model v2 で定義 |
| 12 | DVE は viewer ではなく DGE のハブ (6 UC) | missing logic | High | **Resolved** — ContextBundle 設計 |
| 13 | Annotation レイヤー (session immutable との両立) | missing logic | High | **Resolved** — dve/annotations/ 別ファイル |
| 14 | DVE → DGE 接続方式 | integration | High | **Resolved** — ContextBundle JSON + クリップボード |
| 15 | overturn 時の影響範囲可視��� | missing logic | High | **Resolved** — impactOf() forward traversal |
| 16 | データモデル v2 統合 | missing logic | Medium | Active — spec 化待ち |
| 17 | デフォルト表示の折りたたみ戦略 | UX | High | Active — spec 化待ち |
| 18 | 移行時パーサーレポート | UX | Medium | Active — spec 化待ち |
| 19 | DxE-suite への DVE 統合 (dxe.js, workspaces) | integration | Medium | Active — spec 化待ち |
| 20 | CLI クエリ (npx dve trace) + Claude Code skill | missing logic | High | Active — spec 化待ち |
| 21 | DVE → DGE プロトコル 2 方式 (inline / file ref) | integration | Medium | Active |
| 22 | `npx dve serve --watch` による自動更新 | integration | Medium | Active |
| 23 | ドリフト検出 (Phase 1: annotation(drift), Phase 2: git diff) | missing logic | Medium | Active |
| 24 | DVE 自身のセッションをドッグフーディングデータに | test coverage | Medium | Active |
| 25 | annotation 重みづけ + DD ノードビジュアルステート | UX | High | Active — spec 化待ち |
| 26 | DD ノードサイズを関連 Gap 数に比例（新メンバー導線） | UX | Medium | Active |
| 27 | ビルド差分 changelog.json + "NEW" バッジ | UX | Medium | Active |
| 28 | L3 DialogueView: line_ref 中心ハイライト + キャラ色分け | UX | High | Active — spec 化待ち |
| 29 | CLI 検索 `npx dve search` | missing logic | Medium | Active |

---

## 主要な設計決定

### データモデル v2

```
Nodes (5):
  Session    — immutable. dge/sessions/*.md
  Gap        — session scoped ID: {session_id}#G-{n}
  Decision   — DD-{n}. status: active | overturned
  Spec       — Phase 2
  Annotation — comment | fork | overturn | constrain. dve/annotations/

Edges (6):
  discovers:  Session → Gap        (parse)
  resolves:   Gap → Decision       (DD の Session/Gap フィールド)
  supersedes: Decision → Decision  (DD の Supersedes フィールド)
  produces:   Decision → Spec      (Phase 2)
  implements: Spec → ExternalRef   (Phase 2, git-linker)
  annotates:  Annotation → *Node

Queries (4):
  traceDecision(dd_id)  → 因果チェーン
  impactOf(node_id)     → 前方影響範囲
  orphanGaps()          → 未解決 Gap (= コアバリュー)
  overturned()          → 撤回 DD + 影響
```

### ユースケース (6)

```
UC-1: 決定の経緯を辿る (read)
UC-2: 過去の会話にコメントを付ける (annotate)
UC-3: 会話の特定ポイントからやり直す (fork)
UC-4: 追加制約で深掘り (constrained re-run)
UC-5: どんでん返し (overturn) + 影響範囲可視化
UC-6: コンテキスト復元 (DVE → DGE ContextBundle)
```

### DVE ↔ DGE Protocol

```
■ DVE → DGE (Phase 1): インラインプロンプト
  DVE が prompt_template を生成 → ユーザーが貼る → DGE はテキストとして処理
  DGE 改修不要。500字以内のサマリー。

■ DVE → DGE (Phase 2): ファイル参照
  "context: dve/contexts/ctx-xxx.json" を入力に含める
  DGE Phase 0 が検出 → JSON 読み込み。長さ制限なし。

■ DGE → DVE: ファイルシステム経由
  DGE が session を保存 → npx dve serve --watch が検知 → 自動リビルド
  DGE 側の改修不要。
```

### Annotation アクション + ビジュアルステート

```
action 種別:
  comment   — 単なるコメント
  fork      — ここから DGE 分岐
  overturn  — 決定撤回
  constrain — 制約追加
  drift     — 現実と乖離

DD ノード表示:
  通常:        実線枠・白背景
  overturned:  赤枠・取り消し線
  drifted:     点線枠・黄背景
  constrained: 実線枠・バッジ付き

表示優先: overturn > drift > constrain > fork > comment
```

### ContextBundle (DVE → DGE 橋渡し)

```
ContextBundle:
  prior_session: SessionRef + Gap サマリー + DD 一覧
  annotations: ユーザーコメント
  constraints: 追加制約 (ユーザー入力)
  focus_gap: 深掘り対象 (任意)
  suggested_action: revisit | deep_dive | new_angle | override
  prompt_template: DGE に渡すテキスト (自動生成)
```

### 技術スタック

```
kit:  TypeScript + remark (parser)
app:  Preact + Cytoscape.js (dagre layout) + Vite (SSG)
CLI:  npx dve build / serve / trace
```

### Phase 分割

```
Phase 1:
  ✅ Session + Gap + Decision + Annotation (4 ノード)
  ✅ discovers + resolves + supersedes + annotates (4 エッジ)
  ✅ graph.json 出力
  ✅ Web UI (Preact + Cytoscape.js) — DD 折りたたみ表示 + ドリルダウン
  ✅ CLI: build / serve / trace
  ✅ ContextBundle 生成 (file + clipboard)

Phase 2:
  ⬜ Spec ノード + produces / implements エッジ
  ⬜ git-linker (Ref: DD-* commit scan)
  ⬜ キャラカバレッジ分析
  ⬜ 検索/フィルタ
  ⬜ クラスタリング
  ⬜ Web UI から Annotation 直接作成
  ⬜ 複数プロジェクト横断ビュー
```

### ディレクトリ構成

```
dve/
├── kit/              @unlaxer/dve-toolkit
│   ├── parser/       markdown → graph data
│   │   ├── session-parser.ts
│   │   ├── decision-parser.ts
│   │   └── annotation-parser.ts
│   ├���─ graph/        graph construction + query
│   │   ├── schema.ts
│   │   ├── builder.ts
│   │   └── query.ts
│   ├── context/      ContextBundle 生成
│   │   └── bundle.ts
│   ├── cli/          CLI エントリーポイント
│   │   └── dve-tool.ts
│   └── package.json
├── app/              visualization
│   ├── src/
│   │   ├── App.tsx
│   │   ├── views/
│   │   │   ├── DecisionMap.tsx    # L1 (DD 折りたたみ)
│   │   │   ├── GapDetail.tsx      # L2 (詳細ペイン)
│   │   │   └── DialogueView.tsx   # L3 (会話ビュー)
│   │   └── components/
│   ├── vite.config.ts
│   └── package.json
├── annotations/      ユーザーコメント
├── contexts/         ContextBundle 出力先
└── README.md
```

---

## ユーザーフィードバック

- UX は最終的に重視。「グラフィカルだがクリッカブルでない」は不可
- モデル定義が最優先
- 20プロジェクト運用者の視点: 読むだけでも大変。後出しどんでん返しは起きる
- 過去の会話からコンテキストを復元して新 DGE を起動できることが重要
- DVE は read-only viewer ではなく DGE のハブ
