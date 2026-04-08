# DDE toolkit — Document Deficit Extraction

[English](README.md) | [日本語](README.ja.md)

> Extract all terms, generate articles everyone can understand, auto-link.

## Quick Start

Just talk to Claude Code:

```
--- Basic ---
"Run DDE"                          → ⚡ Select docs → extract → generate articles
"DDE on README.md"                 → Target a specific file

--- CLI (no LLM needed) ---
npx dde-link README.md             # Embed links in document
npx dde-link README.md --check     # CI: detect missing links (exit 1 on fail)
npx dde-link README.md --dry-run   # Preview changes (no overwrite)

--- Maintenance ---
"Update DDE"                       → Toolkit update guide
```

## DDE Flow

```
1. Select   — Choose the document group (confirm exclusions)
              Default excluded: dde/, dge/, node_modules/
                ↓
2. Context  — Who reads this? (used to tune article tone, NOT an extraction filter)
                ↓
3. Length   — Set article length (short / medium / long)
                ↓
4. Extract  — Extract ALL terms from the document group (no level filter)  ✦ LLM
              ↓ Review the term list, exclude unwanted terms
5. Articleize — Generate 1 file · 3 sections per term                      ✦ LLM
              → docs/glossary/<term>.md
                ↓
6. Link     — dde-link embeds links in the same document group             ✦ CLI
              → [term](docs/glossary/xxx.md)  (relative paths)
```

## Article Format — educational narrative

Specify **intent**, not character count:

| Intent | Description |
|---|---|
| `educational` | Reader understands the why, the how, and the context. Includes analogies, diagrams, motivation (default) |
| `reference` | Concise definition + usage. Quick lookup |
| `deep-dive` | Implementation details, code examples, edge cases |
| free text | e.g. "write so a new hire understands the business context" |

```markdown
# JWT

## In a nutshell
A small envelope that safely carries your login information.

---

## The passport analogy
When you go through customs, you show your passport...

---

## Why JWT instead of sessions?
Comparison with session-based auth... (ASCII diagram)

---

## How it's used in this project
volta-auth-proxy generates a JWT and injects it into headers...

---

## Step-by-step example
1. User logs in
2. Server generates JWT...

---

## Learn more
- [OAuth 2.0](oauth2.md) — used in the JWT issuance flow
- [Session management](session-management.md) — comparison with JWT
```

## How dde-link Works

```
1. Scans docs/glossary/ for .md filenames → infers terms
   jwt.md → ["JWT", "jwt"]
   session-management.md → ["session management", "Session Management"]

2. Overrides with dictionary.yaml (adds Japanese terms, aliases)

3. Longest-match-first, once per paragraph → replaces with [term](docs/glossary/xxx.md)

Skips: code blocks / inline code / headings / existing links
```

## Install

```bash
npm install @unlaxer/dde-toolkit
npx dde-install
```

Folder structure after install:

```
dde/
├── method.md              ← DDE methodology
├── flows/
│   └── quick.yaml         ← Flow definition
├── bin/
│   └── dde-tool.js        ← CLI tool
├── sessions/              ← Session output (auto-saved)
└── version.txt
docs/
└── glossary/              ← Glossary articles (1 file · 3 sections per term)
    ├── jwt.md
    ├── jwt.ja.md
    └── dictionary.yaml    ← Japanese/alias term mappings (optional)
.claude/
└── skills/
    ├── dde-session.md
    └── dde-update.md
AGENTS.md / GEMINI.md / .cursorrules
```

## Relationship to DGE

```
D*E Series:
  DGE — Design-Gap Extraction       → finds holes in design (dialogue drama)
  DDE — Document-Deficit Extraction → finds holes in documentation (LLM + CLI)
```

## Proven at Scale

- 241 glossary articles (120 EN + 121 JA)
- 334 clickable links in README
- 3-level reader coverage

## License

MIT License.
