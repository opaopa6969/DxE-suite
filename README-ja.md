[English version](README.md)

# DxE-suite

**4 つの D\*E toolkit** — DGE / DDE / DVE / DRE — を 1 つのスイートに統合する monorepo（**v4.2.0**）。

> **DxE** = **D**esign × **E**xtraction + **E**nforcement + **E**ngine。
> *穴を見つける*（DGE / DDE）→ *決定を可視化する*（DVE）→ *ルールを配布して強制する*（DRE）、
> という 1 つのライフサイクルをカバーする。

```
D*E シリーズ:
  DGE — Design-Gap Extraction         会話劇で設計の穴を発見
  DDE — Document-Deficit Extraction   LLM + CLI でドキュメントの穴を発見し、用語を自動リンク
  DVE — Decision Visualization Engine 決定グラフを可視化、DGE 再起動のハブ
  DRE — Document Rule Engine          rules / skills / hooks をパッケージ化、hook で強制
```

**ドキュメント**: [アーキテクチャ](docs/architecture-ja.md) | [Getting Started](docs/getting-started-ja.md) | [dde-toolkit からの移行](docs/migration-from-dde-toolkit-ja.md) | [CHANGELOG](CHANGELOG.md)

**ADR**: [0001 — Stop(LLM prompt) hook 削除](docs/decisions/0001-remove-stop-llm-prompt-hook.md) | [0002 — DDE を monorepo 統合](docs/decisions/0002-archive-dde-into-monorepo.md)

---

## 目次

