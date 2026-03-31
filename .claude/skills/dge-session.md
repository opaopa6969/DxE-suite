<!-- DGE-toolkit (MIT License) -->

# Skill: DGE Session

## Trigger
「DGE して」「壁打ち」「gap を探して」「ブレスト」「アイデア出して」「実装できるまで回して」

## MUST（3 個。これだけ守れ）
1. **会話劇は無条件で保存。** ユーザーに聞かない。
2. **一覧（Gap / アイデア）を出力。**
3. **一覧の後に番号付き選択肢を提示。省略するな。** 「どの Gap から修正？」とは聞くな。

## 手順

### Step 0: flow 判定
まず `dge/flows/` の YAML、なければ `kit/flows/` の YAML を読んで flow を決定。
- 「DGE して」のみ → ⚡ quick
- テンプレ/パターン/「詳しく」/「Spec」→ 🔍 design-review
- 「ブレスト」/「アイデア」→ 💡 brainstorm
- YAML がなければ quick 相当で動く。

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

## 注意
- 1 Scene 3-5 発言、1 Session 3-5 Scene
- DGE Spec と既存 docs が矛盾 → 既存 docs が正
