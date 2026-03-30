# DGE Session: flow YAML テンプレート化 + skill 統一

- **日付**: 2026-03-31
- **テーマ**: quick / design-review / brainstorm の分離、MUST 最適化、skill 統一
- **キャラクター**: 今泉 + ヤン + 千石 + ハウス + 僕
- **パターン**: feature-extension

---

## 3 つの flow

| flow | Steps | MUST | 用途 |
|------|-------|------|------|
| quick | 5 | 3 | デフォルト。即会話劇 |
| design-review | 10 | 7 | テンプレ+パターン+Spec |
| brainstorm | 6 | 4 | Yes-and、アイデア抽出 |

## flow 自動判定
- "DGE して" のみ → quick
- テンプレ/パターン/キャラ言及 → design-review
- "ブレスト" "アイデア" → brainstorm
- "詳しく" "本格的に" → design-review

## 共通 MUST（3 個）
1. 会話劇は保存（無条件）
2. 一覧を出力
3. 番号付き選択肢を提示

## skill 統一
- kit/skills/dge-session.md に統一
- skills/dge-session.md 削除
- 出力先は flow YAML の output_dir

## Gap
| # | Gap | Severity |
|---|-----|----------|
| 129 | flow 選択がユーザー負担。自動判定必要 | High |
| 130 | 入力から quick/full 判定ロジック | High |
| 131 | quick のキャラ確認レベル | Medium |
| 132 | 自己 install 手順 | Medium |
