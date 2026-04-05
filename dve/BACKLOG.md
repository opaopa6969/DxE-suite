# BACKLOG — DVE (Decision Visualization Engine)

> 最終更新: 2026-04-05
> バージョン: v4.0.0
> DGE Session: [2026-04-05-dve-design](./dge/sessions/2026-04-05-dve-design.md) (7 rounds, 29 gaps)

## 完了済み (Phase 1 kit)

- ✅ データモデル v2 定義 (Node 5 / Edge 6 / Query 4) — DD-002
- ✅ session-parser (段階的抽出, Gap テーブル 4列/5列対応)
- ✅ decision-parser (DD-*.md パース, supersedes/session_refs 抽出)
- ✅ annotation-parser (dve/annotations/*.md パース)
- ✅ graph builder (nodes + edges → graph.json)
- ✅ query: traceDecision, impactOf, orphanGaps, search
- ✅ CLI: build, trace, orphans, search, version
- ✅ changelog.json 生成 (前回ビルドとの差分)
- ✅ Web UI: Preact + Cytoscape.js (dagre layout) — DD-003
- ✅ L1 DecisionMap (DD 折りたたみ, クリック展開)
- ✅ L2 DetailPanel (severity 色分け, annotation 表示)
- ✅ DGE 再起動ボタン (クリップボードコピー) — DD-004
- ✅ ゼロステート対応
- ✅ Vite SSG ビルド — DD-001
- ✅ model/view 完全分離 (kit + app) — DD-005

---

## P0: すぐやる

| # | タスク | Gap | 種類 |
|---|--------|-----|------|
| 1 | **`npx dve serve --watch`** — chokidar で sessions/decisions/annotations を監視、変更時に自動リビルド | #22 | 実装 |
| 2 | **ContextBundle 生成** (`dve/kit/context/bundle.ts`) — graph.json から DVE → DGE 用 JSON + prompt_template 生成 | #12, #14 | 実装 |
| 3 | **`npx dve annotate` CLI** — `dve annotate DD-005 --action drift --body "..."` でファイル生成 | #29 | 実装 |
| 4 | **DD ノードサイズ比例** — 関連 Gap 数に応じたノードサイズ (現在は実装済みだが検証要) | #26 | 検証 |
| 5 | **パーサーレポート改善** — severity unknown 件数、no markers 件数の詳細表示 | #18 | 実装 |

## P1: 設計が要る

| # | タスク | Gap | 種類 |
|---|--------|-----|------|
| 6 | **L3 DialogueView** — Gap の line_ref 中心ハイライト + キャラ色分け + アイコン表示 | #28 | 設計+実装 |
| 7 | **annotation 重みづけ + DD ノードスタイル切り替え** — overturn > drift > constrain の優先度で DD の枠色変更 | #25 | 設計+実装 |
| 8 | **"NEW" バッジ** — changelog.json ベースで新規ノードにバッジ表示 | #27 | 実装 |
| 9 | **DxE-suite 統合** — bin/dxe.js に DVE 追加、DEFAULT_TOOLKITS 更新 | #19 | 実装 |

## P2: Phase 2

| # | タスク | Gap | 種類 |
|---|--------|-----|------|
| 10 | **Spec ノード + produces/implements エッジ** — dge/specs/*.md パーサー追加 | spec | 設計+実装 |
| 11 | **git-linker** — `Ref: DD-*` を git log からスキャン → implements エッジ生成 | #10 | 設計+実装 |
| 12 | **DVE → DGE ファイル参照方式** — `context: dve/contexts/ctx-xxx.json` を DGE Phase 0 で読み込み | #21 | DGE 側改修 |
| 13 | **Web UI 検索/フィルタ** — ブラウザ内テキスト検索 + severity/date フィルタ | UC | 実装 |
| 14 | **Web UI から Annotation 直接作成** — local server or filesystem API | UC-2 | 設計+実装 |
| 15 | **ドリフト自動検出** — git diff ベースで DD 関連ファイルの変更を検出 | #23 | 設計+実装 |
| 16 | **クラスタリング** — supersedes チェーン or テーマ類似度で DD をグルーピング | UC | 設計 |
| 17 | **複数プロジェクト横断ビュー** | #16 | 設計 |
| 18 | **キャラカバレッジ分析** — どのキャラがどの Gap を発見したかのヒートマップ | UC | 設計+実装 |
