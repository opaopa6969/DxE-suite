<!-- DGE-toolkit (MIT License) -->

# Skill: DGE Session 実行

## Trigger
- 「DGE して」「会話劇で見直して」「gap を探して」「壁打ちして」「ブレストして」
- 「実装できるまで回して」（→ 自動反復モード）

## 共通 MUST ルール（全 flow で必ず守る。3 個のみ）
1. **会話劇は保存（無条件）。** ユーザーに聞かず保存する。
2. **一覧（Gap/アイデア）を出力する。**
3. **一覧の後に番号付き選択肢を提示する。省略しない。** Gap の修正や実装に直接進まない。「どの Gap から修正しますか？」とは聞かない。

追加の MUST は flow YAML に定義されている。flow YAML がなければ上記 3 個のみ。

## 手順

### Step 0: flow 自動判定

ユーザーの入力から flow を判定する:

```
"DGE して" のみ / 短い指示 → ⚡ quick
テンプレート名言及 / "詳しく" / "本格的に" / "Spec" → 🔍 design-review
"ブレスト" / "アイデア" / "brainstorm" → 💡 brainstorm
キャラ名のみ言及 → quick + キャラ変更
設計ドキュメント添付・参照あり → design-review
```

判定した flow を 1 行表示: `Flow: ⚡ クイック`
`dge/flows/{flow}.yaml` があれば読み込む。なければ下記のデフォルト動作。

### Step 1: Kit 読み込み（全 flow 共通）
1. `dge/method.md` を読む（なければ install 案内）
2. `dge/characters/catalog.md` を読む
3. `dge/custom/characters/*.md` があれば Prompt Core を読む
4. `dge/patterns.md` を読む
5. `dge/version.txt` があれば 1 行表示

### Step 2: テーマ確認（全 flow 共通）
明確なら次へ。不明確なら掘り下げる。

### Step 3: テンプレート選択（design-review のみ）
`dge/templates/` から選択。quick / brainstorm ではスキップ。

### Step 3.5: パターン選択（design-review のみ）
プリセットを推奨。quick / brainstorm ではスキップ（自動選択）。

### Step 4: キャラクター提案
- **quick**: 推奨セットを 1 行表示。確認は求めない。変更したければユーザーが指示。
  `キャラ: 今泉 + 千石 + 僕（変更したい場合は指示してください）`
- **design-review / brainstorm**: 推奨セットを提示し確認を待つ。

built-in + カスタムキャラを統合表示。

### Step 5: 会話劇生成（全 flow 共通）
- flow の extract.marker を使う（デフォルト: `→ Gap 発見:`、brainstorm: `→ アイデア:`）
- 先輩（ナレーション）で背景設定 → キャラ対話 → マーカー挿入

### Step 6: 構造化（flow による）
- quick / design-review: Gap に Category + Severity を付与
- brainstorm: アイデアに分類を付与（severity なし）

### Step 7: 保存（全 flow 共通、MUST）
flow の output_dir に保存（デフォルト: `dge/sessions/`）。
プロジェクトファイルがあれば更新。

### Step 8: サマリー + 選択肢（全 flow 共通、MUST）

```
## DGE 結果サマリー

**Flow**: [flow 名]
**テーマ**: [テーマ]
**Gap/アイデア数**: N 件

| # | Gap/Idea | Severity |
|---|---------|----------|
（主要なものを表示）

**全文**: `[ファイルパス]`
```

選択肢は flow YAML の post_actions から表示。YAML がない場合のデフォルト:
```
1. DGE を回す
2. 実装できるまで回す
3. 実装する
4. 素の LLM でも回してマージ
5. 後で
```

**ユーザーの応答を待つ。**

### Step 9: ユーザーの判断に従う

flow YAML の post_actions の id に応じて分岐:

| id | アクション |
|----|-----------|
| dge_again | Step 9B（前回コンテキスト + TreeView） |
| auto_iterate | Step 9A（自動反復） |
| implement | Step 10（累積 Spec 化） |
| merge_plain | Step 9C（subagent で素の LLM マージ） |
| switch_full | flow を design-review に切替えて Step 3 から |
| switch_review | flow を design-review に切替え |
| review_ok | output_dir の該当ファイルを completed/ に移動 |
| later | 終了 |

### Step 9A: 自動反復モード
パターン自動ローテーション → 生成 → 保存 → 収束判定。
上限 5 回。+3 追加可能（hard limit 8）。収束で Step 10 へ。
自動反復中: 画面はサマリーのみ、ファイル保存は MUST。

### Step 9B: 前回コンテキスト + プロジェクトナビゲーション
プロジェクトファイルがあれば TreeView 表示。なければ前回サマリー + 3 択。

### Step 9C: 素の LLM マージ
subagent で同じテーマを素でレビュー → DGE Gap とマージ → DGE のみ / 素のみ / 両方 をラベル付け。

### Step 10: 累積 Spec 化（design-review のみ）
同テーマの全 session Gap を統合 → Critical/High を Spec 化 → `dge/specs/` に保存。
Spec レビュー: OK → reviewed に更新 / 修正 / 後で。

## Severity 判断基準

| Severity | 基準 |
|----------|------|
| Critical | 機能が実装不能 / データ損失リスク |
| High | 主要ユースケースに影響 / セキュリティリスク |
| Medium | 品質・UX に影響するが回避策あり |
| Low | 改善レベル / nice-to-have |

## 注意
- 1 Scene 3-5 キャラ発言、1 Session 3-5 Scene
- 会話劇 → 人間レビュー の往復が本質
- DGE Spec と既存 docs が矛盾する場合、既存 docs が Source of Truth
- flow YAML がなくても動く（backward compatible）。その場合は quick 相当
