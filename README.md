# DGE — Dialogue-driven Gap Extraction

[日本語](README.ja.md)

> **Plain AI reviews what you wrote. DGE finds what you forgot to write.**
> Characters argue about your design — one questions assumptions, another guards quality, a third says "do we even need this?" — and in between their arguments, gaps emerge. 3 gaps in 2 minutes. The kind that change your architecture.

## Demo

![DGE demo](docs/demo/demo-en.gif)

▶ [Full demo (EN, HQ)](docs/demo/demo-en-hq.mp4) · [Story demo (EN)](docs/demo/demo-v3-story-en.mp4) · [日本語版](docs/demo/demo-ja-hq.mp4)

## What You Can Do

**🎭 Find design gaps through dialogue**
Say "run DGE" to start. Characters debate your design and surface undocumented assumptions, hidden constraints, and overlooked considerations.

**📋 Convert Gaps to Specs**
Say "implement" to auto-generate Use Cases / Tech Specs / ADRs / Design Questions. Review, then implement.

**🔄 Auto-iterate until convergence**
Say "run until ready to implement" for auto-iteration. DGE runs repeatedly with different angles until no new Critical/High gaps emerge.

**📁 Manage as projects**
Multiple DGE themes organized in TreeView. See progress at a glance.

**🎭 Add any character you want**
Say "add Guts from Berserk" to permanently add a famous character. LLM analyzes personality, quotes, and trauma.
Wizard mode lets you create original characters through Q&A.

**🔀 Auto-merge DGE + plain LLM**
By default, runs a plain LLM review in the background alongside dialogue. Merges DGE's deep insights with plain's comprehensive checklist. Isolated subagent, bias-free.

**⚙ Customize the flow**
3 flows: ⚡ quick (instant dialogue), 🔍 design-review (with Spec generation), 💡 brainstorm (idea divergence).
Flow YAML lets you change extraction types, artifacts, and actions. Applicable to fiction, decision-making, and more.

**🔧 API Server + CLI tool (optional)**
Character management + axes-vector recommendation engine. `dge-tool` CLI enforces MUST rules via code.

## DGE in 3 Minutes — Explained via Dialogue

> Senpai (Narrator): Let's explain DGE using its own characters.

**👤 Columbo**: "Just one more thing... what does DGE actually do?"

**☕ Holmes**: "`npm install @unlaxer/dge-toolkit`, then `npx dge-install`. Tell Claude Code 'run DGE' and you're done. Boring setup, I know."

**👤 Columbo**: "And what comes out?"

**🎩 Picard**: "A structured dialogue where characters debate your design. 'Gaps' — problems not written in the spec — emerge along the way."

**👤 Columbo**: "My wife was asking me... what happens once gaps are found?"

**☕ Holmes**: "Four choices. Run DGE again, auto-iterate until convergence, implement, or save for later."

**👤 Columbo**: "And 'implement'?"

**🎩 Picard**: "No jumping to code. Specs are auto-generated from gaps first — Use Cases, Tech Specs, ADRs. Human review is mandatory. This crew does not cut corners."

**👤 Columbo**: "One more thing... I heard you can add any character?"

**☕ Holmes**: "'Add Guts from Berserk' and the LLM analyzes personality, quotes, backstory — saved permanently. Originals too, through a wizard. Mildly interesting."

**⚖ Saul**: "Important: DGE Specs are *proposals*. If your project has `docs/`, that's the Source of Truth. DGE writes only inside `dge/`. Let's just say... I know a guy who lost his docs to an overeager tool."

→ **Summary**: Dialogue → Gaps → Specs → Review → Implement. Custom characters for more angles. Projects for tracking.

## Results

- **unlaxer-parser**: 5 sessions, 108 gaps discovered
- **AskOS**: 11+ sessions, 14,978 lines of design documents, 16 gaps from adversarial review

## Installation

### npm

```bash
npm install @unlaxer/dge-toolkit
npx dge-install
```

### Update

```bash
npm update @unlaxer/dge-toolkit
npx dge-update    # overwrites toolkit files only. sessions/ custom/ projects/ specs/ untouched
```

### Manual copy (no npm required)

```bash
cp -r kit/ your-project/dge/
cp kit/skills/*.md your-project/.claude/skills/
```

MIT licensed. Keep `dge/LICENSE` in your project.

### Multi-tool Support

DGE works with multiple AI coding tools:

| Tool | Config file | How it works |
|------|------------|--------------|
| Claude Code | `.claude/skills/dge-session.md` | Full skill with auto-trigger |
| Codex (OpenAI) | `AGENTS.md` | DGE section auto-appended |
| Gemini CLI | `GEMINI.md` | DGE section auto-appended |
| Cursor | `.cursorrules` | DGE section auto-appended |

All config files are generated automatically by `npx dge-install`. If AGENTS.md, GEMINI.md, or .cursorrules already exists, the DGE section is appended without touching existing content.

## Usage

| Command | Description |
|---------|-------------|
| "Run DGE" | Generate dialogue, find gaps |
| "Run DGE in detail" | Design-review mode with templates + patterns |
| "Brainstorm this" | Idea divergence with Yes-and dialogue |
| "Run until ready to implement" | Auto-iteration (until convergence) |
| "Add a character" | Create custom character (named or wizard) |
| "Update DGE" | Check version, update guidance |

For other LLMs (ChatGPT, Gemini, etc.), see Quick Start (Method A) in [method.md](kit/method.md).

## Character Quick Reference

