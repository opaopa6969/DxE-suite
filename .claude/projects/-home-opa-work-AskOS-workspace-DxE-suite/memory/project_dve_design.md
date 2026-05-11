---
name: DVE design session completed
description: DVE (Decision Visualization Engine) の設計が DGE 7ラウンドで完了。Spec 3件 + DD 5件生成済み。次は実装フェーズ。
type: project
---

DVE (Decision Visualization Engine) の設計が 2026-04-05 の DGE セッション（7ラウンド、29 Gap）で完了。

**Why:** DGE/DRE ループの決定プロセスを可視化し、過去の文脈から新 DGE を起動するハブが必要。ユーザーは20プロジェクト並行運用。

**How to apply:**
- Spec: `dge/specs/dve-data-model.md`, `dve-uc.md`, `dve-tech.md`
- DD: `dge/decisions/DD-001` ~ `DD-005`
- Session: `dge/sessions/2026-04-05-dve-design.md`
- 技術スタック: Preact + Cytoscape.js + Vite (SSG), server なし
- DVE = DGE のハブ（6 UC）、model/view 完全分離 (kit + app)
- ADR という名前は使わず DD に統一
- Phase 1: Session + Gap + Decision + Annotation の4ノード
- 次のステップ: dve/kit のパーサー実装から
