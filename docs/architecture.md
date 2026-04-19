[日本語版はこちら / Japanese](architecture-ja.md)

# Architecture

This document explains **why** the DxE-suite repository is structured the
way it is — the monorepo layout, the workspace layout, and the boundaries
between DGE, DDE, DVE and DRE.

## 1. Repository layout

```
DxE-suite/                              (monorepo root, v4.2.0)
├── bin/dxe.js                          unified CLI (install / update / status / activate / deactivate)
├── package.json                        workspaces: dge/kit, dge/server, dre/kit, dve/kit
├── dve.config.json                     multi-project DVE config (projects list + shared paths)
│
├── dge/                                DGE — Design-Gap Extraction
│   ├── kit/                            npm: @unlaxer/dge-toolkit  (3 skills)
│   ├── server/                         npm: @unlaxer/dge-server   (character-recommendation API)
│   ├── characters/                     19 default characters + custom slot
│   ├── flows/                          quick / design-review / brainstorm / tribunal / wargame / …
│   ├── sessions/                       immutable session logs (dialogue text is mandatory)
│   ├── decisions/                      DD-NNN (one file per design decision)
│   ├── specs/                          specs produced at the end of a flow
│   └── paper/                          research paper on the method
│
├── dde/                                DDE — Document-Deficit Extraction  (archived subtree, ADR-0002)
│   ├── kit/                            npm: @unlaxer/dde-toolkit
│   │   ├── bin/dde-install.js          installer (node, not bash)
│   │   ├── bin/dde-tool.js             CLI: extract / articleize
│   │   ├── lib/                        dde-link (Markdown rewriter)
│   │   ├── flows/quick.yaml            the 6-step DDE flow
│   │   └── skills/                     dde-session.md, dde-update.md
│   └── README.md / README.ja.md        methodology
│
├── dre/                                DRE — Document Rule Engine
│   ├── kit/                            npm: @unlaxer/dre-toolkit (13 skills)
│   │   ├── engine/                     workflow engine (state-machine.yaml + context.json)
│   │   ├── hooks/                      post-check.sh / stop-check.sh / commit-msg.sh / notify.sh
│   │   │   └── settings.json           Claude Code hooks manifest (shared with .claude/)
│   │   ├── plugins/                    dge-plugin.yaml, dde-plugin.yaml, dve-plugin.yaml
│   │   ├── rules/                      MUST rules
│   │   └── skills/                     13 skills, all disabled/ by default
│   └── docs/                           flows.md, strategy.md
│
├── dve/                                DVE — Decision Visualization Engine
│   ├── kit/                            npm: @unlaxer/dve-toolkit (6 skills)
│   │   ├── parser/                     session / decision / spec / annotation / git-linker / glossary / drift / state
│   │   ├── graph/                      schema + builder + query + cluster
│   │   ├── context/                    ContextBundle exporter (DVE → DGE restart)
│   │   ├── server/                     API: annotations, drift, coverage, scan, status, slack
│   │   └── scripts/                    recover-all, recover-dialogues, discover-decisions, audit-duplicates
│   ├── app/                            Web UI: Preact + Cytoscape.js + Vite
│   ├── annotations/                    user comments, overturns, forks
│   └── contexts/                       generated ContextBundle files
│
├── .claude/
│   ├── settings.json                   hooks (PostToolUse + Stop + commit-msg)
│   ├── skills/                         22 skills (DGE 3 + DRE 13 + DVE 6); DDE adds more when activated
│   │   └── disabled/                   skills shipped disabled; `dxe activate` moves them here → skills/
│   ├── rules/                          rules/dre-skill-control.md and friends
│   └── projects/                       per-project caches (gitignored)
│
└── .dre/
    ├── state-machine.yaml              base workflow: backlog → spec → impl → review → release
    ├── context.json                    current phase + sub-state + stack
    ├── dre-config.json                 notification channels, stop-hook tuning
    ├── hooks/                          symlink-equivalent copies of dre/kit/hooks/*
    ├── notifications.json              recent notification history
    └── pending-decisions.json          decisions detected but not yet recorded as DD
```

## 2. npm workspaces — registered and **not** registered

The `package.json` at the root declares:

```json
"workspaces": [
  "dge/kit",
  "dge/server",
  "dre/kit",
  "dve/kit"
]
```

### 2.1 What this means

`npm install` at the root hoists `dge/kit`, `dge/server`, `dre/kit` and
`dve/kit` into the root `node_modules/`. Scripts in those packages can
resolve cross-workspace dependencies normally, and their `bin/` entries
show up under `node_modules/.bin/`.

### 2.2 What is missing — known bug

The `dde/kit` workspace is **not registered**. As a result:

- `npm install` at the root does **not** hoist `dde/kit`'s dependencies,
  and `dde/kit/node_modules` is not populated via workspaces.
- `dde/kit/bin/dde-install.js` continues to work because it is invoked
  **directly** by `bin/dxe.js` (see `TOOLKITS.dde` in `bin/dxe.js`), with
  its `runWith: 'node'` flag. So users can still run `npx dxe install dde`.
- However, any dev workflow that relies on `npm run ... --workspace=dde/kit`
  or that expects `dde-toolkit` packages to be resolvable from within
  `dge/kit` (for example) will **fail**.

`dge/kit` is registered as a workspace but is also used via direct
invocation (`dge/kit/install.sh`) — so it behaves correctly either way.

