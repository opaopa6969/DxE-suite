# DGE Session: fork 可能性とカスタマイズ設計

- **日付**: 2026-03-30
- **テーマ**: DGE toolkit の fork vs プラグイン設計。チューニングに足る設計になっているか
- **キャラクター**: 今泉 + ヤン + 千石 + ラインハルト + ハウス
- **テンプレート**: feature-planning.md

---

## カスタマイズ 3 層

| Layer | 方法 | fork 不要? |
|---|---|---|
| 1. YAML | フロー定義、キャラ、パターン、テンプレート追加 | ✅ |
| 2. skill 差替 | .claude/skills/ の直接編集（soft fork） | △ |
| 3. コード変更 | server の API/DB 変更（hard fork） | ❌ |

## カスタマイズ対応表

| やりたいこと | 対応 | 必要な追加 |
|---|---|---|
| 別フロー（夢小説等） | YAML | flows/ YAML（今実装中） |
| 別キャラ | YAML | 済み（custom/characters/） |
| 別パターン | YAML | 済み |
| 別テンプレート | ファイル追加 | 済み |
| 別 MUST ルール | soft fork → v2 で YAML 化 | backlog |
| 別成果物テンプレ | soft fork → v2 で YAML 化 | backlog |
| 別会話劇構造 | hard fork | 将来 |
| API 変更 | hard fork | — |

## Gap

| # | Gap | Severity |
|---|-----|----------|
| 122 | カスタマイズ可能/不可能の境界が不明確 | **High** |
| 123 | dge-update でカスタム skill が上書きされる | **High** |
| 124 | カスタム skill 優先順位の仕組みがない | Medium |

## 対応
- update.sh にハッシュチェック追加（v1）
- README にカスタマイズレベルのセクション追加
- フロー YAML に MUST ルール（v2）
