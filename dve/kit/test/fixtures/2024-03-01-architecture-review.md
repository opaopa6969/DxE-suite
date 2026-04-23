# Architecture Review Session

- Date: 2024-03-01
- Theme: Architecture review for module structure
- Characters: Alice, Bob, Charlie
- Flow: deep-dive
- Structure: roundtable

## Gap 発見: Module coupling is too high

→ Gap 発見: need to decouple parser from renderer

## Gap Table

| # | Summary | Location | Severity |
|---|---------|----------|----------|
| 1 | Parser tightly coupled | parser/ | High |
| 2 | No abstraction layer | core/ | Medium |
