# DGE Session: 内部構造の可視化 — フロー図・データフロー・ステート図

- **日付**: 2026-03-30
- **テーマ**: DGE の内部構造図とカスタマイズ hook の可視化
- **キャラクター**: 今泉 + ヤン + 千石 + ラインハルト + ハウス

---

## 3 つの図

1. **フロー図**: Step 1-10 の順番と分岐（mermaid flowchart）
2. **データフロー図**: 入力ファイル → エンジン → 出力ファイル
3. **ステート図**: session / project / spec のライフサイクル

## hook ポイント一覧

| Step | hook | カスタマイズ対象 |
|------|------|----------------|
| 1 | 読み込みファイル | 新ファイル種別追加 |
| 3 | テンプレート選択 | カスタムテンプレ推奨 |
| 3.5 | パターン選択 | プリセット追加 |
| 4 | キャラ推奨 | 推奨アルゴリズム |
| 5 | 会話劇構造 | ナレーション変更 |
| 6 | 抽出 | flow YAML extract |
| 7 | 保存先 | output_dir |
| 8 | 選択肢 | flow YAML post_actions |
| 10 | Spec 生成 | flow YAML generate |

## 成果物
- kit/INTERNALS.md（3 図 + hook 一覧 + ファイルマップ）
- CUSTOMIZING.md からリンク
- session 中の進捗表示 [Step N/10] を SHOULD で追加

## Gap

| # | Gap | Severity |
|---|-----|----------|
| 125 | 3 種の図が必要 | **High** |
| 126 | INTERNALS.md がない | **High** |
| 127 | hook ポイント一覧がない | Medium |
| 128 | session 中の進捗表示がない | Medium |
