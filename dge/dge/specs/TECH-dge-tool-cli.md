---
status: implemented
source_session: design-materials/intake/dge-tool-cli-design.md
source_gap: "#134-140"
---

<!-- DGE 生成: 実装前に人間がレビューしてください。 -->

# TECH-dge-tool-cli: MUST 強制 CLI ツール

## 概要
Node.js CLI。MUST をコードで強制。npm bin で配布。

## コマンド（v1: 2 個）

### dge-tool save
```
echo "content" | dge-tool save <filepath>
→ stdout: "SAVED: <filepath> (N bytes)"
→ エラー時: "ERROR: <message>"
```

### dge-tool prompt
```
dge-tool prompt [flow-name]
→ stdout: 番号付き選択肢（flow YAML から読む or デフォルト）
```

### dge-tool version
```
dge-tool version
→ stdout: "dge-tool v1.0.0"
```

## ファイル構成
```
kit/bin/dge-tool.js    ← Node.js CLI（外部依存なし）
kit/package.json       ← bin に dge-tool 追加
```

## skill 統合
- Step 1: `dge-tool version` で検出 → tool mode or skill mode
- Step 7: tool mode → `dge-tool save` / skill mode → Write ツール
- Step 8: tool mode → `dge-tool prompt` / skill mode → 内蔵選択肢
- 失敗時: フォールバックで skill mode

## Acceptance Criteria
- [ ] `dge-tool save` で stdin → ファイル保存
- [ ] `dge-tool prompt quick` で選択肢 5 つ表示
- [ ] `dge-tool prompt design-review` で YAML から選択肢読み込み
- [ ] `dge-tool version` でバージョン表示
- [ ] Windows (Node.js) で動作
- [ ] flow YAML がなくてもデフォルト選択肢
