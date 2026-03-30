# DGE Session: フローカスタマイズ — DGE エンジンの汎用化

- **日付**: 2026-03-30
- **テーマ**: DGE エンジンのフローカスタマイズ — 設計レビュー以外のユースケースへの適用
- **キャラクター**: 今泉 + ヤン + 千石 + ラインハルト + ハウス
- **テンプレート**: feature-planning.md
- **パターン**: comprehensive

---

## コア発見

DGE のエンジン（キャラクター × 対話 × 構造化出力）は汎用。カスタマイズポイントは 2 つ:
- **Step 6（抽出）**: 対話から何を抽出するか
- **Step 10（生成）**: 抽出結果から何を生成するか

## ユースケース × フロー

| ユースケース | 抽出 | 生成 |
|---|---|---|
| 設計レビュー（現行） | Gap (Observe/Suggest/Act) | UC, TECH, ADR, DQ, ACT |
| 創作 | Plot element (Setting/Conflict/Resolution) | Scene, Character profile, Plot outline |
| 意思決定 | Argument (Claim/Evidence/Counter) | ADR, Pros-Cons, Risk matrix |
| 教育 | Understanding gap | Teaching material |
| 論文査読 | Weakness | Paper revision |

## フロー定義 YAML

```yaml
name: [フロー名]
description: [説明]

extract:
  type: [gap | plot_element | argument | custom]
  marker: "→ [マーカー]:"
  format: [フォーマット説明]
  severity: [levels] | null
  categories: [list]

generate:
  types: [成果物種類]
  output_dir: [出力先]

post_actions:
  - [選択肢]
```

## 段階的実装

- v1: フレームワーク + design-review.yaml（ユーザーから見た変化ゼロ、backward compatible）
- v2: fiction.yaml + decision.yaml + フロー選択 UI
- v3: カスタムフロー wizard

## Gap 一覧

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 112 | 汎用/専用が分離されていない | Missing logic | **Critical** |
| 113 | エンジン/アプリケーション未分離 | Missing logic | **Critical** |
| 114 | カスタマイズポイント（Step 6 + 10） | Missing logic | **High** |
| 115 | フロー定義ファイルの仕組みがない | Missing logic | **High** |
| 116 | 抽出マーカーがフロー依存 | Spec-impl mismatch | **High** |
| 117 | フロー定義の配置と読み込み | Missing logic | Medium |
| 118 | v1 スコープ | Spec-impl mismatch | Medium |
