# DGE Session: skill のコンパクト化

- **日付**: 2026-03-31
- **キャラ**: ヤン + リヴァイ + ハウス

## 結論
150 行 → 42 行（72% 削減）。各 Step を 1-2 行の "何をするか" に圧縮。"どうやるか" は LLM が知っている。

## 仕分け
| 削減対象 | 方法 |
|---------|------|
| Step 9C（40 行） | 1 行に圧縮（Agent ツールの使い方は LLM が知っている） |
| Step 7/8 の tool mode 分岐 | 圧縮（dge-tool の使い方は LLM が知っている） |
| Severity 基準 | flow YAML に移管済み |
| Step 9 判断テーブル | YAML post_actions に移管済み |
| Step 0 判定ルール | YAML trigger_keywords に移管 |
