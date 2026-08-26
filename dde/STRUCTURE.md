# DDE Structure (`DxE-suite/dde/`)

This is the canonical DDE tree as of v4.2.0 (see the top-level
[README](README.md)). The former standalone `opaopa6969/DDE-toolkit` repo is
archived.

Legend: (empty) = directory exists but has no files · (planned) = referenced by
design docs but not yet in the repo.

```
dde/
  README.md                    ← EN overview
  README.ja.md                 ← JA overview
  STRUCTURE.md                 ← this file
  MIGRATION.md                 ← standalone → monorepo migration notes
  flows.md                     ← Mermaid flow diagrams

  kit/                         ← npm package (@unlaxer/dde-toolkit)
    package.json
    package-lock.json
    LICENSE
    method.md                  ← DDE methodology (the real location — no docs/method.md)
    version.txt
    agents-dde-section.md      ← AGENTS.md / GEMINI.md / .cursorrules snippet
    bin/
      dde-install.js           ← installer (copies to project)
      dde-link.js              ← auto-linker CLI (main entry: npx dde-link)
      dde-tool.js              ← MUST-enforcement CLI (save / prompt)
    lib/                       ← dde-link implementation
      linker.js                ← orchestrator
      dictionary.js            ← filename → term mapping
      markdown.js              ← Markdown AST handling
    flows/
      quick.yaml               ← quick document review (only flow implemented)
      # planned: full-review.yaml / glossary-build.yaml / link-check.yaml
    skills/                    ← Claude Code skills
      dde-session.md           ← main skill (extract → articleize → link)
      dde-update.md            ← toolkit updater
      # planned (not present): dde-glossary.md / dde-linker.md
    __tests__/                 ← unit tests (dictionary / linker / markdown)
    # planned (not present): templates/ — article style is derived from existing
    #                        glossary articles via the match_existing intent
    # planned (not present): config/ — reader-levels.yaml / linker-rules.yaml

  design-materials/            ← DGE sessions for DDE itself
  tasks/                       ← implementation task notes

  # planned (not present): docs/ and examples/ — DDE's own docs live in
  #   kit/method.md; there is no bundled example dataset (see "Proven at
  #   Scale" in README.md for the volta-auth-proxy source of the 241/334 numbers)
```

## Relationship to DGE

```
DGE-toolkit/   ← finds holes in DESIGN
DDE-toolkit/   ← finds holes in DOCUMENTATION
volta-auth-proxy/ ← first project to use both
```

Both are @unlaxer npm packages.
Both integrate with Claude Code as skills.
Both follow the same install pattern: `npx dde-install`.
