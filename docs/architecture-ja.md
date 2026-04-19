[English version](architecture.md)

# アーキテクチャ

DxE-suite リポジトリが**なぜ**この構造になっているか — monorepo 構成、
workspaces 構成、DGE / DDE / DVE / DRE 間の責務境界 — を説明する。

## 1. リポジトリ構成

```
DxE-suite/                              (monorepo ルート, v4.2.0)
├── bin/dxe.js                          統合 CLI (install / update / status / activate / deactivate)
├── package.json                        workspaces: dge/kit, dge/server, dre/kit, dve/kit
├── dve.config.json                     マルチプロジェクト DVE 設定
│
├── dge/                                DGE — Design-Gap Extraction
│   ├── kit/                            npm: @unlaxer/dge-toolkit  (3 skills)
│   ├── server/                         npm: @unlaxer/dge-server   (キャラ推奨 API)
│   ├── characters/                     19 デフォルトキャラ + カスタム枠
│   ├── flows/                          quick / design-review / brainstorm / tribunal / wargame / …
│   ├── sessions/                       immutable セッションログ（会話劇本文は必須）
│   ├── decisions/                      DD-NNN (1 ファイル = 1 設計判断)
│   ├── specs/                          フロー完了時に生成される仕様
│   └── paper/                          メソッド論文
│
├── dde/                                DDE — Document-Deficit Extraction  (subtree 統合, ADR-0002)
│   ├── kit/                            npm: @unlaxer/dde-toolkit
│   │   ├── bin/dde-install.js          インストーラ (bash ではなく node)
│   │   ├── bin/dde-tool.js             CLI: extract / articleize
│   │   ├── lib/                        dde-link (Markdown リライタ)
│   │   ├── flows/quick.yaml            DDE 6 ステップフロー
│   │   └── skills/                     dde-session.md, dde-update.md
│   └── README.md / README.ja.md        方法論
│
├── dre/                                DRE — Document Rule Engine
│   ├── kit/                            npm: @unlaxer/dre-toolkit (13 skills)
│   │   ├── engine/                     workflow engine (state-machine.yaml + context.json)
│   │   ├── hooks/                      post-check.sh / stop-check.sh / commit-msg.sh / notify.sh
│   │   │   └── settings.json           Claude Code hooks manifest (.claude/ と共有)
│   │   ├── plugins/                    dge-plugin.yaml, dde-plugin.yaml, dve-plugin.yaml
│   │   ├── rules/                      MUST ルール群
│   │   └── skills/                     13 skills（デフォルトで disabled/ に配置）
│   └── docs/                           flows.md, strategy.md
│
├── dve/                                DVE — Decision Visualization Engine
│   ├── kit/                            npm: @unlaxer/dve-toolkit (6 skills)
│   │   ├── parser/                     session / decision / spec / annotation / git-linker / glossary / drift / state
│   │   ├── graph/                      schema + builder + query + cluster
│   │   ├── context/                    ContextBundle 生成 (DVE → DGE 再起動)
│   │   ├── server/                     API: annotations, drift, coverage, scan, status, slack
│   │   └── scripts/                    recover-all, recover-dialogues, discover-decisions, audit-duplicates
│   ├── app/                            Web UI: Preact + Cytoscape.js + Vite
│   ├── annotations/                    ユーザーコメント / 異議 / fork
│   └── contexts/                       生成された ContextBundle
│
├── .claude/
│   ├── settings.json                   hooks (PostToolUse + Stop + commit-msg)
│   ├── skills/                         22 skills (DGE 3 + DRE 13 + DVE 6); DDE は activate 時に追加
│   │   └── disabled/                   デフォルトで disabled。`dxe activate` が skills/ に移動
│   ├── rules/                          rules/dre-skill-control.md など
│   └── projects/                       プロジェクト別キャッシュ (gitignored)
│
└── .dre/
    ├── state-machine.yaml              ベースワークフロー: backlog → spec → impl → review → release
    ├── context.json                    現在のフェーズ + サブステート + スタック
    ├── dre-config.json                 通知チャネル、stop-hook 設定
    ├── hooks/                          dre/kit/hooks/* のコピー
    ├── notifications.json              通知履歴
    └── pending-decisions.json          検出されたが未記録の決定
```

## 2. npm workspaces — 登録済みと**未登録**

ルート `package.json`:

```json
"workspaces": [
  "dge/kit",
  "dge/server",
  "dre/kit",
  "dve/kit"
]
```

### 2.1 動作

ルートで `npm install` すると、`dge/kit` / `dge/server` / `dre/kit` /
`dve/kit` の依存がルート `node_modules/` に hoist される。各パッケージの
`bin/` は `node_modules/.bin/` から呼べるようになる。

### 2.2 既知のバグ — 未登録項目

**`dde/kit` が `workspaces` に登録されていない。** 結果:

- ルート `npm install` では `dde/kit` の依存が hoist されず、
  workspaces 経由では `dde/kit/node_modules` が整わない。
- `dde/kit/bin/dde-install.js` が動くのは、`bin/dxe.js`（`TOOLKITS.dde`）
  が `runWith: 'node'` 指定で**直接**起動しているから。
  `npx dxe install dde` 自体は問題なく動く。
- ただし `npm run ... --workspace=dde/kit` のような workspaces 依存の
  dev ワークフロー、あるいは `dge/kit` 側から `dde-toolkit` を解決させる
  ようなケースは**失敗する**。

`dge/kit` は workspaces に登録されている一方で、DGE install script
（`dge/kit/install.sh`）でも直接使われる。両方の経路で動くので問題はない。

