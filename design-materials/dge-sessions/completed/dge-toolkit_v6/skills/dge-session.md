# Skill: DGE Session 実行

## Trigger
ユーザーが以下のいずれかを言ったとき:
- 「DGE して」
- 「会話劇で見直して」
- 「gap を探して」
- 「壁打ちして」
- 「ブレストして」

## 手順

### Step 1: DGE Kit を読む
dge/ フォルダの以下を読む:
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

### Step 7: Action Items を提示
「以下の Gap が見つかりました。どうしますか？」
- [実装する] → Task に変換
- [後で] → Backlog に追加
- [不要] → 記録だけして閉じる

## 注意
- 1 Scene は 3-5 キャラの発言で構成
- 1 Session は 3-5 Scene
- 合計 15-30 分が目安
- 会話劇の後、必ずユーザーにレビューしてもらう
  (会話劇 → レビュー の往復が本質)
