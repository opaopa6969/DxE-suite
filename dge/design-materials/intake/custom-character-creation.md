# DGE Session: カスタムキャラクター作成機能

- **日付**: 2026-03-30
- **テーマ**: 有名キャラ名指し追加 + wizard 式オリジナルキャラ作成、永続保存
- **キャラクター**: 今泉 + ヤン + 千石 + 僕
- **テンプレート**: feature-planning.md
- **パターン**: feature-extension

---

## 実装仕様

### trigger
- 「キャラを追加して」「ガッツを追加して」「オリジナルキャラを作りたい」

### 名指しモード
```
ユーザー: 「ベルセルクのガッツを追加して」
1. LLM がキャラ分析 → axes 推定 + prompt 生成
2. 類似キャラとの比較を表示
3. 確認: OK / 自然言語で調整 / 数値直指定 / やり直し
4. OK → dge/custom/characters/{name}.md に保存
```

### wizard モード
```
ユーザー: 「オリジナルキャラを作りたい」
1. 最低 3 問: 名前、活躍場面、性格の核
2. オプション追加: 口癖、怒り方、苦手なこと等
3. "もう十分" → 生成
4. 確認: OK / もっと質問 / 調整 / やり直し
5. OK → dge/custom/characters/{name}.md に保存
```

### 保存フォーマット
```markdown
---
name: ガッツ
source: ベルセルク
archetype: relentless_survivor
icon: ⚔
axes:
  decision_speed: 0.85
  risk_tolerance: 0.95
  delegation_level: 0.10
  quality_obsession: 0.40
  simplicity_preference: 0.70
created: 2026-03-30
---

# ⚔ ガッツ（ベルセルク）

## Prompt
[prompt_core]

## 特殊能力
- ...

## 弱点
- ...

## 類似キャラ
[既存キャラとの比較]
```

### skill 変更
- Step 1: catalog.md + dge/custom/characters/*.md を読む
- Step 4: built-in + カスタムキャラを統合表示
- 新規 trigger: 「キャラを追加して」で名指し or wizard を選択

### サーバー連携（オプション）
サーバーがあれば POST /api/characters にも同期。なくてもファイルだけで完結。

---

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 99 | カスタムキャラの保存先 | Missing logic | **High** |
| 100 | LLM 理解の確認フロー | Error quality | **High** |
| 101 | axes 調整 UI（数値 vs 自然言語） | Message gap | Medium |
| 102 | wizard 質問数（最低 3 + オプション） | Spec-impl mismatch | Medium |
| 103 | カスタムキャラ増加時のパフォーマンス | Missing logic | Medium |
| 104 | カスタムキャラ削除フロー | Missing logic | Low |
