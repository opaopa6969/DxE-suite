# DDE Design — DGE + LLM マージ結果
- **Date**: 2026-04-01

## DGE と LLM で一致した点

| 項目 | 判定 |
|------|------|
| MVP は Auto-Linker + Term Extraction の 2 機能 | 合意 |
| Auto-Linker は LLM 不要、純コード | 合意 |
| Markdown AST パーサー（unified + remark）を使う | 合意 |
| dictionary.yaml でファイル名 → 用語マッピング | 合意 |
| --dry-run / --check / --fix の 3 モード | 合意 |
| 3 reader levels は v0.1.0 では過剰 | 合意 |
| 図提案、ギャップ検出、多言語同期は v0.2.0 | 合意 |

## LLM が追加した重要指摘

| # | 指摘 | 対応 |
|---|------|------|
| 1 | Term Extraction の過剰抽出防止が必要 | 人間の承認/却下レビューフローを入れる |
| 2 | en/ja ドリフトの粒度定義（ファイル存在 vs リンク数 vs 意味的差異） | 純コード（存在+リンク数）+ LLM（意味的）に分離 |
| 3 | LLM コスト対策 — インクリメンタルスキャン（git diff ベース） | v0.2.0 で対応 |
| 4 | 既存手動記事との文体整合性（スタイルミラーリング） | テンプレートで 4 セクション構造を強制 |
| 5 | DGE との共有インフラ — インストーラ、locale 判定は共有、キャラシステムは不要 | コピーベースで共有 |

## 確定した v0.1.0 MVP

```
Module A: dde-link（CLI、LLM 不要）
  - docs/glossary/ からファイル名→用語を自動推定
  - dictionary.yaml で上書き（日本語対応）
  - 最長一致、段落ごと、AST ベース
  - --fix / --check / --dry-run
  → volta-auth-proxy で dogfood

Module B: dde-session（Claude Code skill、LLM 必要）
  - 用語抽出（人間が承認/却下）
  - 記事生成（テンプレートで文体統一）
  - dde-link 呼び出し
```

## 確定した v0.2.0+

```
- 図の自動提案（ヒューリスティック + LLM）
- 読者ギャップ検出
- 多言語同期（存在チェック→純コード、意味的→LLM）
- git diff ベースのインクリメンタルスキャン
- CI GitHub Action
```
