---
status: implemented
source_session: design-materials/intake/flow-template-design.md
source_gap: "#129-133"
---

<!-- DGE 生成: 実装前に人間がレビューしてください。 -->

# TECH-flow-templates: flow YAML テンプレート化 + skill 統一

## 成果物

1. kit/flows/quick.yaml — 最小フロー（MUST 3 個、Step 5 個）
2. kit/flows/brainstorm.yaml — ブレスト用
3. kit/flows/design-review.yaml — 更新（post_actions に merge_plain 追加）
4. dge/flows/design-review-dev.yaml — DGE-toolkit リポジトリ用（output: intake/、レビューOK あり）
5. kit/skills/dge-session.md — flow 自動判定 + YAML 読み込みを Step 1 に追加
6. skills/dge-session.md — 削除

## flow 自動判定ルール

```
"DGE して" のみ → quick
テンプレ/パターン名言及 → design-review
"ブレスト" "アイデア" "brainstorm" → brainstorm
"詳しく" "本格的に" "full" → design-review
キャラ名のみ言及 → quick + キャラ変更
設計ドキュメント添付 → design-review
```

## 共通 MUST（3 個）
1. 会話劇は保存（無条件）
2. 一覧（Gap/アイデア）を出力
3. 一覧の後に番号付き選択肢を提示（省略しない）

## Acceptance Criteria
- [ ] "DGE して" で quick が自動選択される
- [ ] quick: テーマ確認 → キャラ表示（確認なし）→ 即会話劇
- [ ] design-review: テンプレ → パターン → キャラ確認 → 会話劇 → Spec
- [ ] brainstorm: テーマ → キャラ確認 → 会話劇（Yes-and）→ アイデア一覧
- [ ] flows/ YAML がなくても現行動作（backward compatible）
- [ ] skills/dge-session.md が削除されている
- [ ] DGE-toolkit リポジトリで npx dge-install → .claude/skills/ に統一 skill
