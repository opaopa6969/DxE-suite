# Skill: DGE Session 実行（開発用 — DGE-toolkit リポジトリ内）

## Trigger
ユーザーが以下のいずれかを言ったとき:
- 「DGE して」
- 「会話劇で見直して」
- 「gap を探して」
- 「壁打ちして」
- 「ブレストして」

## MUST ルール（必ず守る）
1. **キャラクター選択はユーザーに提示して確認を得てから進む。** 確認なしで会話劇を生成しない。
2. **会話劇の全文を画面に表示し、同時に `design-materials/intake/` に markdown ファイルとして保存する。** 画面には全文を出す。保存はユーザーに聞かず無条件で行う。画面表示の直後にファイル保存する。intake/ にある限り、既存ドキュメントには一切触れない。
3. **会話劇の後、Gap 一覧テーブルを出力する。** テーブルの列は: `| # | Gap | Category | Severity |`
4. **サマリー表示後、ユーザーの次のアクション指示を待つ。** 勝手に次の session や実装を開始しない。
5. **サマリーの後に選択肢を提示する:** DGE を回す / 実装する / レビューOK / 後で

## SHOULD ルール（推奨）
1. テンプレート候補が 1 つなら自動選択し報告する。2 つ以上ならユーザーに提示する。
2. Gap 詳細は Observe / Suggest / Act の構造で書く。
3. 会話劇は 3-5 Scene で構成する。先輩（ナレーション）で各 Scene の背景を設定する。
4. サマリー表示時に全文ファイルへのパスを表示する。

## 判断ルール（auto-decide vs ask）

| Step | 条件 | アクション |
|------|------|-----------|
| テーマ確認 | ユーザーの指示が 1 文で明確 | そのまま進む |
| テーマ確認 | 質問形式 or 曖昧 | 掘り下げて聞く |
| テンプレート選択 | 候補が 1 つ | 自動選択して報告 |
| テンプレート選択 | 候補が 2 つ以上 | ユーザーに提示 |
| キャラクター選択 | 常に | ユーザーに確認（例外なし） |

## 手順

### Step 1: DGE Kit を読む
以下を読む:
- method.md (方法論 + 先輩ロール + 今泉メソッド + Observe→Suggest→Act)
- characters/catalog.md (12 キャラ一覧)

### Step 2: テーマを確認
ユーザーに「何をテーマにしますか？」と確認。
明確なら Step 3 へ。不明確なら掘り下げる。

### Step 3: テンプレートを選択
templates/ から最も近いテンプレートを選ぶ。
なければ method.md の Scene 構成ガイドに従って即席で作る。

### Step 4: キャラクターを提案
テーマに応じて catalog.md の推奨を提案:
「このテーマには 今泉 + 千石 + 僕 を推奨しますが、変更しますか？」
**ユーザーの応答を待つ。**

### Step 5: 会話劇を生成
各 Scene について:
1. 先輩（ナレーション）で技術的背景を設定
2. キャラクターのセリフを生成（prompt を参照）
3. セリフの直後に `→ Gap 発見:` を挿入
4. Scene 末尾に Gap リストをまとめる

「先輩」はキャラクターではなく narrator。
技術的背景を neutral に語り、キャラが議論に入る context を提供する。

### Step 6: Gap を Spec に落とす
各 Gap について:
```
Gap: [タイトル]
  Observe: [現状の問題]
  Suggest: [提案]
  UC:      UC-XXX-01: [Use Case]
  API:     METHOD /api/path { body } → { response }
  SQL:     CREATE TABLE ... / ALTER TABLE ...
```

### Step 7: intake/ に保存
session の全文を `design-materials/intake/` に markdown ファイルとして保存する。
- ファイル名: テーマを kebab-case にしたもの（例: `install-mechanism.md`）

### Step 8: サマリーを表示してユーザーの判断を待つ

```
## DGE 結果サマリー

**テーマ**: [テーマ]
**Gap 数**: N 件（Critical: X / High: X / Medium: X / Low: X）

| # | Gap | Severity |
|---|-----|----------|
（High 以上を表示、Medium 以下は件数のみ）

**全文**: `design-materials/intake/[filename].md`

どうしますか？
- **DGE を回す** → この結果をさらに深掘り
- **実装する** → Gap を Task に変換して実装開始
- **レビューOK** → intake/ から dge-sessions/completed/ に移動
- **後で** → intake/ に置いたまま終了
```

**ユーザーの応答を待つ。勝手に次のアクションに進まない。**

### Step 9: ユーザーの判断に従う

| ユーザーの判断 | アクション |
|---------------|-----------|
| DGE を回す | Step 2 に戻る（テーマ = 前回の Gap や提案） |
| 実装する | Gap を Task に変換し、実装を開始 |
| レビューOK | intake/ → dge-sessions/completed/ に移動 |
| 後で | 何もしない。intake/ に残す |

## 出力フォーマット仕様

### ファイルヘッダ（MUST）
```markdown
# DGE Session: [テーマ]

- **日付**: YYYY-MM-DD
- **テーマ**: [テーマの 1 行説明]
- **キャラクター**: [使用キャラクター]
- **テンプレート**: [使用テンプレート名] または "カスタム"
```

### Gap 一覧テーブル（MUST）
```markdown
| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 1 | [Gap の 1 行説明] | [Category] | High |
```

### Gap 詳細（SHOULD）
```markdown
### Gap-N: [タイトル]
- **Observe**: [現状の問題]
- **Suggest**: [提案]
- **Act**: [具体的な仕様: UC, API, Data Model 等]
```

## Severity 判断基準

| Severity | 基準 |
|----------|------|
| Critical | これがないと機能が実装不能 / データ損失リスク |
| High | 主要ユースケースに影響 / セキュリティリスク |
| Medium | 品質・UX に影響するが回避策あり |
| Low | 改善レベル / nice-to-have |

## 注意
- 1 Scene は 3-5 キャラの発言で構成
- 1 Session は 3-5 Scene
- 合計 15-30 分が目安
- 会話劇の後、必ずユーザーにレビューしてもらう（会話劇 → レビュー の往復が本質）
