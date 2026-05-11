---
name: Use DD not ADR for design decisions
description: 設計判断の記録は ADR ではなく DD (Design Decision) で統一する
type: feedback
---

設計判断の記録は DD-NNN 形式で統一する。ADR (Architecture Decision Records) は使わない。

**Why:** DGE の Step 9.5 が DD を生成するフローを持っており、ADR は概念として spec type enum に残っているだけで読み書きの仕組みがない。DD と ADR は機能的に同じなので DD で統一。

**How to apply:** spec 生成時の type enum に ADR があっても、実際のファイル生成は DD-NNN-slug.md 形式で dge/decisions/ に保存する。
