[日本語版はこちら / Japanese](getting-started-ja.md)

# Getting Started

DxE-suite in 5 minutes.

## 1. Install

### Option A — use the monorepo directly (recommended)

```bash
git clone https://github.com/opaopa6969/DxE-suite
cd DxE-suite
npm install
```

`npm install` at the root installs and hoists `dge/kit`, `dge/server`,
`dre/kit`, `dve/kit`. **Not** `dde/kit` — that workspace is currently
missing from `package.json`. `npx dxe install dde` still works because the
CLI invokes `dde/kit/bin/dde-install.js` directly; see
[architecture.md § 2.2](architecture.md#22-what-is-missing--known-bug).

### Option B — via npm (per project)

```bash
cd your-project
npm install --save-dev @unlaxer/dxe-suite
npx dxe install
```

The CLI detects that it is not in a monorepo and falls back to pulling
`@unlaxer/dge-toolkit`, `@unlaxer/dre-toolkit`, `@unlaxer/dve-toolkit`
from npm, then running each toolkit's `npx <tk>-install` script.

## 2. First run

```bash
# 1. Deploy skills / rules / hooks into the project (.claude/ + .dre/)
node bin/dxe.js install --yes

# 2. Enable the skills you want (DRE ships them disabled/)
node bin/dxe.js activate all            # or: dge / dde / dre / dve

# 3. Check what's installed
node bin/dxe.js status
```

Expected `status` output:

```
  Mode: monorepo

  DGE: 4.2.0
  DDE: 4.2.0
  DRE: 4.2.0
  DVE: 4.2.0
```

## 3. Common commands

```bash
# Run a DGE dialogue session (tell the agent)
"run DGE"

# Fill documentation gaps (tell the agent)
"run DDE"

# Visualise the decision graph
npx tsc -p dve/kit/tsconfig.json
node dve/kit/dist/cli/dve-tool.js build
cd dve/app && npm install && npx vite build && npx vite preview
# → http://localhost:4173

# Check workflow state
node dre/kit/engine/engine.js status
```

## 4. Shell aliases (recommended)

Add this to `.bashrc` / `.zshrc`:

```bash
DXE_HOME="$HOME/work/AskOS-workspace/DxE-suite"
alias dxe="node $DXE_HOME/bin/dxe.js"
alias dve="node $DXE_HOME/dve/kit/dist/cli/dve-tool.js"
alias dre-engine="node $DXE_HOME/dre/kit/engine/engine.js"
alias dve-serve="dve serve --watch"
alias dve-build="dve build"
alias dve-scan="dve scan"
alias dve-status="dve status"

# Convenience one-liners
dxe-install() {
  node "$DXE_HOME/bin/dxe.js" install --yes \
    && node "$DXE_HOME/dre/kit/engine/engine.js" init 2>/dev/null
}
dve-up() {
  npx tsc -p "$DXE_HOME/dve/kit/tsconfig.json"
  dve build
  (cd "$DXE_HOME/dve/app" && npx vite build)
  dve serve --watch
}
```

## 5. Enabling hooks in Claude Code

The `dxe install` step writes:

- `.claude/settings.json` — registers PostToolUse + Stop + commit-msg
  hooks (see [ADR-0001](decisions/0001-remove-stop-llm-prompt-hook.md) for
  why the LLM-prompt variant of Stop is not there).
- `.dre/hooks/*.sh` — the actual hook scripts.

Claude Code picks these up automatically from `.claude/settings.json`.
If a hook fails, both PostToolUse and Stop now have an error fallback
(`… 2>/dev/null || true` / `|| echo '{"ok": true}'`), so a broken hook
does not block your session — it only drops the check for that one turn.

## 6. Enabling Slack notifications

```bash
export DRE_NOTIFY_URL="https://hooks.slack.com/services/..."
```

…and in `.dre/dre-config.json`:

```json
{
  "notifications": {
    "channel": "slack",
    "min_level": "critical"
  }
}
```

Levels: `critical` (enforcement violations, Stop blocks, DD overturns) /
`daily` (pending decisions, orphan Gaps, drift) / `info` (graph stale,
build done).

For the DVE Slack **bot** (slash commands, interactive buttons), see
[slack-setup.md](slack-setup.md).

## 7. Next

- [Architecture](architecture.md) — what lives where, and why
- [CHANGELOG](../CHANGELOG.md) — what changed, when, and why
- [Migrating from dde-toolkit](migration-from-dde-toolkit.md) — if you
  have an existing DDE setup
- [ADR index](decisions/) — recorded decisions