```
Shaky assumptions  → 👤 Columbo       "Just one more thing..."
Low quality        → 🎩 Picard        "Make it so" (only when worthy)
Over-complicated   → ☕ Holmes        "Boring! Eliminate the unnecessary"
Moving too fast    → 😰 Charlie Brown "Good grief... can we make this smaller?"
Not bold enough    → 👑 Steve Jobs    "Think different. Ship it."
Numbers don't add  → 🦅 Gekko         "Greed is good. Show me the numbers."
Corporate politics → 👔 Don Draper    "Let me handle the room"
Attack resilience  → 😈 Red Team      "What if a competitor does this?"
Legal risk         → ⚖ Saul          "Let's just say I know a guy"
Missing impl       → ⚔ Hartman       "What is your major malfunction?"
User truth         → 🎰 Durden        "You are not your framework"
Hidden problems    → 🏥 House         "Everybody lies"
Not understood     → 🧑‍🏫 Mr. Rogers   "Let's think about this together"
Bad UX             → 🎨 Jony Ive      "Does it feel inevitable?"
No measurement     → 📊 Beane         "What does the data say?"
Chaos              → 🤝 Kouhai        "Let's be constructive"
Too complex        → 🪄 Tyson         "Imagine you're..."
Small contradiction→ 🕵 Monk          "Something's not right here"
Fixed thinking     → 🎭 Socrates      "Why do you think so?"
+ Custom 🎭 "Add Guts from Berserk" to add any character
```

Japanese character set also available — see [characters/index.md](kit/characters/index.md). Locale auto-detected from input language.

## Dialogue Patterns — 20 Patterns + 5 Presets

| Preset | Patterns | Use Case |
|---|---|---|
| 🆕 new-project | zero-state, role-contrast, escalation-chain | New projects |
| 🔧 feature-extension | before-after, cross-persona-conflict, expertise-contrast | Adding features |
| 🚀 pre-release | scale-break, security-adversary, concurrent-operation, disaster-recovery | Pre-release |
| 📢 advocacy | before-after, app-type-variation, role-contrast | Internal advocacy |
| 🔍 comprehensive | 7 patterns | Thorough DGE |
| 🔥 hotfix | escalation-chain, disaster-recovery, drift-detection | Incident response |
| 🤝 onboarding | zero-state, expertise-contrast, return-after-absence | New member |
| 💰 monetization | role-contrast, scale-break, cross-persona-conflict | Pricing/BM |
| 🧹 tech-debt | drift-detection, before-after, convergence-test | Refactoring |

See [kit/patterns.md](kit/patterns.md) for details.

## API Server (optional)

Character management + axes-vector recommendation engine.

```bash
cd server && npm install && npm start
# → http://localhost:3456
```

See [server/README.md](server/README.md) for details.

## Documentation

| File | Contents |
|------|----------|
| [method.md](kit/method.md) | Full methodology (3-min TL;DR + details + quick start) |
| [patterns.md](kit/patterns.en.md) | 20 patterns + 9 presets |
| [characters/index.en.md](kit/characters/index.en.md) | 19 English characters + recommended combos |
| [characters/atlas.md](characters/atlas.md) | Cross-cultural mapping (EN/JP/CN) |
| [integration-guide.md](kit/integration-guide.en.md) | Existing workflow integration guide |
| [INTERNALS.md](kit/INTERNALS.en.md) | Internal architecture (flow, dataflow, state diagrams + hooks) |
| [CUSTOMIZING.md](kit/CUSTOMIZING.en.md) | Customization guide (Level 1/2/3 + fork howto) |
| [flows/design-review.yaml](kit/flows/design-review.yaml) | Default flow definition |
| [templates/](kit/templates/) | Theme templates (5 types) |
| [DISCLAIMER.md](DISCLAIMER.en.md) | Disclaimers & IP notes |
| [PUBLISHING.md](PUBLISHING.md) | npm maintainer guide |
| [paper/](paper/) | Academic papers (includes fictional review dialogues) |

## File & Folder Lifecycle

What gets created, when, and who owns it.

### After `npx dge-install`

```
dge/
├── characters/     ← copied from kit/  (overwritten by dge-update)
├── flows/          ← copied from kit/  (overwritten by dge-update)
├── templates/      ← copied from kit/  (overwritten by dge-update)
├── bin/            ← copied from kit/  (overwritten by dge-update)
├── method.md       ← copied from kit/  (overwritten by dge-update)
├── patterns.md     ← copied from kit/  (overwritten by dge-update)
├── sessions/       ← created empty     (yours — never overwritten)
├── specs/          ← created empty     (yours — never overwritten)
├── custom/
│   └── characters/ ← created empty     (yours — never overwritten)
├── version.txt     ← installer writes  (read by dge-update)
└── .lang           ← installer writes  (read by dge-update)

.claude/skills/
├── dge-session.md          ← copied from kit/  (skipped if exists)
├── dge-update.md           ← copied from kit/  (skipped if exists)
└── dge-character-create.md ← copied from kit/  (skipped if exists)

AGENTS.md / GEMINI.md / .cursorrules ← DGE section appended (or created)
```

### During a DGE session

| Trigger | What gets created |
|---|---|
| Session starts | reads `dge/method.md`, `dge/characters/index.md`, `dge/flows/*.yaml` |
| Session ends | `dge/sessions/YYYY-MM-DD-<theme>.md` |
| "implement" selected | `dge/specs/UC-*.md`, `dge/specs/TECH-*.md`, `dge/specs/ADR-*.md` |
| "add a character" | `dge/custom/characters/<name>.md` |

### After `npx dge-update`

Overwrites: `characters/`, `flows/`, `templates/`, `bin/`, `method.md`, `patterns.md`

Never touches: `sessions/`, `specs/`, `custom/`, `version.txt`, `.lang`

## License

MIT