この修正は「DDE を subtree として抱え込む」意図（[ADR-0002](decisions/0002-archive-dde-into-monorepo.md)）
に対する追加作業として認識されている。`"dde/kit"` を `workspaces` に足す
編集はまだ入っていない。作業前に **`dde/kit/package.json` の `bin`
エントリが他 workspace と衝突しないか**を確認すること。

最終的には以下の形を目指す:

```json
"workspaces": [
  "dge/kit",
  "dge/server",
  "dde/kit",
  "dre/kit",
  "dve/kit"
]
```

## 3. 責務境界

4 つの toolkit は**直交した**責務を持つ。何をどこに入れるかを迷わない
ように、境界を明示する。

| 関心事 | DGE | DDE | DVE | DRE |
|---|---|---|---|---|
| **設計**の gap 発見 | ✅ | | | |
| **ドキュメント**の gap 発見 | | ✅ | | |
| 決定グラフの可視化 | | | ✅ | |
| rules / skills / hooks の配布 | | | | ✅ |
| DD の記録 | `dge/decisions/DD-NNN.md` を書く | | *読み取りのみ* | commit の `Ref: DD-NNN` を強制 |
| session の記録 | `dge/sessions/*.md` を書く | `dde/sessions/*.md` を書く | *読み取りのみ* | 会話劇全文を強制 |
| 用語集生成 | | `docs/glossary/*.md` を書く | *読み取り（ホバー表示）のみ* | |
| ワークフロー所有権 | 利用者 | 利用者 | 利用者 | **所有者** — state-machine.yaml + plugins |
| Hook 所有権 | — | — | — | **所有者** — PostToolUse / Stop / commit-msg |

### 3.1 DGE

薄い責務: **session / decision / spec を書く**こと。DGE はグラフ・用語集・
hook を知らない。Markdown を `dge/sessions/`・`dge/decisions/`・`dge/specs/`
に書くだけ。品質基準は**対話品質**（視点の衝突から gap を浮上させる）で
定義されている — [`dge/kit/method.md`](../dge/kit/method.md) 参照。

### 3.2 DDE

薄い責務: **用語記事を書き**、他のドキュメントを**リライト**してリンクする。
DDE は DD ファイルを知らない。成果物は `docs/glossary/` に完結する。
リライタ (`npx dde-link`) は Markdown に対する純粋なテキストパスで、
CI 用に `--check` モードを持つ。

### 3.3 DVE

**読み取り・描画のみ**。DVE のパーサは session / decision / spec /
annotation / Git 履歴を読み、`graph.json` を構築する。Web UI と server
はこのグラフへのクエリを提供する。DVE は `dge/` や `dde/` には書き込まない。
書くのは `dve/annotations/`・`dve/contexts/`・自分の `graph.json` のみ。

コアバリューは**未決定の可視化**。DD に紐づかない孤立 Gap は DVE の
プロダクトであって、DGE のプロダクトではない。これが「可視化エンジンを
分離する」ことの本質的な意味。

### 3.4 DRE

**能動側**。DRE が所有するもの:

- **ワークフローステートマシン**: `.dre/state-machine.yaml`。Plugin
  （DGE / DDE / DVE — `dre/kit/plugins/` 参照）はフェーズとサブステートを
  *挿入*できるが、*所有*はできない。
- **Hook**: `post-check.sh` / `stop-check.sh` / `commit-msg.sh` /
  `notify.sh`。ここで「ルールがコードになる」。
- **ワークフロー遷移 CLI**: `dre-engine transition`, `sub-transition`,
  `push/pop`。
- **通知チャネル**: `DRE_NOTIFY_URL`、`.dre/dre-config.json`。

ルールが何かを**ブロック**する必要があるなら DRE。単に**表示**するだけなら
DVE。何かを**書く**なら DGE か DDE。

## 4. Toolkit 間の契約

### 4.1 DGE → DVE: `dge/sessions/*.md`

DVE の session パーサは会話劇本文の**逐語保存**を前提とする（要約は不可）。
DRE の PostToolUse hook がこれを強制する。本文が欠けると、DVE の
「Gap → 会話劇の該当行にジャンプ」が壊れる。

### 4.2 DGE → DVE → DRE: `dge/decisions/DD-NNN.md`

DD ファイルには Session 参照を含めること。DVE はこれを読んで辺を張り、
DRE の commit-msg hook は `Ref: DD-NNN` trailer を必須とする。

### 4.3 DDE → 全員: `docs/glossary/*.md`

DDE が Markdown をここに書く。他ツール（DVE Web UI、読者）は
`[term](docs/glossary/xxx.md)` でリンクする。CI の `dde-link --check` が
壊れたリンクを阻止する。

### 4.4 DRE plugin manifest

各 DxE toolkit は `dre/kit/plugins/` に plugin manifest を配置し、
どのワークフローフェーズとサブステートを挿入すべきかを DRE に伝える。
こうして「DRE SM は DGE を知っているように見える」が、DRE コードは DGE
に依存しない、という構造が保たれる。

## 5. リリース単位

すべての toolkit は現在 **v4.2.0**。バージョン bump は 1 コミットで
同期する（[CHANGELOG.md](../CHANGELOG.md) 参照）。これにより
`dxe status` の解釈が単純になる — 4.2.0 でない項目があれば、それがドリフト。

## 6. 関連ドキュメント

- [ADR-0001 — Stop(LLM prompt) hook 削除](decisions/0001-remove-stop-llm-prompt-hook.md)
- [ADR-0002 — DDE を monorepo に統合](decisions/0002-archive-dde-into-monorepo.md)
- [dde-toolkit からの移行](migration-from-dde-toolkit-ja.md)
- [Getting Started](getting-started-ja.md)
