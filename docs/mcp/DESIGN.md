# DxE-suite MCP 化設計（Phase 2）

> namespace: **`dxe`** | kind: **wrap (workspace)** | port: **9243** | runtime: node
> 作成: 2026-08-22 | Phase 1: [survey.json](survey.json) / [SURVEY.md](SURVEY.md)

## 1. namespace と種別

- **namespace**: `dxe`
- **種別**: wrap（workspace）— 既存の DGE API（Hono + SQLite, 3456）と DVE graph（純粋関数群 + graph.json）を薄く MCP ラップする
- **構成**: 単一 MCP サーバ（port 9243）。DGE は SQLite を直接読み、DVE は `dve/kit/` の純粋関数（`buildGraph`, `traceDecision`, `impactOf`, `orphanGaps`, `search`, `clusterBySupersedes`, `generateBundle`）を直接 import して使う。既存 HTTP API（3456/4174）の起動は不要

### 設計判断（Phase 1 open questions の暫定解）

| # | 質問 | 判断 | 理由 |
|---|---|---|---|
| 1 | DGE と DVE を 1 サーバに束ねるか | **1 サーバに束ねる** | 1 namespace 1 プロセスが運用最小。DGE は SQLite 直読み、DVE は純粋関数 import で HTTP 往復を無くす |
| 2 | catalog `dge-toolkit`(retired) を統合するか | **retired のまま、機能は dxe に統合** | retired エントリは触らず、dxe が上位互換の tool を提供。issue-hub で通告 |
| 3 | DDE/DRE skill を MCP skill 配信するか | **配信する（`skill://dxe-*`）** | エージェント以外からも呼べる。Claude Code skill と並行運用 |
| 4 | 外部プロジェクトのグラフ公開 | **ホワイトリスト化して公開** | `dve.config.json` の projects から `name` 一覧のみ許可。任意ディレクトリは渡せない |

## 2. tools 表

| name | 目的 | 入力 schema（要点） | 出力の形 | 副作用 | dry-run | job型 | 所要 | min_role |
|---|---|---|---|---|---|---|---|---|
| `list_sessions` | DGE セッション一覧 | `{project?: string}` | `[{id, theme, template, characters, gap_count, ...}]` | read | — | no | <100ms | VIEWER |
| `recommend_characters` | 議題に合うキャラ推奨 | `{agenda: string, template?: string, max?: int}` | `{characters: [...], preset: ...}` | read | — | no | <50ms | VIEWER |
| `list_patterns` | DGE パターン・プリセット一覧 | `{}` | `{presets: {key: {patterns, label}}}` | read | — | no | <10ms | VIEWER |
| `get_graph` | DVE 決定グラフ取得 | `{project?: string}` | `DVEGraph JSON`（nodes, edges, stats） | read | — | no | <200ms | VIEWER |
| `trace` | 決定の因果連鎖を遡る | `{ddId: string, project?: string}` | `[{type, id, data, ...}]` | read | — | no | <50ms | VIEWER |
| `impact` | ノードの下流インパクト | `{nodeId: string, project?: string}` | `[{type, id, data, ...}]` | read | — | no | <50ms | VIEWER |
| `orphans` | 決定未紐付の orphan gap | `{project?: string}` | `[{id, summary, severity}]` | read | — | no | <50ms | VIEWER |
| `search` | グラフ全文検索 | `{keyword: string, project?: string}` | `[{type, id, data}]` | read | — | no | <50ms | VIEWER |
| `drift` | コード乖離検出 | `{}` | `[{dd, file, lastModified, ddDate}]` | read | — | no | <2s | VIEWER |
| `status` | プロジェクト状態（DRE phase） | `{}` | `{projects: [{name, dre, workflow}]}` | read | — | no | <500ms | VIEWER |
| `clusters` | 決定クラスタ（supersedes 連鎖） | `{project?: string}` | `[{id, label, ddIds, gapCount}]` | read | — | no | <50ms | VIEWER |
| `build_context` | DGE 再開用 ContextBundle 生成 | `{originId: string, constraints?: string[], project?: string}` | `{suggested_action, summary, prompt_template}` | read | — | no | <100ms | VIEWER |
| `annotate` | ノードに注釈作成 | `{target: string, action?: string, author?: string, body: string, project?: string}` | `{ok: bool, file}` | **write** | **yes** | no | <100ms | MEMBER |
| `record_session` | DGE セッション記録 | `{theme: string, template?, pattern?, characters?, gaps...}` | `{id}` | **write** | **yes** | no | <100ms | MEMBER |

