# DGE Session: カスタマイズ戦略 — 共存を捨てて fork + ガイドに振り切る

- **日付**: 2026-03-30
- **テーマ**: 共存 vs 完全カスタマイズ。fork 可能な設計と CUSTOMIZING.md の提供
- **キャラクター**: 今泉 + ヤン + 千石 + ラインハルト + ハウス

---

## 決定

共存メカニズム（ハッシュチェック、custom/ 優先順位）は提供しない。

### カスタマイズ 2 択
- **A. そのまま使う**: npm install + YAML 追加（フロー、キャラ、テンプレート）
- **B. 全面カスタマイズ**: git fork + CUSTOMIZING.md に従い変更

### Level 1（fork 不要）
フロー YAML 追加 / カスタムキャラ追加 / テンプレート追加 / パターン選択

### Level 2（fork 推奨）
skill の MUST ルール / 選択肢 / 抽出マーカー / Spec 生成ロジック

### Level 3（fork 推奨）
API サーバーのエンドポイント / 推奨アルゴリズム / DB スキーマ

## 成果物
- kit/CUSTOMIZING.md（カスタマイズガイド）
- update.sh のハッシュチェックは不要
- custom/skills/ は不要

## 削減
- ハッシュチェック機能（計画から削除）
- custom/skills/ ディレクトリ（不要）
- skill 内のカスタム skill 読み込みロジック（不要）
