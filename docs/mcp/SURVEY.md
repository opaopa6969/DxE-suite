# DxE-suite MCP 化調査（Phase 1）

> 調査日: 2026-08-21 | repo: `opaopa6969/DxE-suite` | decision: **wrap**

## 概要

DxE-suite は DGE / DDE / DVE / DRE の 4 つの D\*E ツールキットを束ねる monorepo（v4.2.0）。
設計ギャップ抽出（DGE）→ ドキュメント欠陥補完（DDE）→ 決定の可視化（DVE）→ ルール配布・強制（DRE）の lifecycle を、1 つの `dxe` CLI で管理する。

| サブツールキット | 役割 | 既存サーバ | volta catalog |
|---|---|---|---|
| DGE | 会話劇で設計の gap を抽出 | API サーバ（Hono, 3456, SQLite）— オプション | `dge-toolkit`（retired） |
| DDE | ドキュメントの穴を補完・用語自動リンク | なし（CLI + skill 駆動） | `dde-toolkit`（CLI のみ） |
| DVE | 決定グラフを可視化・注釈・drift 検出 | Web UI（4173）+ API（4174, node:http） | `dve-app`（ホスト済み） |
| DRE | rules/skills/hooks を配布・強制 | なし（CLI + skill + hook 駆動） | `dre-toolkit`（CLI のみ） |

## 判定と理由

**wrap**（既存 API/CLI を薄く包む）。

- monorepo（workspace）は原則 `skip` だが、本リポジトリは内 2 つのサブツールキット（DGE/DVE）が既に独自 HTTP API を持ち、DVE は既に volta catalog に `dve-app` としてホスト済み。例外的に wrap の価値がある。
- 新規フル MCP サーバを起こすより、既存の DGE API（3456）と DVE API（4174）を薄く MCP ラップして `dxe` namespace に束ねるのが最もコスト低で価値が早く出る。
- DDE/DRE は Claude Code skill/hook 駆動でサーバを持たない。tool 化の必要は薄く、skill 配信で十分。

## 公開候補

| kind | name | io | 副作用 | 長時間 | 対応元 |
|---|---|---|---|---|---|
| tool | `list_sessions` | `{project?} → [{id, theme, ...}]` | read | no | dge/server `GET /api/sessions` |
| tool | `recommend_characters` | `{agenda, template?, max?} → {characters, preset}` | read | no | dge/server `POST /api/characters/recommend` |
| tool | `list_patterns` | `{} → {presets}` | read | no | dge/server `GET /api/patterns` |
| tool | `get_graph` | `{project?} → DVEGraph` | read | no | dve/kit/server/api.ts graph.json |
| tool | `trace` | `{ddId} → [chain]` | read | no | dve/kit/graph/query.ts |
| tool | `impact` | `{nodeId} → [affected]` | read | no | dve/kit/graph/query.ts |
| tool | `orphans` | `{} → [gaps]` | read | no | dve/kit/graph/query.ts |
| tool | `search` | `{keyword} → [nodes]` | read | no | dve/kit/graph/query.ts |
| tool | `drift` | `{} → [drifted]` | read | no | dve/kit/server/api.ts `GET /api/drift` |
| tool | `status` | `{} → {projects}` | read | no | dve/kit/server/api.ts `GET /api/status` |
| tool | `clusters` | `{} → [clusters]` | read | no | dve/kit/graph/cluster.ts |
| tool | `build_context` | `{originId, constraints?} → {prompt_template}` | read | no | dve/kit/context/bundle.ts |
| tool | `annotate` | `{target, action, author, body} → {ok, file}` | **write** | no | dve/kit/server/api.ts `POST /api/annotations` |
| tool | `record_session` | `{theme, ...} → {id}` | **write** | no | dge/server `POST /api/sessions` |
| resource | `spec` | `dxe://spec` | — | — | 能力の機械可読仕様（新規） |
| resource | `guide` | `dxe://guide` | — | — | lifecycle の使い方（新規） |
| skill | `dxe-restart-session` | — | — | — | ContextBundle → DGE 再開手順（locality: repo） |
| skill | `dxe-run-dde` | — | — | — | DDE 実行手順（locality: repo） |
| skill | `dxe-dre-workflow` | — | — | — | DRE ワークフロー運用手順（locality: repo） |

