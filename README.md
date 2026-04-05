# DxE-suite

DGE / DRE の 1st-class toolkit を管理するモノレポ。

```
D*E シリーズ (1st-class):
  DGE — Design-Gap Extraction        設計の穴を会話劇で発見
  DRE — Document Rule Engine         rules/skills/agentsをパッケージ化
  DVE — Decision Visualization Engine 決定プロセスを可視化・DGEのハブ

関連 (別リポジトリ):
  DDE — Document-Deficit Extraction  ドキュメントの穴をLLM+CLIで発見
```

## セットアップ

```bash
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install
```

## Build & Run

### DGE / DRE — ツールキット展開

```bash
# DGE + DRE のスキル・ルールをプロジェクトに展開
node bin/dxe.js update --yes

# 個別に
node bin/dxe.js update dge --yes
node bin/dxe.js update dre --yes

# ステータス確認
node bin/dxe.js status
```

### DVE — 決定の可視化

```bash
# 1. graph.json を生成（dge/sessions/ と dge/decisions/ をパース）
npx tsc -p dve/kit/tsconfig.json
node dve/kit/dist/cli/dve-tool.js build

# 2. Web UI をビルド
cd dve/app
npm install
npx vite build        # → dve/dist/ に HTML + JS 出力

# 3. ブラウザで開く
npx vite preview      # http://localhost:4173
```

**DVE CLI コマンド:**

```bash
DVE=node dve/kit/dist/cli/dve-tool.js

# グラフ構築
$DVE build                     # graph.json + changelog.json 生成

# クエリ
$DVE trace DD-002              # DD の因果チェーンを表示
$DVE orphans                   # 未解決 Gap 一覧（DD に紐づかない）
$DVE search "JWT"              # ノード全文検索

# バージョン
$DVE version
```

**出力例:**

```
$ node dve/kit/dist/cli/dve-tool.js build
DVE build complete (0.0s):
  Sessions:    1
  Gaps:        29
  Decisions:   5
  Annotations: 0

$ node dve/kit/dist/cli/dve-tool.js trace DD-002
Trace: DD-002
  DD  DD-002: DVE データモデル v2 (2026-04-05) [active]
    ← Gap 2026-04-05-dve-design#G-001: session の Gap に一意 ID がない (Critical)
    ← Session: 2026-04-05-dve-design (今泉, ヤン, 深澤, ビーン, リヴァイ, 僕)
    ...

$ node dve/kit/dist/cli/dve-tool.js orphans
Orphan gaps (11 — no decision linked):
  2026-04-05-dve-design#G-003: L1 表示方針 (High)
  ...
```

### DGE Server（オプション）

```bash
cd dge/server
npm install
npm run dev              # http://localhost:3456
```

## 構成

