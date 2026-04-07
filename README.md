# DxE-suite

DGE / DRE / DVE の 1st-class toolkit を管理するモノレポ。

```
D*E シリーズ (1st-class):
  DGE — Design-Gap Extraction        設計の穴を会話劇で発見
  DRE — Document Rule Engine         rules/skills/hooks で配布・強制
  DVE — Decision Visualization Engine 決定プロセスを可視化・DGEのハブ

関連 (別リポジトリ):
  DDE — Document-Deficit Extraction  ドキュメントの穴をLLM+CLIで発見
```

## クイックスタート

```bash
# インストール
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install

# 全ツールキット展開
node bin/dxe.js install --yes

# DVE 起動（決定の可視化）
npx tsc -p dve/kit/tsconfig.json
node dve/kit/dist/cli/dve-tool.js build
cd dve/app && npm install && npx vite build && npx vite preview
# → http://localhost:4173
```

**bash aliases（推奨）:**

`.bashrc` に以下を追加:
```bash
DXE_HOME="$HOME/work/AskOS-workspace/DxE-suite"
alias dve="node $DXE_HOME/dve/kit/dist/cli/dve-tool.js"
alias dxe="node $DXE_HOME/bin/dxe.js"
alias dre-engine="node $DXE_HOME/dre/kit/engine/engine.js"
alias dve-serve="dve serve --watch"
alias dve-build="dve build"
alias dve-scan="dve scan"
alias dve-status="dve status"

dxe-install() { node "$DXE_HOME/bin/dxe.js" install --yes && node "$DXE_HOME/dre/kit/engine/engine.js" init 2>/dev/null; }
dve-up() { npx tsc -p "$DXE_HOME/dve/kit/tsconfig.json"; dve build; cd "$DXE_HOME/dve/app" && npx vite build; cd -; dve serve --watch; }
```

## DVE コマンド一覧

```bash
dve build                    全プロジェクトの graph.json 生成
dve serve [--watch]          Web UI + API (4173 + 4174)
dve status                   全プロジェクトのワークフロー SM 表示
dve scan [dir] [-r] [-a]     DxE プロジェクト自動発見 + 登録 + audit
dve trace DD-002             因果チェーン (DD → Gap → Session)
dve impact DD-002            影響範囲
dve orphans                  未解決 Gap (DD 未紐づき)
dve search "keyword"         全文検索
dve annotate <id> --action <type> --body "text"
dve context <id> [--constraint="..."]  DGE 再起動用 ContextBundle
dve clusters                 DD クラスタリング
dve drift                    ドリフト検出
dve init / projects / version
```

## DRE ワークフローエンジン

```bash
dre-engine init              .dre/ 初期化 + plugin 自動検出
dre-engine status            ワークフロー SM + サブステート表示
dre-engine transition <phase>  フェーズ遷移
dre-engine sub-transition <state>  plugin 内サブステート遷移
dre-engine push / pop        スタック操作
dre-engine install-plugin <manifest>  plugin 追加
```

**出力例:**
```
Workflow: backlog → spec → [▶ gap_extraction] → impl → review → release
Current: gap_extraction > dialogue_generation (.dre/context.json)
Sub (dge): flow_detection → ... → [▶ dialogue_generation] → ... → user_choice
Plugins: dge v4.0.0
```

## 構成

