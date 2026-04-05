# DGE Session: dxe-server 設計
- Date: 2026-04-04
- Flow: design-review
- Theme: DxE Visualization Server（決定可視化＋ステート可視化 API サーバー）
- Characters: ヤン、今泉、リヴァイ、マンガー、舞台監督
- Trigger: DRE-toolkit の「DRE して」が未実装だったことから派生

## Gap 一覧

| # | Gap | Severity | Category |
|---|-----|----------|----------|
| 1 | 「ステート」（現在断面）と「決定」（時系列履歴）は別概念——設計で分ける必要がある | High | 設計概念 |
| 2 | APIサーバーの本質価値は「複数プロジェクト横断集約」——一人・一プロジェクトならファイルで十分 | Critical | 価値定義 |
| 3 | 「誰がいつ何のために見るか」未定義——用途でサーバー要否すら変わる | Critical | ユーザー定義 |
| 4 | 可視化層は `dxe-server` として別パッケージ分離。DxE-suiteはインストール管理に集中 | High | アーキテクチャ |

## ADR

- ADR-001: dxe-server を `@unlaxer/dxe-server` として独立パッケージ化（DxE-suite統合なし）
  - 理由: DxE-suite はカーネル役（配布管理）。dxe-server は GUI層（可視化）。任意インストール。

## 次のDGEセッション推奨テーマ

1. データモデル設計（ステートと決定の構造化）
2. マルチプロジェクト対応設計
3. Gap #3 深掘り（ユーザープロファイル・使用頻度の決定）

## handoff

`/home/opa/work/AskOS-workspace/dxe-server/design-materials/intake/initial-design.md`