```
DxE-suite/
├── dge/               DGE toolkit + server
│   ├── kit/           @unlaxer/dge-toolkit
│   ├── server/        @unlaxer/dge-server
│   ├── sessions/      DGE セッションログ（immutable）
│   ├── decisions/     DD-NNN 設計判断記録
│   └── specs/         生成された spec (draft → reviewed → migrated)
├── dre/               DRE toolkit
│   └── kit/           @unlaxer/dre-toolkit
├── dve/               DVE — Decision Visualization Engine
│   ├── kit/           @unlaxer/dve-toolkit (parser + graph + CLI)
│   ├── app/           Web UI (Preact + Cytoscape.js + Vite)
│   ├── annotations/   ユーザーコメント・異議
│   ├── contexts/      ContextBundle 出力先（DVE → DGE）
│   └── dist/          ビルド成果物 (graph.json + HTML)
├── bin/               共通CLI (dxe)
└── docs/
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
- **19体のキャラクター**: Columbo（前提を疑う）、Picard（品質を守る）、Red Team（攻撃視点）、House（隠れた問題）など
- **23の対話パターン + 5プリセット**: コントラスト / 探索 / 限界テストの3カテゴリ
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

---

## DRE — Document Rule Engine

> Claude Code の rules / skills / agents / commands / profiles を npm パッケージとして配布・管理する。

手動で `.claude/` をコピーする代わりに、DRE は設定を **バージョン管理されたパッケージ** として配布する。
ESLint shareable configs の Claude Code 版。

**カスタマイズを保護しながら安全にアップデート。チーム全員が同じルール環境で動ける。**

### 主な機能

- **6つの配布対象**: rules / skills / agents / commands / profiles / templates
- **安全なアップデート**: ユーザーが編集したファイルは `[skip]` でスキップ（上書きしない）
- **スキル活性化**: `disabled/` への移動で無効化、削除せず復元可能
- **reset**: 個別ファイルを kit 版に復元（バックアップ付き）
- **マニフェスト管理**: SHA256 ハッシュで差分を追跡

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

DGE のセッションと DD（設計判断）をグラフ構造で表現し、「なぜこの仕様なのか」を **3 クリックで辿れる** ようにする。grep + 目視で 15 分かかる調査が 30 秒に。

**DVE のコアバリュー = 未決定の可視化。** DD に紐づかない孤立 Gap を検出し、「まだ決定されていないこと」を見せる。

### 主な機能

- **Data Model**: Session / Gap / Decision / Annotation の 4 ノード + 4 エッジ
- **CLI**: `build` (graph.json 生成), `trace` (因果チェーン), `orphans` (未解決Gap), `search`
- **Web UI**: Preact + Cytoscape.js — DD 折りたたみグラフ + クリックドリルダウン
- **DVE → DGE**: ContextBundle 生成 → クリップボードコピー → DGE 再起動（疎結合）
- **Annotation**: session を汚さずコメント・異議・撤回を記録

### 6 つのユースケース

| UC | 説明 |
|----|------|
| Read | DD → Gap → Session の因果チェーンを辿る |
| Annotate | 過去の会話にコメントを付ける |
| Fork | 特定の Gap からやり直す |
| Constrain | 制約を追加して再 DGE |
| Overturn | 決定を撤回し影響範囲を可視化 |
| Context | 過去の文脈を復元して DGE に渡す |

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

DGE → DD → DVE → DGE のフィードバックループ + DRE でチームに配布：

```
  DGE (発見)              DVE (可視化)           DRE (配布)
  ─────────              ─────────              ─────────
  "DGEして"
    ↓
  会話劇でGap発見
    ↓
  dge/sessions/ に記録 ──→ npx dve build
    ↓                        ↓
  DD として記録         →  graph.json 更新
    ↓                        ↓
  spec生成              →  ブラウザで可視化
                              ↓
                         ユーザーが閲覧
                              ↓
                 ┌──── 「ここ違う」「深掘りたい」
                 ↓
           DVE → DGE 再起動
           (ContextBundle)
                 ↓
           新しい DGE セッション ──→ 新しい DD ...
                                        ↓
                                   rules/skills化 → dre/kit/
                                        ↓
                                   npx dxe install
                                        ↓
                                   チーム全員が同じ環境
```

## ステートマシン

### DGE セッション

```
[START]
  ↓
Flow検出 (quick / design-review / brainstorm / tribunal / ...)
  ↓
コンテキスト収集 (README, docs/, package.json, git log 自動読み取り)
  ↓
テーマ明確化
  ↓
キャラクター選出 (固定枠: Yang+Columbo + 可変枠: テーマ別)
  ↓
会話劇生成 → Gap マーキング
  ↓
Gap 構造化 (カテゴリ × 重要度)
  ↓
セッション保存 → dge/sessions/
  ↓
┌──────────────────────────────────┐
│ ユーザー選択:                      │
│  1. 別キャラ/パターンで再実行      │
│  2. 自動イテレーション             │
│     (C/H Gap = 0 で収束)          │
│  3. spec 生成                     │
│  4. 設計判断を DD として記録        │
│  5. 終了                          │
└──────────────────────────────────┘
```

### DRE インストール状態

```
FRESH (未インストール)
  ↓  npx dxe install
INSTALLED (v4.0.0, kit と一致)
  ↓  ユーザーが .claude/skills/ を編集
CUSTOMIZED (v4.0.0, 差分あり)
  ↓  kit が v4.1.0 にアップデート
OUTDATED (local v4.0.0 < kit v4.1.0)
  ↓  npx dxe update
INSTALLED (v4.1.0, 新規ファイルのみ同期)

※ カスタマイズ済みファイルは [skip] — 上書きされない
※ dre reset <file> で個別復元可能
```

### DVE グラフノード

```
Session (immutable)
  ↓ discovers
Gap (session scoped ID)
  ↓ resolves
Decision (DD-NNN)
  ↓ supersedes
Decision (DD-NNN, 新)

Annotation ──annotates──→ Session | Gap | Decision
  actions: comment | fork | overturn | constrain | drift

DVE → DGE:
  ContextBundle (JSON) → prompt_template → クリップボード → DGE 起動
```

### Spec ライフサイクル

```
draft → reviewed → migrated (docs/ へ)
```

`dge/specs/` は提案。プロジェクトの `docs/` が正（Source of Truth）。

---

## 関連

- [DDE-toolkit](https://github.com/opaopa6969/DDE-toolkit) — ドキュメントの穴をLLM+CLIで補完（別リポジトリ）
