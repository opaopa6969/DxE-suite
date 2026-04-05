# DD-005: DVE の model / view 完全分離

- **Date**: 2026-04-05
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Gap**: #8, #19

## Decision

DVE を kit (data layer) と app (view layer) に完全分離する。

- `dve/kit/` (@unlaxer/dve-toolkit): parser + graph + context + CLI → JSON 出力
- `dve/app/` (@unlaxer/dve-app): Preact + Cytoscape.js → JSON 消費

kit は JSON を吐く。app は JSON を食う。app を別の実装に差し替えても kit に影響しない。

## Rationale

- 技術選定（Cytoscape.js → 将来 D3 等）は view 層の問題。model 層から独立
- kit 単体で CLI クエリ (`npx dve trace`) が使える。Web UI なしでも価値がある
- npm publish は kit のみ。app はローカルビルド。kit の graph.json を食うのは自作 UI でも可

## JSON Contract

kit が出力する `graph.json` が API contract。version フィールドで互換性管理。
