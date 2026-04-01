# DRE-toolkit 初期設計 ハンドオフ

DGE セッションに渡すための設計文脈まとめ。

## これは何か

Claude Code をうまく使うための仕組み（rules / skills / agents / commands / profiles）を npm パッケージとして配布・管理するツールキット。

DGE-toolkit（設計の穴を会話劇で抽出）、DDE-toolkit（ドキュメントの穴をLLM+CLIで補完）と並ぶ D*E シリーズの3番目。AskOS はこのツールキットを利用するアプリケーションのひとつ。

## 現在の構造

```
DRE-toolkit/
├── kit/               # npm パッケージ (@unlaxer/dre-toolkit)
│   ├── rules/
│   ├── skills/
│   ├── agents/
│   ├── commands/
│   ├── profiles/
│   └── templates/
├── dre/               # 作業コピー（開発中の最新版）
│   ├── rules/
│   ├── skills/
│   ├── agents/
│   ├── commands/
│   └── profiles/
├── design-materials/
│   ├── intake/        ← ここ
│   └── dre-sessions/
├── docs/
├── paper/
└── server/
```

## 世界との比較で分かっていること

- Claude Code 設定の npm パッケージ化は世界でまだほぼやられていない
- 最も近いアナロジーは ESLint shareable config パターン
- awesome-claude-skills 系は単品スキルの寄せ集めで、システムとして機能しない
- DRE の強みは DGE→DRE パイプライン（会話→spec→rules→実装）が一連で閉じていること
- awesome 側から取り込む価値があるもの：クロスツール出力、スキルカタログ、npm keyword

## 未解決の設計課題（DGEで掘り下げたいもの）

### 1. extends / 継承機構
- プロジェクト固有のカスタマイズをベース設定からどう継承させるか
- update 時に上書きしてはいけないファイルをどう識別するか
- ESLint の `extends` に相当する仕組みをどう設計するか

### 2. install 先の戦略
- `~/.claude/`（グローバル）vs `.claude/`（プロジェクト）どちらに置くか
- 両方サポートするか、どちらかに絞るか
- プロジェクトをまたいで共有すべき rules とプロジェクト固有の rules の分け方

### 3. クロスツール出力
- DRE の rules を正典にして Cursor / Codex / Gemini CLI に変換する
- 変換フォーマットの差異（.cursor/rules/ vs AGENTS.md vs GEMINI.md）をどう吸収するか
- 正典が更新されたとき各ツールへの再変換をどうトリガーするか

### 4. update 戦略
- `dre-update` 実行時、カスタマイズ済みファイルをどう扱うか
- セマンティックバージョニングで「破壊的変更」をどう定義するか
- マージ戦略：上書き / スキップ / diff表示 / ユーザー選択

### 5. kit の中身の設計
- rules / skills / agents / commands / profiles それぞれに何が入るべきか
- AskOS の `.claude/` から汎用化できるものとAskOS固有のものをどう分離するか
- サンプル・テンプレートの粒度

## DxE-suite との関係

```
DxE-suite (@unlaxer/dxe-suite)
  └─ npx dxe install
       ├─ DGE-toolkit  設計の穴を抽出
       ├─ DDE-toolkit  ドキュメントの穴を補完
       └─ DRE-toolkit  rules/skills/agents を展開  ← ここ
```

## DGE セッションで使うなら

フロー候補：
- `design-review` — 設計全体の穴を探す（extends機構、install先戦略）
- `tribunal` — update戦略・クロスツール出力の決定に対して批判的検証
- `investigation` — AskOS固有 vs 汎用の分離基準を掘り下げる
