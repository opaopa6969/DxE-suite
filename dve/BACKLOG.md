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

## P0: 完了

| # | タスク | Gap | Status |
|---|--------|-----|--------|
| 1 | ✅ `npx dve serve --watch` — chokidar ファイル監視 + 自動リビルド | #22 | 完了 |
| 2 | ✅ ContextBundle 生成 (`dve/kit/context/bundle.ts`) + `dve context` CLI | #12, #14 | 完了 |
| 3 | ✅ `npx dve annotate` CLI — annotation ファイル生成 | #29 | 完了 |
| 4 | ✅ DD ノードサイズ比例 — 関連 Gap 数に応じたノードサイズ | #26 | 完了 |
| 5 | ✅ パーサーレポート — severity unknown, no markers 件数表示 | #18 | 完了 |
| 6 | ✅ `dve impact` CLI — 影響範囲表示 | #15 | 完了 |

## P1: 完了

| # | タスク | Gap | Status |
|---|--------|-----|--------|
| 7 | ✅ annotation 重みづけ + DD ノードスタイル (overturn/drift/constrain) | #25 | 完了 (NodeStyles.ts) |
| 8 | ✅ "NEW" バッジ — changelog.json ベースでノードにバッジ | #27 | 完了 (GraphContainer.tsx) |
| 9 | ✅ DxE-suite 統合 — bin/dxe.js に DVE 追加、DEFAULT_TOOLKITS 更新 | #19 | 完了 |
| 10 | L3 DialogueView — Gap line_ref 中心ハイライト + キャラ色分け + アイコン | #28 | Phase 2 に移動（session 本文読み込みが必要） |

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
