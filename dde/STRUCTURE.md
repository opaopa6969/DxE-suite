# DDE-toolkit Structure

```
DDE-toolkit/
  README.md                    ← EN overview
  README.ja.md                 ← JA overview
  STRUCTURE.md                 ← this file

  kit/                         ← npm package (@unlaxer/dde-toolkit)
    package.json
    bin/
      dde-install.js           ← installer (copies to project)
      dde-tool.js              ← CLI tool
    flows/
      quick.yaml               ← quick document review
      full-review.yaml         ← comprehensive review
      glossary-build.yaml      ← glossary extraction + generation
      link-check.yaml          ← auto-linker pass
    templates/
      glossary-article.md      ← article template (expert)
      glossary-beginner.md     ← article template (beginner)
      glossary-grandma.md      ← article template (grandma)
      diagram-proposal.md      ← diagram suggestion template
      gap-report.md            ← reader gap report template
    skills/                    ← Claude Code skills
      dde-session.md           ← main skill (document review)
      dde-glossary.md          ← term extraction + article gen
      dde-linker.md            ← auto-link skill
      dde-update.md            ← toolkit updater
    config/
      reader-levels.yaml       ← reader level definitions
      linker-rules.yaml        ← auto-linker configuration

  docs/                        ← DDE's own documentation
    method.md                  ← DDE methodology
    philosophy.md              ← "Hell to write, heaven to read"

  examples/                    ← example outputs
    volta-auth-proxy/          ← real-world example from volta

  design-materials/            ← DGE sessions for DDE itself
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
