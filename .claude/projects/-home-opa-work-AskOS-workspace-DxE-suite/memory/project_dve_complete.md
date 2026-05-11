---
name: DVE implementation complete
description: DVE Phase 1-3 + DRE enforcement engine + workflow SM 全完了。DxE-suite v4.0.0 の 3 toolkit が揃った。
type: project
---

DVE (Decision Visualization Engine) の実装が 2026-04-06 に完了。

**Why:** DGE/DRE ループの決定プロセスを可視化し、過去の文脈から新 DGE を起動するハブが必要だった。

**How to apply:**
- DVE kit: dve/kit/ (parser, graph, context, server, cli, skills, install.sh, update.sh)
- DVE app: dve/app/ (Preact + Cytoscape.js + Vite)
- DRE enforcement: .dre/hooks/ (PostToolUse + Stop hook で全 DxE ルール強制)
- DRE workflow engine: .dre/state-machine.yaml + context.json + plugin manifest
- 3 toolkit 揃い: DGE(3 skills) + DRE(13 skills + hooks) + DVE(6 skills)
- DRE が enforcement の中央集権。DGE/DVE は hooks 不要
- ADR は使わず DD に統一
- 会話劇は MUST で全文保存（enforcement hook でチェック）
