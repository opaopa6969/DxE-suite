# DRE-toolkit 戦略メモ

## 命名の経緯

DGE-toolkit（Dialogue-driven Gap Extraction）、DDE-toolkit に並ぶ兄弟として、`D_E` パターンで命名。

候補：
- DAE — Daily Agent Engine
- DOE — Daily Operation Engine
- **DRE — Document Rule Engine** ← 採用
- DSE — Document Structure Engine

DRE を選んだ理由：rules / skills / agents を管理するという「中身」に最も近い名前。

## 何をするものか

Claude Code をうまく使うための仕組みをパッケージ化する。具体的には：

- `.claude/rules/` — 行動ルール・制約
- `.claude/skills/` — スキル定義
- `.claude/commands/` — コマンド定義
- `CLAUDE.md` — プロジェクト固有の指示

これらを npm パッケージとして配布し、新プロジェクトへの展開・アップデートを自動化する。

## 世界標準との比較（2026年4月時点）

### 現状

Claude Code の設定を配布する方法として確立しているのは「GitHub repo + 手動コピー」のみ。
npm パッケージ化した例はまだない。コミュニティは awesome-claude-skills 系のキュレーションリストに収束しつつある段階。

### 最も近いアナロジー：ESLint shareable config

| ESLint config | DRE-toolkit |
|---|---|
| npm publish | npm publish |
| postinstall でファイル展開 | install.sh / update.sh |
| `extends` で継承 | 未実装（課題） |
| keyword: `eslintconfig` | keyword: `claude-config`（未標準） |

### 評価

DRE-toolkit の方向性は正しい。「npm でパッケージ化する」発想自体がまだ世界でほぼやられていないため先行者優位がある。

## awesome-* との比較（2026年4月）

awesome-claude-skills / awesome-claude-code / awesome-agent-skills などのキュレーションコレクションとの対比。

### 前提の違い

|  | DGE + DRE | awesome-* |
|---|---|---|
| 目的 | 自分たちのプロジェクトで使い続ける | 世界中の人が検索・発見して拾う |
| 単位 | システム（会話→spec→rules→実装が一連） | 単品スキル・単品CLAUDE.md |
| 配布 | npm パッケージ | GitHub repo + コピー |
| バージョン | あり | なし |
| 更新 | install/update スクリプト | 手動 |

### awesome 側の良い点

1. **発見性** — keyword タグ、README カタログで「こんなスキルあったのか」と気づける
2. **クロスツール** — awesome-agent-skills は Claude/Codex/Gemini/Cursor に同時対応
3. **コミュニティの多様性** — 自分では思いつかないユースケースが入ってくる
4. **気軽さ** — 単品で試せる。システム全体を入れなくていい

### awesome 側の悪い点

1. **スキル同士が無関係** — 寄せ集めで一貫性がない。rules と skills が噛み合っているか誰も保証しない
2. **更新されない** — 作者が放置したら終わり。Claude Code の仕様変化に追従しない
3. **システムとして機能しない** — 会話→spec→rules→実装の一連フローは存在しない

### こちらの良い点

- **DGE → DRE のパイプライン** — 会話でgapを出し、specを作り、rulesとして積む。ワークフローが閉じている
- **コンテキストが積み上がる** — sessions/、design-materials/ に設計の経緯が残り「なぜこのruleがあるか」が分かる
- **バージョン管理** — どのプロジェクトがどのrulesetで動いているか追跡できる

### こちらの悪い点

- **発見性ゼロ** — 外から検索できない
- **クロスツール非対応** — Cursor や Codex に同じ rules を渡せない
- **カタログがない** — 自分たちの skills/rules 一覧を俯瞰する場所がない

### awesome から取り込む価値があるもの（優先度順）

1. **クロスツール出力** — `dre-tool export --cursor` で `.cursor/rules/` 生成、`--codex` で `AGENTS.md` 生成。DRE の rules を正典にして他ツールへ変換する
2. **スキルカタログ** — `kit/skills/catalog.md` に skills の一覧と用途を書く。awesome のインデックスを内側に持つ
3. **npm keyword `claude-config`** — `package.json` に keyword を入れるだけで発見性が生まれる。今なら先取りできる

## 強み（まとめ）

- **再現性** — 新プロジェクトへの展開が `npx dre-install` 一発
- **バージョン管理** — どのルールセットで動いているか追跡できる
- **DGE との分離** — 方法論（DGE）と運用ルール（DRE）が別パッケージ、選んで組み合わせられる
- **ワークフローの一貫性** — 会話→spec→rules→実装が一連で閉じている

## 課題・TODO

### 優先度高
- **extends 的な継承機構** — プロジェクト固有のカスタマイズをベース設定から継承する仕組みがない。update 時の上書き問題の根本原因
- **install 先の標準化** — `~/.claude/`（グローバル）vs `.claude/`（プロジェクト）どちらに置くかの設計

### 優先度中
- **クロスツール出力** — Cursor rules、AGENTS.md（Codex）への変換
- **スキルカタログ** — `kit/skills/catalog.md` の整備
- **keyword 規約** — npm に `claude-config` という keyword を先取りする
- **update 戦略** — `dre-update` 実行時のマージ・上書きルール
