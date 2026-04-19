[日本語版はこちら / Japanese](migration-from-dde-toolkit-ja.md)

# Migrating from `@unlaxer/dde-toolkit` (standalone) to DxE-suite

If you used DDE before 4.1.0, you installed it from its own npm package:

```bash
npm install --save-dev @unlaxer/dde-toolkit
npx dde-install
```

From 4.1.0 onwards, DDE is part of DxE-suite
([ADR-0002](decisions/0002-archive-dde-into-monorepo.md)). This guide
shows how to migrate. **No data is lost** — `docs/glossary/`,
`dde/sessions/`, and `dde/flows/` layouts are unchanged.

## 1. Decide which install mode you want

### Mode A — monorepo

You clone DxE-suite and run DDE from there. Best for projects that also
use DGE/DRE/DVE.

```bash
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install
node bin/dxe.js install dde --yes
node bin/dxe.js activate dde
```

### Mode B — per-project npm (backwards compatible)

You stay on the standalone DDE npm package **or** switch to the DxE-suite
umbrella. The standalone package is still published, and API-compatible
with the monorepo version.

```bash
# Option B1 — keep the standalone package (no migration needed, but no
#             glued-up DxE experience)
npm install --save-dev @unlaxer/dde-toolkit
npx dde-install

# Option B2 — use the DxE-suite umbrella CLI
npm install --save-dev @unlaxer/dxe-suite
npx dxe install dde
```

## 2. What changes on disk

**Nothing.** All three options drop the same layout into your project:

```
dde/
├── method.md
├── flows/quick.yaml
├── bin/dde-tool.js
├── sessions/
└── version.txt
docs/
└── glossary/
    ├── jwt.md
    ├── jwt.ja.md
    └── dictionary.yaml
.claude/
└── skills/
    ├── dde-session.md
    └── dde-update.md
```

The monorepo-mode install also adds `.claude/skills/disabled/` variants
(the DRE convention — see
[README.md § Known issues](../README.md#known-issues)).

## 3. CLI changes

| Old (standalone) | New (monorepo / umbrella) | Notes |
|---|---|---|
| `npx dde-install` | `npx dxe install dde` | or `node bin/dxe.js install dde` in monorepo |
| `npx dde-tool …` | `npx dde-tool …` (unchanged) | `dde-tool` is still in `dde/kit/bin/` |
| `npx dde-link …` | `npx dde-link …` (unchanged) | `dde-link` is still in `dde/kit/lib/` |
| — | `npx dxe activate dde` | **new** — enable DDE skills in one step |
| — | `npx dxe deactivate dde` | **new** — disable DDE skills |
| — | `npx dxe update` | update all four toolkits together |

The `dde-tool` and `dde-link` binaries are **not renamed** — your CI
scripts calling `npx dde-link README.md --check` keep working.

## 4. Version-number changes

Before the monorepo integration, DDE versions looked like `0.1.x` while
DGE/DRE/DVE were at `4.x`. From 4.2.0 onwards, **all four toolkits share
the same version**.

If you pin DDE in `package.json`:

```diff
  "devDependencies": {
-   "@unlaxer/dde-toolkit": "^0.1.8",
+   "@unlaxer/dde-toolkit": "^4.2.0",
    "@unlaxer/dxe-suite":   "^4.2.0"
  }
```

`dxe status` inside a project now shows all four versions aligned —
that's the goal. If you see a drift, something is wrong.

## 5. Where DDE data went

Short answer: **nowhere different.** The monorepo treats
`docs/glossary/`, `dde/sessions/` and `dde/flows/` as *per-project*
artifacts, exactly as the standalone tool did. DxE-suite as an
installation **never** copies your glossary into `DxE-suite/dde/`; it
only deposits the **skills + CLIs** into your project's `.claude/` and
`dde/kit/`-adjacent locations.

## 6. Collisions to watch for

When `dde/kit` is *also* added to `package.json` `workspaces` (see
[architecture.md § 2.2](architecture.md#22-what-is-missing--known-bug)),
its `bin` entries will be hoisted into the monorepo's `node_modules/.bin/`.
Names to check before landing that fix:

- `dde-install` — unique to DDE.
- `dde-tool` — unique to DDE.
- `dde-link` — unique to DDE.

None currently collide with DGE / DRE / DVE bin names (which are
`dge-*`, `dre-*`, `dve-*`, `dxe`). Collisions would be a blocker for
adding `dde/kit` to workspaces; a quick grep says we're fine, but verify
on the tip of main before shipping.

## 7. Rollback plan

If the monorepo integration gives you trouble:

```bash
# 1. Remove the monorepo-installed skills
npx dxe deactivate dde

# 2. Delete dde/kit from node_modules hoisting (if workspaces was edited)
#    — not necessary as of 4.2.0 because dde/kit is NOT in workspaces

# 3. Reinstall the standalone package
npm install --save-dev @unlaxer/dde-toolkit@^0.1
npx dde-install
```

Your `docs/glossary/` is unaffected.

## 8. FAQ

**Q. Can I keep the upstream `@unlaxer/dde-toolkit` repo as my source?**
Yes. The upstream repo is read-only but still hosts releases. If you
have a CI that cares only about `dde-link --check`, nothing needs to
change.

**Q. Will DDE ever diverge from the monorepo?**
No. From 4.2.0 onwards, the monorepo is the source of truth. Any
standalone releases of `@unlaxer/dde-toolkit` will be *subtree splits*
of the monorepo.

**Q. Why is `dde/kit` not in `workspaces`?**
A known integration bug; see
[ADR-0002 § Mitigations](decisions/0002-archive-dde-into-monorepo.md#mitigations)
and [architecture.md § 2.2](architecture.md#22-what-is-missing--known-bug).
`npx dxe install dde` still works because the CLI invokes DDE's
installer directly.

## References

- [ADR-0002 — Archive DDE into the monorepo](decisions/0002-archive-dde-into-monorepo.md)
- [architecture.md](architecture.md)
- [CHANGELOG](../CHANGELOG.md)