### 安全設計
- `annotate` / `record_session` は `confirm: bool=false`（既定 dry-run）。`false` なら書き込まず予定を返す。
- `drift` は `git log` を実行するが、`project` はホワイトリスト（`dve.config.json` の `projects[].path` のみ）から解決。任意ディレクトリは渡せない。

## 3. resources 表

| uri | 内容 | mime |
|---|---|---|
| `dxe://spec` | 能力の機械可読仕様（§2.2 形式） | application/json |
| `dxe://guide` | DxE lifecycle（DGE→DDE→DVE→DRE）の使い方 | text/markdown |

`dxe://spec` はサーバ起動時に登録済み tool から自動生成。`compositions` / `depends_on` は手書き。

## 4. prompts / skills

| name | 種別 | 用途 | locality | applies_when | requires |
|---|---|---|---|---|---|
| `dxe-restart-session` | skill | ContextBundle → DGE 再開手順 | repo | "DGE を再開したい／未決 gap から壁打ちを再起動したい" | — |
| `dxe-run-dde` | skill | DDE 実行手順（term 抽出 → article 生成 → dde-link） | repo | "ドキュメントの穴を補完したい／用語リンクを張りたい" | — |
| `dxe-dre-workflow` | skill | DRE ワークフロー初期化・運用手順 | repo | "DRE を導入したい／workflow phase を進めたい" | — |

skill は `docs/skills/<name>/SKILL.md`（volta-mcp 形式 frontmatter `volta:` 拡張）に配置し、resource `skill://dxe-restart-session` 等でも返す。

## 5. 組み合わせ例

1. **DGE ギャップの台本検証**
   `dxe__list_sessions` → `dxe__build_context`（gap の再検討プロンプト生成） → `kamishibai__validate`（台本構造の検証材料にする）
   データ: `list_sessions` が `{id, theme, gap_count}` → `build_context` が `{prompt_template}` → kamishibai に渡す

2. **未決定 gap の可視化と注釈**
   `dxe__get_graph` → `dxe__orphans`（orphan gap 抽出） → `dxe__annotate`（Web UI にコメント付け）
   データ: `orphans` が `[{id, summary, severity}]` → `annotate` が `{ok, file}`

3. **キャラ推奨 → セッション記録 → drift 監視**
   `dxe__recommend_characters` → `dxe__record_session` → `dxe__drift`
   データ: `recommend_characters` が `{characters}` → `record_session` が `{id}` → `drift` が `[{dd, file}]`

## 6. 依存と協調

| 相手 repo | 方向 | 入口 | 合意したいこと | 現状 |
|---|---|---|---|---|
| volta-mcp | depends_on | `volta__svc_add`, `volta__gateway_routes_apply`, `catalog__*` | namespace `dxe` の登録と gateway ルート追加 | 既存 API で可能 |
| DGE-toolkit (archived) | provides_to | catalog `dge-toolkit`(retired) | dxe が上位互換 tool を提供する旨の通告 | issue-hub で通告 |
| dve-app | provides_to | catalog `dve-app`（ホスト済み, 4173） | dxe MCP が graph データを共有することの通告 | issue-hub で通告 |

issue-hub で `submit_feedback(target_repo=volta-mcp, labels=["mcp-coordination"])` を立て、返答を待たず暫定仕様で進める。

## 7. 非対応にした候補

Phase 1 からの差分なし。DDE/DRE の tool 化は見送り（skill 配信で十分）。

## 8. 参加方法

- **manifest**: `volta.service.json`（root）。id: `dxe-suite-mcp`
- **ポート**: 9243（割当表 MCPIFY-phase2-plan.md #46）
- **ホスト**: 192.168.1.50（prod）
- **runtime**: node（systemd user unit）
- **auth**: minRole MEMBER（壊す系 tool があるため VIEWER には絞らない）
- **health**: `/healthz` → `{ok:true, name:"dxe", version:"4.2.0"}`
- **hostname**: `dxe-suite-mcp.unlaxer.org`

## 9. テスト方針

e2e（`node --test`）:
1. サーバ起動 → `GET /healthz` が 200
2. MCP Client（`@modelcontextprotocol/sdk` `Client` + `StreamableHTTPClientTransport`）で `tools/list`
3. `list_sessions` / `get_graph` / `search` 等の read tool が期待の形を返す
4. `annotate`（dry-run）が `confirm:false` で書き込まず予定を返す
5. `record_session`（dry-run）が `confirm:false` で書き込まず予定を返す
6. `dxe://spec` resource が tools と整合
7. `dxe://guide` resource が markdown で返る

CI があるなら `npm test` に組み込む。
