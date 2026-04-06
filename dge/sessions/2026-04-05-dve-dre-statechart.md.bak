# DGE Session: DVE × DRE ステートマシン統合

- **Date**: 2026-04-05
- **Flow**: quick
- **Structure**: roundtable
- **Characters**: 今泉, ヤン, リヴァイ, 僕
- **Rounds**: 1

---

## テーマ

DVE が `.dre/state-machine.yaml` を読み込み、plugin 挿入を含むフルステートチャートを可視化する設計。DGE/DDE がインストールされたらフェーズが動的に追加される。

---

## Gap 一覧

| # | Gap | Category | Severity | Status |
|---|-----|----------|----------|--------|
| 1 | `.dre/state-machine.yaml` 未実装。DVE はデフォルト SM + plugin 検出で仮表示 | missing logic | High | Active |
| 2 | DxE plugin 検出 → SM にフェーズ動的挿入 | missing logic | High | Active |
| 3 | CLI テキスト SM 表示 + Web UI フェーズフロー図 | UX | Medium | Active |
| 4 | フェーズ二重レイヤー (active_phase vs context.json) | missing logic | Medium | Active |

## 設計決定

- デフォルト SM: backlog → spec → impl → review → release
- DGE 検出: dge/ 存在 → gap_extraction を spec の後に挿入
- DDE 検出: dde/ 存在 → doc_deficit_check を review の後に挿入
- DVE はフェーズではなくツール（全フェーズ横断で可視化）
- `.dre/state-machine.yaml` があればそちらを優先読み込み
- `.dre/context.json` があればstack topを現在ステートとして表示