```
DxE-suite/
├── dge/               DGE toolkit + server
│   ├── kit/           @unlaxer/dge-toolkit (3 skills)
│   ├── server/        @unlaxer/dge-server
│   ├── sessions/      DGE セッションログ（immutable + 会話劇全文）
│   ├── decisions/     DD-NNN 設計判断記録
│   └── specs/         生成された spec
├── dre/               DRE toolkit + enforcement engine
│   ├── kit/           @unlaxer/dre-toolkit (13 skills)
│   │   ├── engine/    ワークフロー SM (state-machine.yaml + context.json)
│   │   ├── hooks/     PostToolUse + Stop + commit-msg + notify
│   │   └── plugins/   DGE/DDE/DVE plugin manifest
│   └── docs/
├── dve/               DVE — Decision Visualization Engine
│   ├── kit/           @unlaxer/dve-toolkit (6 skills)
│   │   ├── parser/    session, decision, spec, annotation, git-linker, glossary, drift, state
│   │   ├── graph/     schema, builder, query, cluster
│   │   ├── context/   ContextBundle (DVE → DGE)
│   │   ├── server/    API (annotations, drift, coverage, scan, status, slack)
│   │   └── scripts/   recover-all, recover-dialogues, discover-decisions, audit-duplicates
│   ├── app/           Web UI (Preact + Cytoscape.js + Vite)
│   ├── annotations/   ユーザーコメント・異議
│   └── contexts/      ContextBundle 出力先
├── .dre/              ワークフロー状態 (git 管理)
│   ├── state-machine.yaml
│   ├── context.json
│   ├── dre-config.json
│   ├── hooks/         デプロイ済み hook
│   └── notifications.json
├── .claude/
│   ├── settings.json  hooks 設定 (PostToolUse + Stop + LLM prompt)
│   ├── skills/        22 skills (DGE 3 + DRE 13 + DVE 6)
│   └── rules/
├── bin/dxe.js         統合 CLI
└── dve.config.json    マルチプロジェクト設定
```

---

## DGE — Dialogue-driven Gap Extraction

> 会話劇で設計の「書いてないこと」を発見する。

LLM が「書いてあること」をレビューするのに対し、DGE は **書き忘れたこと** を見つける。
異なる視点を持つキャラクター（19体 + カスタム）が設計について議論し、
その衝突の中から **未文書化の前提・隠れた制約・見落とし** が Gap として浮上する。

**30分のセッションで 3-7 個の Gap を発見。多くはアーキテクチャレベルの発見。**

### 主な機能

- **8つのフロー**: quick / design-review / brainstorm / tribunal / wargame / pitch / consult / investigation
- **19体のキャラクター**: 今泉（前提を疑う）、ヤン（削る力）、Red Team（攻撃視点）、ハウス（隠れた問題）など
- **29の対話パターン (A-D) + 5プリセット**: コントラスト / 探索 / 限界テスト / **演出** の4カテゴリ
- **演劇技法**: 場面転換 / バックストーリー開示 / サブテキスト / 劇中劇 / 圧力状況 / 時間跳躍
- **キャラクター深化**: backstory（過去の経験）+ speech_pattern（口癖・語尾・比喩傾向）
- **auto_merge**: DGE（判断層）+ 通常LLMレビュー（詳細層）を並行実行し統合
- **Server**: キャラクター推奨エンジン + セッション管理API（オプション）

### ドキュメント

| | JA | EN |
|---|---|---|
| README (kit) | [dge/kit/README.md](./dge/kit/README.md) | [dge/kit/README.en.md](./dge/kit/README.en.md) |
| メソッド | [dge/kit/method.md](./dge/kit/method.md) | [dge/kit/method.en.md](./dge/kit/method.en.md) |
| インテグレーション | [dge/kit/integration-guide.md](./dge/kit/integration-guide.md) | [dge/kit/integration-guide.en.md](./dge/kit/integration-guide.en.md) |
| パターン集 | [dge/kit/patterns.md](./dge/kit/patterns.md) | [dge/kit/patterns.en.md](./dge/kit/patterns.en.md) |
| 内部仕様 | [dge/kit/INTERNALS.md](./dge/kit/INTERNALS.md) | [dge/kit/INTERNALS.en.md](./dge/kit/INTERNALS.en.md) |
| カスタマイズ | [dge/kit/CUSTOMIZING.md](./dge/kit/CUSTOMIZING.md) | [dge/kit/CUSTOMIZING.en.md](./dge/kit/CUSTOMIZING.en.md) |
| Server | [dge/server/README.md](./dge/server/README.md) | — |
| 演劇技法カタログ | [dge/design-materials/theatrical-techniques-catalog.md](./dge/design-materials/theatrical-techniques-catalog.md) | — |

