# ADR-0001 — Remove the Stop(LLM prompt) hook

- **Status**: Accepted
- **Date**: 2026-04-08
- **Commit**: `438aa23` — *fix: LLM prompt Stop hook を削除 — command hook のみに*
- **Superseded version**: 4.1.0 (original prompt shipped in 29cb1f7, simplified in 3beb67f, removed in 4.2.0)
- **Supersedes**: —
- **Superseded by**: —

## Context

Claude Code's `Stop` hook supports two variants:

1. **`type: "command"`** — run a shell script; stdout is parsed as JSON.
2. **`type: "prompt"`** — re-enter the LLM with a fixed prompt, and
   interpret its textual response as JSON.

Between DxE-suite 4.1.0 and 4.2.0 we ran both:

- A command hook (`stop-check.sh`) that statically checked
  - whether `gap_extraction` was active without a saved session,
  - whether there were pending decisions,
  - whether `graph.json` was stale;
- **And** a prompt hook that asked the LLM to audit the full
  conversation for *implicit* decision statements that never made it
  into a DD file (patterns like「にしよう」「を採用」「却下」「で行く」
  「OK」「よろしく」「やろう」after a proposal).

The prompt hook was the one that could *see* conversational decisions
the static script could not detect.

### What went wrong

The LLM-prompt variant of the Stop hook consistently failed its JSON
contract:

- Prose preamble before the JSON object.
- Trailing commentary after the JSON object.
- Markdown fences (`\`\`\`json`) wrapping the JSON.
- Occasional refusal messages that were clearly not JSON at all.

Claude Code's hook runner expected **pure JSON**. Anything else produced
a validation error, which showed up to the user as *"Stop hook failed:
JSON validation failed."* — and because Stop hooks can **block** the
session from concluding, the user experience was that DxE-suite was
randomly interrupting their work.

We attempted two mitigations:

1. **Prompt hardening** (`3beb67f` — *"Stop hook LLM prompt を簡潔化 —
   JSON validation failed 対策"*). We shortened the prompt, capitalised
   "RESPOND WITH ONLY A JSON OBJECT. NO OTHER TEXT.", and narrowed the
   expected shape. It reduced but did not eliminate the errors.
2. **Downstream parsing**. We considered post-processing the prompt hook
   output to strip prose. Rejected: it is fragile, it masks real hook
   failures, and it would still leave the UX ("did the LLM say no, or
   did we parse garbage?") ambiguous.

## Decision

**Remove the Stop(LLM prompt) hook entirely.** Rely on the command hook
`stop-check.sh` for all Stop-time checks. Also:

- Add an **error fallback** to both PostToolUse and Stop so hook failure
  never blocks a session:
  - PostToolUse: `bash .dre/hooks/post-check.sh 2>/dev/null || true`
  - Stop: `bash .dre/hooks/stop-check.sh 2>/dev/null || echo '{"ok": true}'`

## Consequences

### Positive

- **Stop hook failures disappear**. The command hook returns proper JSON
  by construction — it is a shell script we wrote.
- **Session UX is no longer interrupted** by the hook's own bugs.
- **PostToolUse failures are no longer blocking** — if
  `post-check.sh` crashes, we silently drop the check instead of halting
  the tool call.
- **One source of truth** for Stop-time logic (`stop-check.sh`).

### Negative

- **Implicit-decision detection becomes weaker.** The command hook can
  flag *structural* issues (no session file, stale graph) but it cannot
  read the conversation the way the LLM prompt could. Decisions that
  only appear in dialogue may be missed.
- The fallback **masks genuine bugs** in our hook scripts. If
  `post-check.sh` is broken, nothing will tell the user — they will just
  silently lose the check. We accept this trade-off because a broken
  hook blocking the session is worse.

### Mitigations

- Implicit decisions are still captured at two other points:
  - **PostToolUse** examines every Write/Edit for DD-worthy patterns
    (0305a01, 84af700).
  - **DVE `discover-decisions.sh`** can be run at any time to retro-scan
    conversation logs (see [README.md](../../README.md#recovery-scripts)).
- Operators who want the LLM-prompt audit back can re-enable it locally
  by editing `.claude/settings.json` — the infrastructure still supports
  it.

## Alternatives considered

- **Keep the LLM prompt hook and add prose-stripping.** Rejected — see
  above.
- **Replace the LLM prompt hook with a dedicated sidecar process that
  calls Claude's API and guarantees JSON.** Deferred — not worth the
  operational cost for a check that has a reasonable static fallback.
- **Replace the hook with a batch scan** (`discover-decisions.sh`) run
  manually at the end of a session. Partially adopted — this is the
  recommended workflow now, but it is operator-driven, not automatic.

## References

- Commit `438aa23` — removal.
- Commit `3beb67f` — earlier prompt simplification attempt.
- Commit `29cb1f7` — original introduction of the LLM-prompt Stop hook.
- `dre/kit/hooks/stop-check.sh` — the surviving command hook.
- `dve/kit/scripts/discover-decisions.sh` — manual-replacement workflow.
