---
name: dxe-run-dde
description: DDE でドキュメントの穴を補完し用語リンクを張る手順
volta:
  version: 2
  namespace: dxe
  locality: repo
  applies_when: "ドキュメントの穴を補完したい／用語リンクを張りたい"
  min_role: VIEWER
  export: true
  tags:
    - dde
    - docs
    - glossary
---
# DDE の実行

1. `dxe` CLI で `dde extract` → 用語抽出
2. `dde generate` → 用語記事生成
3. `dde link` → ドキュメントに `[term](docs/glossary/xxx.md)` を自動挿入

詳細: `dde/kit/method.md`

## 関連

- `dxe://guide`（lifecycle 全体）
- リポジトリ: https://github.com/opaopa6969/DxE-suite
