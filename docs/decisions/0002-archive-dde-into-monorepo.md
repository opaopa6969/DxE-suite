# ADR-0002 — Archive DDE into the DxE-suite monorepo

- **Status**: Accepted
- **Date**: 2026-04-08
- **Commits**:
  - `feb26ce` — Squashed `dde/` content from upstream `d9ea44a`
  - `3d742ef` — Merge commit `feb26ce` as `dde/`
  - `9e5630d` — *feat: DDE を monorepo に追加 + DGE v4.1.0 update 反映*
  - `2d4d434` — *feat: DDE を monorepo 統合 + dxe activate/deactivate 対応*
  - `8edcf20` — *docs: DDE をモノレポ内として更新 — 「別リポジトリ」から移行*
- **Supersedes**: the previous "DDE = separate repository" treatment
- **Superseded by**: —

## Context

Before 4.1.0, DDE lived in its own Git repository, distributed only via
npm as `@unlaxer/dde-toolkit`. The other three toolkits (DGE, DRE, DVE)
were already co-located in the DxE-suite monorepo after 4.0.0.

The split made some things easier:

- DDE could version independently (`0.1.x` while DGE/DRE/DVE moved
  through `4.x.y`).
- DDE's release surface was narrow — one `npm publish` and done.

But it made several things worse:

1. **Version drift.** Users ended up with DGE 4.1 + DDE 0.1.8 + DRE 4.1
   + DVE 4.1. `dxe status` output was hard to interpret. "Is `0.1.8`
   behind or just a different project?"
2. **Cross-toolkit changes were painful.** Adding
   `dxe activate dde` meant changing both the CLI (in DxE-suite) and the
   skills layout (in the DDE repo). Two PRs, two reviews, two releases,
   one cross-repo coupling.
3. **`npx dxe install dde` was a second-class citizen.** The CLI had to
   branch on "DDE is in a separate repo, fetch from npm" even when every
   other toolkit was local.
4. **Documentation fragmentation.** The main README had to keep pointing
   users elsewhere ("DDE lives at github.com/…/dde"), and the
   cross-toolkit narrative (DGE finds gaps → DDE fills doc gaps → DVE
   visualises) was split across repos.

## Decision

**Import DDE into DxE-suite as a `git subtree`, with the DDE repo as the
upstream.** Specifically:

- Squash import of the DDE repo at commit `d9ea44a` into a single commit
  (`feb26ce`).
- Merge that as `dde/` in DxE-suite (`3d742ef`).
- Update `bin/dxe.js` so that DDE becomes a first-class toolkit
  (`localKit: 'dde/kit'`, `runWith: 'node'`, `install:
  'bin/dde-install.js'`), and so that `dxe activate dde` / `dxe
  deactivate dde` operate on DDE skills.
- Align the DDE version with the suite. At 4.2.0 (commit `7dec550`),
  DDE was bumped from `0.1.x` to `4.2.0` to match.
- Rewrite the README to describe DDE as a sibling of DGE/DRE/DVE, not a
  separate repository (commit `8edcf20`).

We are keeping the *external* DDE repository as read-only for now —
subtree pulls can still sync changes upstream ↔ downstream if required —
but the **authoritative** source is now this monorepo.

## Consequences

### Positive

- **One version number, one status check.** `dxe status` output is now
  internally consistent.
- **Cross-toolkit changes are one PR.** Adding `dxe activate dde`,
  changing the DRE hook to scan glossary coverage, etc., all happen in
  one diff.
- **Cleaner narrative.** `README.md` can describe DGE/DDE/DVE/DRE as
  four equal siblings.
- **First-class CLI support.** `npx dxe install dde` works in monorepo
  mode without an npm round-trip.

### Negative

- **DDE can no longer be released standalone** without extra work (it
  must be subtree-split back out to publish as `@unlaxer/dde-toolkit`).
  We accept this because publishing to npm is still possible on demand
  from the monorepo.
- **Git history for DDE is squashed** in this repo. The upstream DDE
  repo retains the full history; in DxE-suite, everything before
  `feb26ce` is one commit. This is the standard trade-off for subtree
  import.
- **`package.json` workspaces is now out of sync.** `dde/kit` is *not*
  listed in `"workspaces"`. The CLI bypasses this via direct invocation
  (`bin/dxe.js` runs `dde/kit/bin/dde-install.js` with `runWith:
  'node'`), but `npm run --workspace=dde/kit …` does not work and hoisted
  `node_modules` is not set up for DDE. This is tracked in
  [architecture.md § 2.2](../architecture.md#22-what-is-missing--known-bug);
  it is a **known bug of this ADR**, not a deliberate choice.

### Mitigations

- The workspace-registration bug is scheduled to be fixed by adding
  `"dde/kit"` to `package.json` `workspaces`. The fix is not yet landed
  because `dde/kit/package.json` has `bin` entries (`dde-install`,
  `dde-tool`) that need to be checked for collisions before they are
  hoisted. See [migration-from-dde-toolkit.md](../migration-from-dde-toolkit.md#collisions-to-watch-for).
- Any future divergence between the monorepo's `dde/` and the upstream
  `@unlaxer/dde-toolkit` npm package should be *reconciled in the
  monorepo*, then re-published to npm. The monorepo is now the source.

## Alternatives considered

- **Keep DDE as a separate repository and pull it in via a Git
  submodule.** Rejected because submodules make `npm install` brittle
  and are frequently missed on clone.
- **Keep DDE as a separate repository and rely on `npm install
  @unlaxer/dde-toolkit` at the monorepo root.** Rejected because it
  leaves DDE physically outside this tree, breaking the goal of "one
  place to read the source."
- **Full Git history import instead of squash.** Rejected to keep the
  monorepo log readable and to avoid polluting `git log --oneline` with
  hundreds of pre-suite DDE commits. The upstream repo is the archive.

## References

- Upstream commit at squash time: `d9ea44a` (external DDE repository).
- Monorepo merge commits: `feb26ce`, `3d742ef`.
- CLI integration: `9e5630d`, `2d4d434`.
- Version unification: `7dec550`.
- Documentation update: `8edcf20`.
- Migration guide for existing DDE users:
  [docs/migration-from-dde-toolkit.md](../migration-from-dde-toolkit.md).
