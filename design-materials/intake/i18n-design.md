# DGE Session: i18n 設計

- **日付**: 2026-03-31
- **キャラ**: 今泉 + ヤン + ソクラテス

## 決定
- 1 パッケージで ja/en 共存
- 日本語キャラは現位置維持（breaking change なし）
- 英語キャラは characters/en/ に追加
- locale 判定: 入力言語 or flow YAML

## Gap
| # | Gap | Severity |
|---|-----|----------|
| 150 | キャラの文化的認知が本質 | High |
| 151 | locale は session ごと | Medium |
| 152 | リポジトリ分離は管理 2 倍 | Medium |