## 組み合わせ例

1. `dxe__list_sessions` → `dxe__build_context` → `kamishibai__validate`
   （DGE session の gap を台本構造の検証材料にする）
2. `dxe__get_graph` → `dxe__orphans` → `dxe__annotate`
   （未決定 gap を抽出し Web UI にコメント付け → DGE 再開のトリガ）
3. `dxe__recommend_characters` → `dxe__record_session` → `dxe__drift`
   （推奨キャラで DGE を回し、記録後 drift を監視）

## 依存と協調

| 相手 repo | 方向 | 能力 | 現存 | 備考 |
|---|---|---|---|---|
| volta-mcp | depends_on | MCP ファサード（catalog/probe/skill） | yes | namespace 追加に services.json + gateway_routes_apply が要る |
| DGE-toolkit (archived) | provides_to | DGE セッション・キャラクター API | no | 旧スタンドアロン、現 dge/server に統合済み。dxe で包めば retired 解除の余地 |
| DRE-toolkit (archived) | provides_to | DRE rules/skills 配布 | no | 現 dre/kit に統合。skill 配信のみ |
| DDE-toolkit (archived) | provides_to | DDE glossary linker | no | 現 dde/kit に統合。skill 配信のみ |

Phase 2 で issue-hub を通じて協調する可能性: 旧スタンドアロン repo の catalog エントリ整理（retired の統合）。

## ライブラリのサーバ化

DGE/DVE は既にサーバを持つが、MCP 規約（§1）を満たすには追加作業が必要。

| 追加作業 | 詳細 |
|---|---|
| healthz | DGE は `/api/health` を `/healthz` に正規化。DVE は API 4174 に `/healthz` を新設 |
| PORT | DGE は `DGE_PORT`、DVE は固定 4174 → `PORT` 環境変数に統一 |
| 0.0.0.0 bind | DVE は既に 0.0.0.0。DGE は `--host` 必須 → デフォルト化 |
| MCP /mcp | Streamable HTTP の `/mcp` を dge/server と dve/kit/server に追加、または軽量ブリッジ 1 プロセスで両 API を束ねる |
| manifest | `volta.service.json` をリポジトリ root に配置 |
| runtime | node。既存 `dve-app` サービスを拡張するか、新プロセス |

推定規模: **M**（2 API の MCP 化 + 規約準拠の調整。ブリッジ設計次第で S 寄り）

## リスク

- **SQLite**: DGE API は better-sqlite3 を使う。常駐化で DB パスとマイグレーション（`migrations/`）の取り回しを考慮。
- **パストラバーサル**: DVE API は `git log` で外部ディレクトリを叩く。MCP 経由で任意ディレクトリを渡されると懸念。ホワイトリスト化推奨。
- **破壊的操作**: `annotate`（ファイル書き込み）と `record_session`（DB 書き込み）は `confirm: bool=false` で dry-run を実装すべき。
- **2 プロセス**: DGE（3456）と DVE（4174）は別プロセス・別ポート。1 namespace に束ねるならブリッジプロセスか、ファサード側で 2 バックエンドをルーティングする設計が必要。
- **運用コスト**: monorepo 内の 2 サーバを健康に保つコストが乗る。

## 持ち主への質問

1. DGE API と DVE API を 1 つの `dxe` MCP サーバに束ねるか、2 バックエンドとして別々に volta に登録するか。
2. catalog の `dge-toolkit`（retired）を `dxe` namespace に統合して retired を解除するか、そのまま残すか。
3. DDE/DRE の skill を MCP の skill 配信（`skill://dxe-run-dde` 等）として出すか、Claude Code skill のまま運用するか。
4. `dve.config.json` が外部プロジェクト（`../propstack`, `../syslenz` 等）を参照している。MCP 経由でこれらのグラフも公開してよいか。
