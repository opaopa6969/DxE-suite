# DGE Session: dge-tool CLI の設計

- **日付**: 2026-03-31
- **テーマ**: MUST をコードで強制する CLI ツール
- **キャラクター**: 今泉 + ヤン + リヴァイ + ハウス + ソクラテス
- **パターン**: feature-extension

---

## 設計決定

- **言語**: bash（依存ゼロ）
- **コマンド**: save + prompt（最小。残りは v2）
- **配置**: dge/bin/dge-tool
- **検出**: Step 1 で dge-tool version
- **フォールバック**: 失敗時は skill mode（Write ツール / 内蔵選択肢）

## Gap

| # | Gap | Severity |
|---|-----|----------|
| 135 | ツール呼び出しも LLM 判断。100% 強制ではない | High |
| 134-139 | 他 | Medium/Low |

## コマンド

```
dge-tool save <file>     ← stdin → file。SAVED: <file> を返す
dge-tool prompt [flow]   ← flow YAML → 番号付き選択肢
dge-tool version         ← バージョン表示
```
