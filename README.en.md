# DGE — Dialogue-driven Gap Extraction

[日本語](README.md)

> "What 10 rounds of spec review couldn't find, 10 minutes of dialogue surfaced."

## What is DGE?

**DGE** carries two meanings:

- **Design-Gap Exploration** — exploring gaps in design (what it does)
- **Dialogue-driven Gap Extraction** — extracting gaps through dialogue (how it works)

Spec review verifies "what's written."
DGE discovers "what's not written."

Characters debate in a structured dialogue, surfacing undocumented assumptions, hidden constraints, and overlooked considerations.

## Results

- **unlaxer-parser** (SLE 2026 submission planned): 5 sessions, 108 gaps discovered
- **AskOS**: 11+ sessions, 14,978 lines of design documents generated, 16 gaps from adversarial review

## Installation

### npm

```bash
npm install @unlaxer/dge-toolkit
npx dge-install
```

Creates `dge/` folder and skill files in `.claude/skills/` in your project.

### Version update

```bash
npm update @unlaxer/dge-toolkit
npx dge-update    # overwrites toolkit files only. sessions/ and custom/ are never touched
```

Or tell Claude Code "update DGE" and the skill will guide you.

### Local install (before npm publish)

```bash
# From tarball
cd kit && npm pack && cd ..
npm install ./kit/unlaxer-dge-toolkit-1.0.0.tgz
npx dge-install

# Or from local path
npm install /path/to/DGE-toolkit/kit
npx dge-install
```

### Manual copy (no npm required)

```bash
cp -r kit/ your-project/dge/
cp kit/skills/*.md your-project/.claude/skills/
```

DGE-toolkit is MIT licensed. Keep `dge/LICENSE` in your project.

### npm package management

See [PUBLISHING.md](PUBLISHING.md) for versioning, publishing, and sync procedures.

## Usage

One line in Claude Code:

```
Human: "Run DGE on the auth API design"
```

For other LLMs (ChatGPT, Gemini, etc.), see the Quick Start (Method A) in [method.md](kit/method.md).

## Character Quick Reference

```
Shaky assumptions  → 👤 Imaizumi  "Did you actually ask anyone?"
Low quality        → 🎩 Sengoku   "This is an insult to the customer"
Over-complicated   → ☕ Yang      "Do we even need this?"
Moving too fast    → 😰 Boku      "Can we make this smaller...?"
Not bold enough    → 👑 Reinhard  "Attack."
Numbers don't add  → 🦅 Washizu  "What's the IRR?"
Attack resilience  → 😈 Red Team  "What if a competitor does this?"
Revenue reality    → 🦈 Owada    "How much does this make?"
Missing impl       → ⚔ Levi      "Dirty. Build it."
User truth         → 🎰 Tonegawa "Say it in the user's words"
Hidden problems    → 🏥 House    "Everybody lies"
Legal risk         → ⚖ Saul     "Did you write the ToS?"
```

For English-native character mappings (Columbo, Captain Picard, etc.), see [characters/atlas.md](characters/atlas.md).

## Recommended Combinations by Theme

```
API Design:        Imaizumi + Sengoku + Boku
Feature Planning:  Imaizumi + Yang + Boku
Security:          Sengoku + Red Team + House
Go/No-Go:         Imaizumi + Washizu + Boku
Incident Review:   Imaizumi + Sengoku + Red Team
```

## Imaizumi Method — 5 Types of Questions

| Type | Question | Discovers |
|------|----------|-----------|
| 1 | "In the first place..." | Unvalidated assumptions |
| 2 | "So basically..." | Essence / true nature |
| 3 | "Any other options?" | Hidden alternatives |
| 4 | "Who gets hurt?" | Unclear impact |
| 5 | "Wasn't this true before?" | Historical failure patterns |

## Documentation

| File | Contents |
|------|----------|
| [method.md](kit/method.md) | Full methodology (3-min TL;DR + details + quick start) |
| [characters/catalog.md](kit/characters/catalog.md) | 12 characters + prompts + usage guide |
| [characters/atlas.md](characters/atlas.md) | Cross-cultural mapping (EN/CN character equivalents) |
| [characters/custom-guide.md](characters/custom-guide.md) | How to create custom characters |
| [templates/](kit/templates/) | Theme templates (API design, feature planning, Go/No-Go, incident review, security) |
| [gap-definition.md](gap-definition.md) | Gap definition, classification, priority scoring |
| [quality-criteria.md](quality-criteria.md) | Output quality standards & checklists |
| [limitations.md](limitations.md) | Honest assessment of DGE limitations |
| [DISCLAIMER.md](DISCLAIMER.md) | Disclaimers & IP notes |
| [paper/](paper/) | Academic papers & experiment design (includes fictional review dialogues) |

## License

MIT
