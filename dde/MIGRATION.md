# DDE migration notes

> **Canonical migration guide**: [`docs/migration-from-dde-toolkit.md`](../docs/migration-from-dde-toolkit.md) ([日本語](../docs/migration-from-dde-toolkit-ja.md)).
>
> This file only collects DDE-specific details that don't fit in the suite-wide guide.

## Where DDE lives now

| | Before (standalone) | Now (DxE-suite v4.2.0+) |
|---|---|---|
| Source repo | [`opaopa6969/DDE-toolkit`](https://github.com/opaopa6969/DDE-toolkit) (**archived**) | [`opaopa6969/DxE-suite`](https://github.com/opaopa6969/DxE-suite) → `dde/` |
| npm package | `@unlaxer/dde-toolkit@^0.1.x` | `@unlaxer/dde-toolkit@^4.2.0` (same name, aligned version) |
| Published from | DDE-toolkit repo root | `DxE-suite/dde/kit/` |
| PR target | DDE-toolkit (no longer accepted) | DxE-suite `main` |

## Version mapping

`@unlaxer/dde-toolkit` skipped from `0.1.8` directly to `4.2.0` to align with the suite-wide version. There is **no functional break** — the jump is metadata only. Pinning notes are in [§4 of the canonical guide](../docs/migration-from-dde-toolkit.md#4-version-number-changes).

## Activating DDE in a project

After installing via either mode (`npx dxe install dde` or the standalone `npx dde-install`), enable the skills:

```bash
npx dxe activate dde        # moves dde-session.md / dde-update.md out of .claude/skills/disabled/
```

Skills are installed **disabled by default** under DRE's `.claude/skills/disabled/` convention. The activation flow — why skills start disabled and how `dxe activate` moves them — is documented in [docs/skill-activation-flow.md](../docs/skill-activation-flow.md).

> The skill filenames are `dde-session.md` and `dde-update.md`; the CLI argument is the toolkit name `dde` (not `dde-session`). `dxe activate dde` flips every skill prefixed `dde-`.

## dde-install merge behavior (current limitation)

`npx dde-install` currently:

- **Overwrites** files it owns unconditionally: `dde/method.md`, `dde/flows/`, `dde/bin/dde-tool.js`, `dde/version.txt`, `.claude/skills/dde-*.md`.
- **Appends idempotently** to shared files (`AGENTS.md`, `GEMINI.md`, `.cursorrules`) using a section marker (`## DDE —` / `# DDE —`). Re-running does not duplicate the section, but manual edits inside the section will be untouched only because the marker check short-circuits the append — there is no three-way merge.

There is **no `--strategy` flag yet**. If your project has custom edits inside the DDE-owned files, back them up before re-running. Tracked as follow-up in the monorepo; open an issue if you hit a collision.

## Rolling back

See [§7 Rollback plan](../docs/migration-from-dde-toolkit.md#7-rollback-plan) in the canonical guide. Glossary data under `docs/glossary/` is never touched by install/uninstall.

## References

- [ADR-0002 — Archive DDE into the monorepo](../docs/decisions/0002-archive-dde-into-monorepo.md)
- [CHANGELOG](../CHANGELOG.md)
- [Suite-wide architecture](../docs/architecture.md)