---

## DRE — Document Rule Engine + Enforcement

> rules / skills / hooks をパッケージ化。Hook ベースのワークフロー強制。

手動で `.claude/` をコピーする代わりに、DRE は設定を **バージョン管理されたパッケージ** として配布する。
**Hook ベースの enforcement engine** で MUST ルールを強制（テキストの約束ではなくコードが実行される）。

### Enforcement Engine

| Hook | タイミング | チェック内容 |
|------|-----------|-------------|
| **PostToolUse** | Write/Edit のたび | DGE session に会話劇全文があるか、DD に Session 参照があるか、暗黙の決定パターン検出 |
| **Stop** (command) | 会話終了時 | gap_extraction 中の session 保存、pending decisions、graph stale |
| **Stop** (LLM prompt) | 会話終了時 | 会話全体から未記録の暗黙的決定を LLM が監査 |
| **commit-msg** | git commit 時 | DD 一覧表示 + `Ref: DD-NNN` を促す |

### 通知 (Slack / Discord / webhook / desktop)

```bash
# 環境変数で webhook URL を設定
export DRE_NOTIFY_URL="https://hooks.slack.com/services/..."
```

`.dre/dre-config.json`:
```json
{
  "notifications": {
    "channel": "slack",
    "min_level": "critical"
  },
  "stop_hook": {
    "llm_decision_review": true
  }
}
```

| Level | イベント |
|-------|---------|
| 🔴 critical | enforcement violation, Stop blocked, DD overturn |
| 🟡 daily | pending decisions, orphan gaps, drift |
| 🟢 info | graph stale, build 完了 |

### ワークフロー State Machine

Plugin（DGE, DDE）がフェーズを動的に挿入。サブステートも管理。

```
backlog → spec → {gap_extraction (DGE)} → impl → review → {doc_deficit_check (DDE)} → release
                        ↓
                   DGE sub-states:
                   flow_detection → context_collection → theme → characters →
                   dialogue_generation → gap_structuring → save → summary → user_choice
```

### ドキュメント

| | JA | EN |
|---|---|---|
| README (概要) | [dre/README.md](./dre/README.md) | — |
| README (kit) | [dre/kit/README.md](./dre/kit/README.md) | — |
| フロー図 | [dre/docs/flows.md](./dre/docs/flows.md) | — |
| 戦略 | [dre/docs/strategy.md](./dre/docs/strategy.md) | — |

---

## DVE — Decision Visualization Engine

> 決定プロセスを可視化し、過去の文脈から新しい DGE を起動するハブ。

**DVE のコアバリュー = 未決定の可視化。** DD に紐づかない孤立 Gap を検出し、「まだ決定されていないこと」を見せる。

### グラフフロー

```
Session → 🎭会話劇(N gaps) → Gap → DD → Spec
              ↓ click              ↓ click
         Gap 一覧展開        会話劇の該当行ハイライト
```

### Web UI 機能

- **Decision Map**: dagre レイアウト、DD 折りたたみ、クリックドリルダウン
- **Detail Panel**: DD/Gap/Session/Spec/Dialogue の全文 Markdown レンダリング
- **Gap → 会話劇ジャンプ**: line_ref ハイライトで「なぜこの Gap が出たか」を 3 クリックで到達
- **検索**: キーワードでノードを dimmed フィルタ
- **Glossary**: 用語に点線下線 + ホバーで定義表示（45+ エントリー自動抽出）
- **URL ルーティング**: `/#/decision/DD-003` で直接アクセス・共有可能
- **Scan**: ディレクトリスキャンで DxE プロジェクト自動発見 + 登録
- **State**: DRE ワークフロー SM + サブステート表示
- **Coverage**: キャラクター別 Gap 発見数
- **Onboarding**: 初回ガイド（用語集 + 操作方法）
- **Annotation**: コメント / fork / overturn / constrain / drift を UI から作成
- **DGE 再起動**: DD/Gap → リッチコンテキスト付きプロンプト → クリップボードコピー