This bug is tracked as *documentation-first* for now: the intent (keep DDE
as a subtree — see [ADR-0002](decisions/0002-archive-dde-into-monorepo.md))
is not in doubt, but the `package.json` edit to add `"dde/kit"` to
`workspaces` has not yet been made. Do not "fix" it without first
verifying that `dde/kit/package.json` is compatible with npm workspace
hoisting (it declares its own `bin` entries, which can collide).

The workspace list should read:

```json
"workspaces": [
  "dge/kit",
  "dge/server",
  "dde/kit",
  "dre/kit",
  "dve/kit"
]
```

…once the above is verified.

## 3. Responsibility boundaries

The four toolkits have **orthogonal** responsibilities. This table makes
the boundaries explicit so that the right thing gets added to the right
place.

| Concern | DGE | DDE | DVE | DRE |
|---|---|---|---|---|
| Find **design** gaps | ✅ | | | |
| Find **documentation** gaps | | ✅ | | |
| Visualize the decision graph | | | ✅ | |
| Distribute rules/skills/hooks | | | | ✅ |
| Record a DD | writes `dge/decisions/DD-NNN.md` | | *reads only* | enforces "Ref: DD-NNN" in commits |
| Record a session | writes `dge/sessions/*.md` | writes `dde/sessions/*.md` | *reads only* | enforces full-dialogue text |
| Generate a glossary | | writes `docs/glossary/*.md` | *reads only* (hover) | |
| Own the workflow | consumer | consumer | consumer | **owner** — state-machine.yaml + plugins |
| Own the hooks | — | — | — | **owner** — PostToolUse / Stop / commit-msg |

### 3.1 DGE

Thin responsibility: **produce** sessions, decisions, specs. DGE knows
nothing about graphs, glossaries, or hooks; it only writes Markdown files
into `dge/sessions/`, `dge/decisions/`, `dge/specs/`. Its quality criteria
are about *dialogue quality* (surface gaps from character conflict) — see
[`dge/kit/method.md`](../dge/kit/method.md).

### 3.2 DDE

Thin responsibility: **produce** term articles and **rewrite** other docs
to link to them. DDE does not know about DD files — its artifacts live
entirely in `docs/glossary/`. The rewriter (`npx dde-link`) is a pure
text pass over Markdown and has a `--check` mode for CI.

### 3.3 DVE

Pure **read-and-render**. DVE's parsers read sessions, decisions, specs,
annotations and a Git-derived history, then build `graph.json`. The Web
UI and server expose queries on that graph. DVE never writes into `dge/`
or `dde/` — the only things it writes are `dve/annotations/`,
`dve/contexts/`, and its own `graph.json`.

Core value: **visualising the undecided**. Orphan Gaps (no linked DD) are
the product of DVE, not DGE. That is the whole point of having a separate
visualization engine.

### 3.4 DRE

The **active** layer. DRE owns:

- **The workflow state machine** at `.dre/state-machine.yaml`. Plugins
  (DGE/DDE/DVE — see `dre/kit/plugins/`) can *insert* phases and
  sub-states; they cannot own them.
- **The hooks**. `post-check.sh`, `stop-check.sh`, `commit-msg.sh`,
  `notify.sh`. These are the places where "the rules become code."
- **The CLI surface** for workflow transitions (`dre-engine transition`,
  `dre-engine sub-transition`, `dre-engine push/pop`).
- **The notification channel** (`DRE_NOTIFY_URL`, `.dre/dre-config.json`).

If a rule needs to **block** something, it belongs in DRE. If it only
needs to be **shown**, it belongs in DVE. If it needs to be **written**,
it belongs in DGE or DDE.

## 4. Key cross-toolkit contracts

### 4.1 DGE → DVE: `dge/sessions/*.md`

DVE's session parser expects dialogue text to be preserved verbatim (no
summarisation) — the PostToolUse hook in DRE enforces this. Without full
dialogue, the Gap → dialogue-line jump in DVE breaks.

### 4.2 DGE → DVE → DRE: `dge/decisions/DD-NNN.md`

DD files must include Session references. DVE reads them to build edges;
DRE's commit-msg hook requires a `Ref: DD-NNN` trailer to tie commits to
decisions.

### 4.3 DDE → everywhere: `docs/glossary/*.md`

DDE writes Markdown files here. Any other tool (DVE Web UI, readers) can
link to them via `[term](docs/glossary/xxx.md)`. `dde-link --check` in CI
ensures no dangling references.

### 4.4 DRE plugin manifests

Each DxE toolkit ships a plugin manifest under `dre/kit/plugins/` that
tells DRE which workflow phase(s) and sub-states to insert. This is how
the DRE SM can *look like it knows* about DGE without DRE depending on
DGE code.

## 5. Release units

Every toolkit currently ships from the same version — **v4.2.0**. The
version bump is synchronised by a single commit (see
[CHANGELOG.md](../CHANGELOG.md)). This makes `dxe status` trivially
interpretable: if anything is not 4.2.0, there is drift.

## 6. Further reading

- [ADR-0001 — Remove Stop(LLM prompt) hook](decisions/0001-remove-stop-llm-prompt-hook.md)
- [ADR-0002 — Archive DDE into the monorepo](decisions/0002-archive-dde-into-monorepo.md)
- [Migrating from `@unlaxer/dde-toolkit`](migration-from-dde-toolkit.md)
- [Getting Started](getting-started.md)
