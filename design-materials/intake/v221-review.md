# DGE Session: v2.2.1 改善のレビュー

- **日付**: 2026-03-31
- **テーマ**: v2.2.1 の改善（lazy loading, auto-merge, YAML）の穴探し
- **キャラクター**: ソクラテス + ハウス + Red Team
- **Flow**: quick

## Gap

| # | Gap | Severity |
|---|-----|----------|
| 141 | lazy loading は catalog.md 全文読みで無効 | **High** |
| 142 | built-in キャラを個別ファイル分割すべき | **High** |
| 143 | built-in と custom の構造不統一 | Medium |
| 144 | 大リポジトリでの worktree コスト | Medium |
| 145 | auto-merge 失敗時フォールバック未定義 | **High** |
| 146 | YAML must_rules はドキュメント。コード強制なし | Medium |

## 主要な発見
- catalog.md 1 ファイル方式では lazy loading は嘘。キャラ個別ファイル分割が必要
- auto-merge の失敗ハンドリングがない
- YAML はコード強制ではなく LLM へのヒント。正直に書くべき