### Slack Bot

Slack から直接 DVE を操作。[セットアップガイド](./docs/slack-setup.md)

```
/dve list dd              DD 一覧（ボタン付き）
/dve trace DD-003         因果チェーン
/dve orphans              未解決 Gap
/dve search 認証          検索
/dve status               全プロジェクト状態
/dve summary              統計
@DVE DD-003の経緯は？     メンション
```

### ツール重複検出（scan --audit）

自前実装が DxE toolkit で置き換え可能か全プロジェクト横断で検出。

```bash
dve scan /home/user/work --audit
#   volta-auth-proxy:
#     ⚠️  glossary-auto-linker.md → DDE dde-link
#     📦 DGE: 3.1.0 → 4.0.0 available
#   10 finding(s) across 7 projects
```

### Update Changelog

`dxe update` 時に新機能を表示 + Slack 通知。

```
📋 New in DGE:
  - 🆕 DD（設計判断）記録機能
  - 🆕 DVE ContextBundle 対応
  - 🆕 会話劇全文保存の enforcement hook
```

### リカバリースクリプト

```bash
# Claude Code ログから会話劇テキストを復元
bash dve/kit/scripts/recover-dialogues.sh /path/to/project [--apply]

# Write ツールの内容から session/DD/spec を復元
bash dve/kit/scripts/recover-all.sh /path/to/project [--apply]
bash dve/kit/scripts/recover-all.sh --scan-all

# 普段の会話から暗黙の決定を検出
bash dve/kit/scripts/discover-decisions.sh /path/to/project [--apply]

# 自前実装と DxE toolkit の重複を検出
bash dve/kit/scripts/audit-duplicates.sh /path/to/project
```

### ドキュメント

| | |
|---|---|
| Data Model | [dge/specs/dve-data-model.md](./dge/specs/dve-data-model.md) |
| Use Cases | [dge/specs/dve-uc.md](./dge/specs/dve-uc.md) |
| Tech Spec | [dge/specs/dve-tech.md](./dge/specs/dve-tech.md) |
| DGE Session | [dge/sessions/2026-04-05-dve-design.md](./dge/sessions/2026-04-05-dve-design.md) |
| DD 一覧 | [dge/decisions/index.md](./dge/decisions/index.md) |

---

## DGE + DRE + DVE 連携フロー

```
  DGE (発見)              DVE (可視化)           DRE (強制+配布)
  ─────────              ─────────              ─────────
  "DGEして"
    ↓
  会話劇でGap発見
    ↓                                          PostToolUse hook
  session 保存 ───────→ dve build ←──────── 会話劇全文チェック
    ↓                      ↓
  DD 記録 ────────────→ graph.json           commit-msg hook
    ↓                      ↓                   Ref: DD-NNN
  spec 生成 ──────────→ Web UI 表示
                            ↓
                       ユーザー閲覧
                            ↓
               ┌──── annotation / overturn / fork
               ↓                                    Stop hook
         DVE → DGE 再起動 ←─────────────── 暗黙の決定検出 (LLM)
         (ContextBundle)                    pending decisions 通知
               ↓
         新 DGE session ──→ 新 DD ...
                                ↓
                           rules/skills 化 → dre/kit/
                                ↓              ↓
                           plugin manifest   Slack 通知
                                ↓
                           npx dxe install
                                ↓
                           チーム全員が同じ環境
```

---

## 関連

- [DDE-toolkit](https://github.com/opaopa6969/DDE-toolkit) — ドキュメントの穴をLLM+CLIで補完（別リポジトリ）
