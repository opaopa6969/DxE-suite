<!-- DGE-toolkit (MIT License) -->

# Skill: DGE Session

## Trigger
「DGE して」「壁打ち」「gap を探して」「ブレスト」「アイデア出して」「実装できるまで回して」

## MUST（3 個。これだけ守れ）
1. **会話劇は無条件で保存。** ユーザーに聞かない。
2. **一覧（Gap / アイデア）を出力。**
3. **一覧の後に番号付き選択肢を提示。省略するな。** 「どの Gap から修正？」とは聞くな。

## 手順

### Step 0: flow + 構造 判定
まず `dge/flows/` の YAML、なければ `kit/flows/` の YAML を読んで flow と structure を決定。

**flow 判定:**
- 「DGE して」のみ → ⚡ quick
- テンプレ/パターン/「詳しく」/「Spec」→ 🔍 design-review
- 「ブレスト」/「アイデア」→ 💡 brainstorm
- YAML がなければ quick 相当で動く。

**構造 自動選択（テーマのキーワードから）:**
- 「査読」「論文」「レビュー」→ ⚖ tribunal（査読劇）
- 「攻撃」「セキュリティ」「ペネトレ」→ ⚔ wargame（兵棋演習）
- 「ピッチ」「投資」「Go/No-Go」「事業」→ 💰 pitch（VC ピッチ）
- 「診断」「各科」「専門家」→ 🏥 consult（症例検討）
- 「障害」「インシデント」「振り返り」「postmortem」→ 🔥 investigation（事故調査）
- 上記に該当しない → 🗣 roundtable（座談会 = 現行の通常 DGE）

**ユーザーへの通知（必須）:**
構造を自動選択したら、セッション冒頭で以下のように通知する:
```
構造: ⚔ 兵棋演習（セキュリティのテーマから自動選択）
  Phase 1: Red Team が攻撃計画を作成
  Phase 2: Blue Team が防御計画で応答
  Phase 3: 未対処の攻撃を Gap として抽出
変更しますか？（座談会型に切替も可）
```
構造の説明を 3 行で示し、ユーザーが変更できるようにする。

### Step 0.5: Phase 0 — プロジェクトコンテキスト収集
テーマが明確になったら（または「DGE して」だけの場合も）、以下を自動で読み込む:
- `README.md`（プロジェクト概要）
- `docs/` 配下の設計ドキュメント（あれば）
- ディレクトリ構造（`tree -L 2` 相当）
- `package.json` / `go.mod` / `Cargo.toml` 等（依存関係）
- 直近の `git log --oneline -10`（最近のコンテキスト）
**目的**: キャラが推測ではなくプロジェクトの事実に基づいて議論するための土壌を作る。
入力が薄い場合は「設計ドキュメントが見つかりません。テーマを詳しく教えてください」と掘り下げる。

### Step 1: 読み込み
- **locale 判定**: 日本語入力 → ja、英語入力 → en。flow YAML に `locale` 指定あればそれ
- built-in 一覧（名前 + 推奨のみ）: ja は `dge/characters/index.md` を優先、なければ `kit/characters/index.md`。en は `dge/characters/index.en.md` を優先、なければ `kit/characters/index.en.md`
- パターン: `dge/patterns.md` を優先。なければ ja は `kit/patterns.md`、en は `kit/patterns.en.md`
- method: `dge/method.md` を優先。なければ ja は `kit/method.md`、en は `kit/method.en.md`
- `dge/custom/characters/*.md` があれば各ファイルの Prompt Core セクションだけ読む
- flow YAML の must_rules, auto_merge を確認
- `node dge/bin/dge-tool.js version`、なければ `node kit/bin/dge-tool.js version`、または `npx dge-tool version` で tool mode 検出（失敗しても続行）

### Step 2: テーマ確認
明確なら次へ。曖昧なら掘り下げ。

### Step 3: テンプレート + パターン（design-review のみ）
quick / brainstorm ではスキップ。

### Step 4: キャラ選択
推奨セット + Step 1 で読んだ custom キャラを提示。quick は表示のみ。design-review / brainstorm は確認待ち。
**確定後、選択キャラの個別ファイルを読む。** built-in は ja/en とも `dge/characters/{name}.md` を優先（`dge/` がなければ ja → `kit/characters/{name}.md`、en → `kit/characters/en/{name}.md`）。custom は `dge/custom/characters/{name}.md`

### Step 5: 会話劇生成
先輩ナレーション → キャラ対話 → `→ Gap 発見:` or `→ アイデア:` マーカー。
**応答義務**: キャラ A が指摘した内容に対して、別のキャラ B は賛成・反対・保留のいずれかを必ず表明する。指摘しっぱなしの片道切符を禁止。応答の衝突から深い Gap が生まれる。
**評価軸**: 各キャラの `axis:` に基づいて指摘する。人格だけでなく判断基準を使うこと。
auto_merge true なら、同時に isolated subagent（Agent ツール, isolation: worktree）で素の LLM レビューをバックグラウンド起動。

### Step 6: 構造化
Gap に Category + Severity。brainstorm はアイデア分類。

### Step 7: 保存
flow の output_dir に保存。dge-tool save があれば使う（なければ Write ツール）。

### Step 8: サマリー + 選択肢
Gap/アイデア一覧を表示。auto-merge 結果があれば DGE のみ / 素のみ / 両方 でマージ表示。
subagent 失敗時は DGE のみ表示（「素の LLM 取得失敗」と 1 行）。
**選択肢は flow YAML の post_actions から。** dge-tool prompt があれば使う。

### Step 9: 分岐
選択に従う:
- **DGE を回す** → 前回サマリー + TreeView（プロジェクトあれば）表示して Step 2 へ
- **自動反復** → パターンローテーション、上限 5 回、C/H Gap 0 で収束 → Step 10
- **実装する** → Step 10
- **マージ** → auto_merge OFF 時のみ。isolated subagent 起動
- **後で** → 終了

### Step 10: Spec 化（design-review のみ）
同テーマ全 session の C/H Gap を統合 → UC/TECH/ADR/DQ/ACT を `dge/specs/` に生成。

## 初回オンボーディング
ユーザーが「DGE」「DGE って何」等、テーマなしで DGE を呼んだ場合、以下を表示する:

```
DGE toolkit v3.0.0 — Dialogue-driven Gap Extraction

キャラクターが議論する会話劇で、設計の「書いてないこと」を発見します。

📋 6 つのセッション構造:
  🗣 座談会     「DGE して」— キャラが自由に議論（デフォルト）
  ⚖ 査読劇     「査読して」— 独立評価 → 反論対話 → 統合
  ⚔ 兵棋演習   「攻撃して」— 攻撃計画 → 防御計画 → 審判
  💰 VC ピッチ  「ピッチして」— ピッチ → 質疑 → 投資判断
  🏥 症例検討   「診断して」— 主治医所見 → 各科コンサル → 統合
  🔥 事故調査   「振り返って」— 事実認定 → 各部門証言 → 原因分析

🎭 19 人のキャラクター（各キャラに評価軸あり）
⚡ 3 つのモード: Quick / Design Review / Brainstorm
🔄 自動反復: 「実装できるまで回して」

使い方:
  「認証 API を DGE して」→ テーマに合った構造を自動選択
  「認証 API を査読して」→ 査読劇構造で実行

詳しくは: `dge/method.md`（なければ `kit/method.md` / `kit/method.en.md`）, `dge/flows/*.yaml`（なければ `kit/flows/*.yaml`）
```

## 注意
- 1 Scene 3-5 発言、1 Session 3-5 Scene
- DGE Spec と既存 docs が矛盾 → 既存 docs が正
