# DD-003: DVE 技術スタック（Preact + Cytoscape.js + Vite）

- **Date**: 2026-04-05
- **Session**: [2026-04-05-dve-design](../sessions/2026-04-05-dve-design.md)
- **Gap**: #6, #7, #17, #25, #28

## Decision

DVE の技術スタックを以下で確定する:

| Layer | Technology |
|-------|-----------|
| Parser | TypeScript + remark/unified |
| Graph | TypeScript (pure, no deps) |
| UI | Preact |
| Graph Viz | Cytoscape.js (dagre layout) |
| Build | Vite (SSG mode) |

## Rationale

- **Mermaid 却下**: クリッカブルでない。ユーザー指針「グラフィカルだがクリッカブルでないのは不可」
- **Preact > React**: DVE の規模に対して React は太りすぎ。Preact は API 互換で軽量
- **Cytoscape.js**: click/hover/expand が組み込み。1000 ノードまで実用的。dagre layout で時間軸表示
- **remark**: markdown AST を取得。自前パーサーを書かない
- **Vite SSG**: 静的ビルド。server 不要の設計原則と一致

## Alternatives Considered

- React Flow: React 依存が重い。Cytoscape.js のほうが軽量
- D3.js: 自由度は高いが学習コスト大。Cytoscape.js で十分
- Mermaid: Phase 1 のプレビュー用としても UX 不足。却下
