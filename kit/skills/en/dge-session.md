<!-- DGE-toolkit (MIT License) -->

# Skill: DGE Session

## Trigger
"run DGE" "wall-bounce" "find gaps" "brainstorm" "give me ideas" "iterate until implementable"

## MUST (3 rules. Follow these only.)
1. **Save the dialogue unconditionally.** Don't ask the user.
2. **Output a list (Gaps / Ideas).**
3. **Show numbered choices after the list. Never omit.** Don't ask "which Gap to fix?" — show numbered options.

## Steps

### Step 0: Flow + Structure detection
Read YAMLs in `dge/flows/` first; if unavailable, fall back to `kit/flows/` to determine flow and structure.

**Flow detection:**
- "run DGE" only → quick
- Template/pattern/"detailed"/"Spec" → design-review
- "brainstorm"/"ideas" → brainstorm
- No YAML → fall back to quick.

**Structure auto-selection (from theme keywords):**
- "review"/"paper"/"peer review" → ⚖ tribunal (review play)
- "attack"/"security"/"penetration" → ⚔ wargame (war game)
- "pitch"/"investment"/"Go/No-Go"/"business" → 💰 pitch (VC pitch)
- "diagnose"/"specialist"/"consult" → 🏥 consult (case conference)
- "incident"/"outage"/"postmortem"/"retrospective" → 🔥 investigation
- None of the above → 🗣 roundtable (standard DGE)

**User notification (required):**
When a structure is auto-selected, announce at session start:
```
Structure: ⚔ Wargame (auto-selected from security theme)
  Phase 1: Red Team writes attack plans
  Phase 2: Blue Team responds with defense plans
  Phase 3: Unaddressed attacks extracted as Gaps
Change? (can switch to roundtable)
```
Show the structure in 3 lines and let the user change it.

### Step 0.5: Phase 0 — Project context collection
After theme is clear (or even for bare "run DGE"), auto-read:
- `README.md` (project overview)
- Design docs in `docs/` (if present)
- Directory structure (`tree -L 2` equivalent)
- `package.json` / `go.mod` / `Cargo.toml` etc. (dependencies)
- Recent `git log --oneline -10` (recent context)
**Purpose**: Ground characters in project facts instead of speculation.
If input is thin, ask: "No design docs found. Can you describe the theme in more detail?"

### Step 1: Load
- **locale**: English input → en, Japanese input → ja. Flow YAML `locale` overrides if present
- Built-in index (names + recommendations only): en tries `dge/characters/index.en.md` first, then `kit/characters/index.en.md`; ja tries `dge/characters/index.md` first, then `kit/characters/index.md`
- Patterns: prefer `dge/patterns.md`; if unavailable, use `kit/patterns.en.md` for en or `kit/patterns.md` for ja
- Method: prefer `dge/method.md`; if unavailable, use `kit/method.en.md` for en or `kit/method.md` for ja
- If `dge/custom/characters/*.md` exists, read only the Prompt Core section from each file
- Check flow YAML must_rules, auto_merge
- Use `node dge/bin/dge-tool.js version`, or `node kit/bin/dge-tool.js version` if needed, or `npx dge-tool version` to detect tool mode (continue on failure)

### Step 2: Theme confirmation
If clear, proceed. If vague, dig deeper.

### Step 3: Template + Pattern (design-review only)
Skip for quick / brainstorm.

### Step 4: Character selection
Show recommended set plus any custom characters loaded in Step 1. quick: display only. design-review / brainstorm: wait for confirmation.
**After confirmation, read selected characters' individual files.** Built-in: use `dge/characters/{name}.md` for both locales; if `dge/` is unavailable, fall back to `kit/characters/{name}.md` for ja or `kit/characters/en/{name}.md` for en. Custom: `dge/custom/characters/{name}.md`

### Step 5: Dialogue generation
Narrator → Character dialogue → `→ Gap found:` or `→ Idea:` markers.
**Response obligation**: When Character A makes a point, another Character B must respond with agree/disagree/defer. No one-way drive-by critiques. Clashes between responses produce deeper Gaps.
**Evaluation axis**: Each character must critique along their `axis:` field, not just personality. Use the judgment criteria, not just the tone.
If auto_merge true, simultaneously launch isolated subagent (Agent tool, isolation: worktree) for plain LLM review in background.

### Step 6: Structuring
Add Category + Severity to Gaps. For brainstorm, classify ideas.

### Step 7: Save
Save to flow's output_dir. Use dge-tool save if available (otherwise Write tool).

### Step 8: Summary + Choices
Show Gap/Idea list. If auto-merge results available, show DGE-only / plain-only / both merge view.
If subagent failed, show DGE-only ("plain LLM fetch failed" in 1 line).
**Choices come from flow YAML post_actions.** Use dge-tool prompt if available.

### Step 9: Branch
Follow selection:
- **Run DGE again** → Show previous summary + TreeView (if project exists), go to Step 2
- **Auto-iterate** → Pattern rotation, max 5 rounds, converge when C/H Gaps = 0 → Step 10
- **Implement** → Step 10
- **Merge** → Only when auto_merge OFF. Launch isolated subagent
- **Later** → End

### Step 10: Spec generation (design-review only)
Consolidate C/H Gaps from all sessions on same theme → Generate UC/TECH/ADR/DQ/ACT to `dge/specs/`.

## First-time Onboarding
When the user says just "DGE" or "what is DGE" without a theme, show:

```
DGE toolkit v3.0.0 — Dialogue-driven Gap Extraction

Characters argue about your design to find what's NOT written in the spec.

📋 6 Session Structures:
  🗣 Roundtable    "run DGE" — characters discuss freely (default)
  ⚖ Tribunal       "review this" — independent evaluation → rebuttal → synthesis
  ⚔ Wargame        "attack this" — attack plan → defense plan → judge
  💰 VC Pitch       "pitch this" — pitch → Q&A → investment decision
  🏥 Case Conference "diagnose this" — chief's findings → specialist consults → synthesis
  🔥 Investigation  "postmortem" — fact timeline → dept testimony → root cause

🎭 19 Characters (each with an evaluation axis)
⚡ 3 Modes: Quick / Design Review / Brainstorm
🔄 Auto-iterate: "iterate until implementable"

Usage:
  "run DGE on the auth API" → auto-selects structure based on theme
  "attack the auth API" → runs wargame structure

Details: `dge/method.md` (fall back to `kit/method.md` / `kit/method.en.md`), `dge/flows/*.yaml` (fall back to `kit/flows/*.yaml`)
```

## Notes
- 1 Scene: 3-5 exchanges, 1 Session: 3-5 Scenes
- If DGE Spec conflicts with existing docs → existing docs are authoritative
