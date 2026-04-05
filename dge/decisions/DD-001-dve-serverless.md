# DD-001: DVE は server を持たない（Vite SSG）

- **Date**: 2026-04-05
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Gap**: #4, #7

## Decision

DVE は server を持たない。Vite の SSG モードで静的 HTML + JS + JSON を生成し、ブラウザで直接開く。

## Rationale

- DVE は read-only の可視化。リアルタイム更新やデータ書き込みが不要
- DGE server が既にある。DVE まで server を持つとメンテナンスコストが倍増
- FS 完結の設計原則: DVE は `dge/sessions/` と `dge/decisions/` を直接パースする
- `npx dve serve --watch` でファイル監視 + 自動リビルドは可能（dev server ≠ production server）

## Alternatives Considered

- Express/Hono server: データ量が増えた場合に有利だが、現時点では不要
- DGE server に DVE エンドポイント追加: 依存結合が増える。却下

## Consequences

- Phase 2 で Annotation の Web UI 書き込みが必要になった場合、local server の追加が必要になる可能性がある
- 大規模プロジェクト（1000+ ノード）では SSG のビルド時間が問題になる可能性
