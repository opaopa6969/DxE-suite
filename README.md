# DxE-suite

DGE / DRE の 1st-class toolkit を管理するモノレポ。

```
D*E シリーズ (1st-class):
  DGE — Design-Gap Extraction   設計の穴を会話劇で発見
  DRE — Document Rule Engine    rules/skills/agentsをパッケージ化

関連 (別リポジトリ):
  DDE — Document-Deficit Extraction  ドキュメントの穴をLLM+CLIで発見
```

## セットアップ

```bash
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install
```

## 構成

```
DxE-suite/
├── dge/          DGE toolkit + server
│   ├── kit/      @unlaxer/dge-toolkit
│   └── server/   @unlaxer/dge-server
├── dre/          DRE toolkit
│   └── kit/      @unlaxer/dre-toolkit
├── bin/          共通CLI (dxe)
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

## DGE + DRE 連携フロー

DGE で発見した Gap が DRE を通じてチームに配布されるパイプライン：

```
  DGE (発見)                          DRE (配布)
  ─────────                          ─────────
  "DGEして"                           
    ↓                                 
  会話劇でGap発見                      
    ↓                                 
  dge/sessions/ に記録                 
    ↓                                 
  spec生成 → dge/specs/ (draft)        
    ↓                                 
  レビュー → (reviewed)                
    ↓                                 
  rules/skills化                →    dre/kit/ に追加
                                       ↓
                                     npm publish
                                       ↓
                                     npx dxe install
                                       ↓
                                     .claude/ に展開
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

### Spec ライフサイクル

```
draft → reviewed → migrated (docs/ へ)
```

`dge/specs/` は提案。プロジェクトの `docs/` が正（Source of Truth）。

---

## 関連

- [DDE-toolkit](https://github.com/opaopa6969/DDE-toolkit) — ドキュメントの穴をLLM+CLIで補完（別リポジトリ）
