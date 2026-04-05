# DGE Session: カスタムキャラクター深層情報フォーマット（自動反復）

- **日付**: 2026-03-30
- **テーマ**: キャラクターの名言・トラウマ・成長弧の抽出と保存フォーマット
- **キャラクター**: 今泉 + ヤン + 千石 + 僕
- **テンプレート**: feature-planning.md
- **パターン**: expertise-contrast + before-after（自動反復 2 iterations）

---

## 確定: キャラクター 3 層構造

| 層 | 内容 | 読むタイミング |
|---|---|---|
| axes（フロントマター） | 数値ベクトル + enum | 常に |
| Prompt Core | LLM 基本指示 3-5 行 | 常に（選択キャラ） |
| Personality | 価値観、名言、コミュニケーション、判断基準 | デフォルト（選択キャラ） |
| Backstory | 背景、成長弧、トラウマ、DGE での効果 | オプション（深い議論時） |
| Weakness | 弱点 | デフォルト |
| Similar Characters | 類似キャラとの比較 | デフォルト |

## Gap 一覧

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| 105 | axes だけでは動機・背景が出ない | **High** | 解決: 3 層構造 |
| 106 | 3 層の構造化 | **High** | 解決: axes / personality / backstory |
| 107 | 選択的読み込み | **High** | 解決: Core 常時 + Personality 選択時 + Backstory オプション |