- [DxE-suite とは](#dxe-suite-とは)
- [4 つの toolkit](#4-つの-toolkit)
- [monorepo 構成](#monorepo-構成)
- [クイックスタート](#クイックスタート)
- [`dxe` CLI](#dxe-cli)
- [DVE コマンド](#dve-コマンド)
- [DRE ワークフローエンジン](#dre-ワークフローエンジン)
- [DGE + DRE + DVE + DDE 連携フロー](#dge--dre--dve--dde-連携フロー)
- [既知の問題](#既知の問題)
- [ドキュメントマップ](#ドキュメントマップ)

---

## DxE-suite とは

DxE-suite は、プロジェクト（あるいは開発者のシェル）に 1 度インストールするだけで、
D\*E の全機能が配線された状態で使えるようになる**単一の入口**。

- **22 の Claude Code skills**（DGE 3 + DRE 13 + DVE 6）+ DDE の skills をバージョン管理下で配布
- **Hook ベースのワークフロー強制** — PostToolUse / Stop / commit-msg hook が、
  - すべての設計判断が `DD-NNN` として保存されているか
  - DGE session に会話劇の本文が残っているか
  - commit メッセージが正しい DD を参照しているか
  を**コードで**検証する
- **可視化された決定グラフ** — Session → Gap → DD → Spec が `graph.json` のノードとなり、DVE Web UI で表示される
- **自動リンク用語集** — DDE が用語を抽出して教育的な記事を生成し、元のドキュメントに `[term](docs/glossary/xxx.md)` を書き戻す

統一バージョンは **v4.2.0**（DGE / DDE / DRE / DVE すべて）。詳細は [CHANGELOG.md](CHANGELOG.md)。

---

## 4 つの toolkit

| Toolkit | 役割 | パッケージ | ドキュメント |
|---|---|---|---|
| **DGE** | **設計**の穴を、視点の異なるキャラクター達の会話劇で見つける。30 分のセッションで 3〜7 個のアーキテクチャレベルの Gap が浮上する。 | [`@unlaxer/dge-toolkit`](./dge/kit/) | [kit README](./dge/kit/README.md) · [メソッド](./dge/kit/method.md) · [パターン集](./dge/kit/patterns.md) |
| **DDE** | **ドキュメント**の穴を見つける。全用語を抽出し、3 段階の読者レベルに合わせた 1 用語 1 ファイルの記事を生成し、元のドキュメントに自動リンクする。 | [`@unlaxer/dde-toolkit`](./dde/kit/) | [kit README](./dde/README.md) |
| **DVE** | **決定**グラフを可視化する。DD をクリックするとそれを生んだ会話劇が出る。孤立 Gap はまだ決まっていないことを見せる。 | [`@unlaxer/dve-toolkit`](./dve/kit/) | [DVE kit](./dve/kit/) |
| **DRE** | rules / skills / hooks をバージョン管理されたパッケージとして**配布・強制**する。PostToolUse + Stop + commit-msg hook でテキストの約束ではなくコードが走る。 | [`@unlaxer/dre-toolkit`](./dre/kit/) | [DRE kit](./dre/kit/) · [flows](./dre/docs/flows.md) · [strategy](./dre/docs/strategy.md) |

---

## monorepo 構成

```
DxE-suite/                              (v4.2.0)
├── dge/                                DGE toolkit + server
│   ├── kit/                            @unlaxer/dge-toolkit (3 skills, 19 キャラ, 8 flows)
│   ├── server/                         @unlaxer/dge-server (オプションのキャラ推奨 API)
│   ├── sessions/                       会話劇全文を含む immutable セッションログ
│   ├── decisions/                      DD-NNN 設計判断記録
│   └── specs/                          生成された仕様
├── dde/                                DDE — Document-Deficit Extraction  (この repo に統合済み — ADR-0002)
│   └── kit/                            @unlaxer/dde-toolkit (linker + glossary 生成)
├── dre/                                DRE toolkit + enforcement engine
│   └── kit/                            @unlaxer/dre-toolkit (13 skills)
│       ├── engine/                     ワークフロー SM (state-machine.yaml + context.json)
│       ├── hooks/                      PostToolUse + Stop + commit-msg + notify
│       └── plugins/                    DGE/DDE/DVE plugin manifest（サブステート動的挿入）
├── dve/                                DVE — Decision Visualization Engine
│   ├── kit/                            @unlaxer/dve-toolkit (6 skills)
│   └── app/                            Web UI (Preact + Cytoscape.js + Vite)
├── .claude/                            このリポジトリ自身に配置された hooks + 22 skills
├── .dre/                               ワークフロー状態 (state-machine.yaml + context.json)
├── bin/dxe.js                          `dxe` CLI 本体
├── dve.config.json                     マルチプロジェクト DVE 設定
└── package.json                        workspaces: dge/kit, dge/server, dre/kit, dve/kit
                                        (⚠️ dde/kit は未登録 — 既知の問題を参照)
```

詳細は [docs/architecture-ja.md](docs/architecture-ja.md)。

---

## クイックスタート

```bash
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install

# このリポ自身に skills / rules / hooks を展開
node bin/dxe.js install --yes

# 使いたい skill を有効化（DRE はデフォルトで disabled/ に配置する）
node bin/dxe.js activate all     # または: dge / dde / dre / dve

# DVE 可視化 UI 起動
npx tsc -p dve/kit/tsconfig.json
node dve/kit/dist/cli/dve-tool.js build
cd dve/app && npm install && npx vite build && npx vite preview
# → http://localhost:4173
```

日常運用向けの shell alias と `dve up` ワンライナーは [docs/getting-started-ja.md](docs/getting-started-ja.md) を参照。

---

## `dxe` CLI

```
npx dxe install              DGE + DRE + DVE をインストール（デフォルト）
npx dxe install dde          単一 toolkit をインストール
npx dxe update               全 toolkit を更新 + changelog 表示 + Slack 通知
npx dxe activate all         全 skill を有効化
npx dxe activate dge         toolkit 単位で skill を有効化
npx dxe deactivate dve       toolkit 単位で skill を無効化
npx dxe status               インストール済みバージョン表示（monorepo / npm モード判定）
```

CLI は自分が monorepo の中にいるか、npm 依存として入っているかを自動判定する
（monorepo 時は `dge/kit` を直接、npm 時は `npx dge-install` を呼ぶ）。

---

## DVE コマンド

```
dve build                         全プロジェクトの graph.json 生成
dve serve [--watch]               Web UI + API (4173 + 4174)
dve status                        全プロジェクトのワークフロー SM + サブステート
dve scan [dir] [-r] [-a]          DxE プロジェクト自動発見 + 登録 + audit
dve trace DD-002                  因果チェーン (DD → Gap → Session)
dve impact DD-002                 影響範囲
dve orphans                       未解決 Gap (DD 未紐づき)
dve search "keyword"              全文検索
dve annotate <id> --action ...    comment / fork / overturn / constrain を UI から作成
dve context <id>                  DGE 再起動用 ContextBundle
dve clusters                      DD クラスタリング
dve drift                         ドリフト検出
```

---

## DRE ワークフローエンジン

```bash
dre-engine init                   .dre/ 初期化 + plugin 自動検出
dre-engine status                 ワークフロー SM + サブステート表示
dre-engine transition <phase>     フェーズ遷移
dre-engine sub-transition <state> plugin 内サブステート遷移
dre-engine push / pop             スタック操作
dre-engine install-plugin <file>  plugin manifest を追加
```

```
backlog → spec → {gap_extraction (DGE)} → impl → review → {doc_deficit_check (DDE)} → release
```

plugin（DGE / DDE / DVE）が動的にフェーズとサブステートを挿入する。

---

## DGE + DRE + DVE + DDE 連携フロー

```
  DGE (発見)            DVE (可視化)            DRE (強制+配布)            DDE (ドキュメント)
  ─────────             ─────────              ─────────                    ─────────
  「DGE して」
      ↓
  会話劇で Gap 発見
      ↓                                        PostToolUse hook
  session 保存 ───────→ dve build ←─────────── 会話劇全文の有無をチェック
      ↓                    ↓
  DD 記録 ─────────────→ graph.json            commit-msg hook
      ↓                    ↓                   「Ref: DD-NNN」を要求
  spec 生成 ───────────→ Web UI
                           ↓
                    ユーザー閲覧
                           ↓                                                「DDE して」
                ┌── annotation / overturn / fork                              ↓
                ↓                                Stop hook                  用語抽出
         DVE → DGE 再起動 ←─────────── 暗黙の決定検出 (stop-check.sh)           ↓
         (ContextBundle)              pending-decisions Slack 通知            記事生成
                ↓                                                             ↓
         新 DD ──────────────────────→ rules/skills → dre/kit/            dde-link で書き戻し
                                              ↓
                                       plugin manifest → Slack
                                              ↓
                                       `npx dxe install` でチーム全員同じ環境
```

---

## 既知の問題

- **`dde/kit` および `dge/kit` が `package.json` の `workspaces` に登録されていない。**
  現在 `workspaces` には `dge/kit, dge/server, dre/kit, dve/kit` のみが入っており、**`dde/kit` が抜けている**。
  `dxe install dde` 自体は `bin/dxe.js` が `dde/kit/bin/dde-install.js` を直接叩くため動作するが、
  hoisted `node_modules` は DDE 分構築されない。詳細は [docs/architecture-ja.md](docs/architecture-ja.md)、
  経緯は [docs/decisions/0002-archive-dde-into-monorepo.md](docs/decisions/0002-archive-dde-into-monorepo.md)。
- **Stop(LLM prompt) hook は v4.1.0 で削除**された。LLM prompt hook が JSON 以外を返す問題が解消できなかったため。
  現在は command hook の `stop-check.sh` 1 本で暗黙の決定検出を担う。詳細は [ADR-0001](docs/decisions/0001-remove-stop-llm-prompt-hook.md)。

---

## ドキュメントマップ

| | EN | JA |
|---|---|---|
| README | [README.md](README.md) | [README-ja.md](README-ja.md) |
| CHANGELOG | [CHANGELOG.md](CHANGELOG.md) | （共通） |
| アーキテクチャ | [docs/architecture.md](docs/architecture.md) | [docs/architecture-ja.md](docs/architecture-ja.md) |
| Getting Started | [docs/getting-started.md](docs/getting-started.md) | [docs/getting-started-ja.md](docs/getting-started-ja.md) |
| dde-toolkit からの移行 | [docs/migration-from-dde-toolkit.md](docs/migration-from-dde-toolkit.md) | [docs/migration-from-dde-toolkit-ja.md](docs/migration-from-dde-toolkit-ja.md) |
| ADR-0001 (Stop hook) | [docs/decisions/0001-remove-stop-llm-prompt-hook.md](docs/decisions/0001-remove-stop-llm-prompt-hook.md) | （共通） |
| ADR-0002 (DDE archive) | [docs/decisions/0002-archive-dde-into-monorepo.md](docs/decisions/0002-archive-dde-into-monorepo.md) | （共通） |
| Slack setup | [docs/slack-setup.md](docs/slack-setup.md) | — |
| DGE kit | [dge/kit/README.md](./dge/kit/README.md) | [dge/kit/README.md](./dge/kit/README.md) |
| DGE method | [dge/kit/method.md](./dge/kit/method.md) | [dge/kit/method.md](./dge/kit/method.md) |
| DDE kit | [dde/README.md](./dde/README.md) | [dde/README.ja.md](./dde/README.ja.md) |
| DRE kit | [dre/README.md](./dre/README.md) | — |
| DVE 仕様 | [dge/specs/dve-tech.md](./dge/specs/dve-tech.md) | — |

---

## ライセンス

MIT。
