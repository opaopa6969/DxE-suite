# Changelog

All notable changes to DxE-suite are documented here. This file follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

The shared version number covers the monorepo CLI and all four toolkits —
DGE, DDE, DRE, DVE — unless a toolkit-specific note says otherwise.

Commit grain: DDE integration merged several upstream commits; we list the
salient units (monorepo merge, integration feature work, CLI support, docs
migration, version bump) separately.

## [4.2.0] - 2026-04-09

### Added
- `dge-session-fix`: rescue DGE session dialogue that was lost during `auto_iterate` (596dd55).
- Skip DGE session / DD / spec files from implicit-decision detection to stop false positives (26f4167).

### Changed
- **Unified versioning**: DGE / DRE / DVE / DDE bumped to 4.2.0 (fdc2b84, 7dec550).
- DDE is now documented as a **monorepo sibling**, not a "separate repo" (8edcf20).

### Removed
- **Stop (LLM prompt) hook removed.** The LLM-prompt variant of the Stop hook kept returning non-JSON output, so it is deleted from both `.claude/settings.json` and `dre/kit/hooks/settings.json`. The command hook `stop-check.sh` now covers all checks, and both PostToolUse and Stop get an error-fallback so hook failure never blocks a session (438aa23). See [ADR-0001](docs/decisions/0001-remove-stop-llm-prompt-hook.md).

### Fixed
- `dxe` CLI: monorepo vs npm mode was mis-detected when `private: true` was missing; DRE hooks are now packaged into the npm tarball (16cc4e1).

## [4.1.0] - 2026-04-08

### Added
- **DDE archived into the monorepo.** `dde/` is now a subtree inside DxE-suite; `npx dxe install dde` drives `dde/kit/bin/dde-install.js` locally. See [ADR-0002](docs/decisions/0002-archive-dde-into-monorepo.md).
  - Subtree import: squash commit of upstream dde at `d9ea44a`, merged as `dde/` (feb26ce, 3d742ef).
  - `bin/dxe.js`: DDE added with `localKit: 'dde/kit'`, `runWith: 'node'`, and `install: 'bin/dde-install.js'` (no update script yet) (9e5630d, 2d4d434).
  - `dxe activate` / `dxe deactivate`: DDE added to the skill-prefix map so `dxe activate dde` works (2d4d434, 1213c02).
- **`dxe activate` / `dxe deactivate`** — bulk-enable or disable all skills belonging to one toolkit (1213c02).
- **DGE theatrical-technique Phase 1** — stage directions, Category D patterns, character extensions (234b0c9, 7a713e4, c6b73c6).
- **DRE enforcement engine** — PostToolUse + Stop + commit-msg hooks enforce all DxE rules (f8ef009).
- **DRE notification system** — Slack / Discord / webhook / desktop channels (e680499).
- **DVE Slack Bot** — slash commands + Events API + Block Kit list buttons + interactive endpoint + setup guide (f97235b, cb495e8, c8ee5db).
- **`dve scan` + `--audit`** — auto-discover DxE projects, register them, and report where homegrown code can be replaced by DxE toolkits (9405d89, 3c52358, 70f1208, c9f099c).
- **Update changelog display** — `dxe update` prints new features from each toolkit's `CHANGELOG.md` and Slack-notifies (70f1208).
- **Glossary** — auto-extract terms + hover definitions in the DVE Web UI (3db61c0).
- **URL routing** — hash-based routing in DVE Web UI, `/#/decision/DD-003` sharable links (07b20e5).
- **Implicit-decision capture + commit DD reference** — hook-driven systematic operation (0305a01, 84af700, 29cb1f7).
- **DVE onboarding + tooltips + help** + shared Markdown rendering (b5b37c4, 23155cd, 6d2eebd).
- **Session → dialogue → Gap → DD flow visualization**, including dialogue-text recovery from Claude Code logs (1d1d7b5, 9062f2c, c00cf42, 72545d7, 4e9092f, 6e86c81).
- **DxE plugin sub-state machines** — DGE / DDE / DVE all drive sub-states through the DRE workflow (b20c6d5, d089a8d, a62eedb).

### Changed
- `dxe update` automatically deploys `settings.json` + hooks to `.claude/` + `.dre/` (f3b91d6).
- `dxe update` auto-tags DxE version after an update (05085b0).
- Hook deploy path fixed: `SRC/../hooks` → `SRC/hooks` (8cf8bbf).

### Fixed
- Stop hook LLM prompt simplified to avoid JSON validation failures (3beb67f). (Later removed entirely in 4.2.0.)
- `npx dge-update` / `npx dre-update` dispatched correctly in npm mode (297837a).

## [4.0.0] - 2026-04-07

### Added
- **Monorepo unification.** `dxe` CLI drives a monorepo layout with `workspaces: dge/kit, dge/server, dre/kit, dve/kit`; version bumped to 4.0.0 for all toolkits; README rewritten (c20feea).
- **DRE workflow engine** — state-machine + context + plugin (3ee70d2, 86006c2).
- **DVE workflow SM display** — plugin detection + phase flow in Web UI (d089a8d).
- **`dre-tool effective-sm`** — render the installed state machine as Mermaid (aeffc1d).

### Fixed
- `peerDeps` version alignment; `install` / `update` auto-runs `npm install` (abc0164).

## [0.1.0] - 2026-04-05

### Added
- **Initial release** — `DxE-suite`: one monorepo to install and manage DGE / DDE / DRE (1ae539b).

---

## Conventions

- **Version bump** commits (`bump:` prefix) are documented under the version they introduce.
- **feat / fix / docs** commits map to Added / Fixed / Changed as appropriate.
- ADRs that correspond to behavior changes are linked inline.

[4.2.0]: https://github.com/opaopa6969/DxE-suite/releases/tag/v4.2.0
[4.1.0]: https://github.com/opaopa6969/DxE-suite/releases/tag/v4.1.0
[4.0.0]: https://github.com/opaopa6969/DxE-suite/releases/tag/v4.0.0
[0.1.0]: https://github.com/opaopa6969/DxE-suite/releases/tag/v0.1.0
