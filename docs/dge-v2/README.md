[日本語版はこちら / Japanese](README.ja.md)

# AskOS — Portfolio Orchestration Platform

A multi-project agent orchestration platform where AI coding agents work autonomously while a human operator supervises through a unified dashboard. When the system reaches a point that requires human judgment — architectural choices, priority conflicts, ambiguous requirements — it **asks**.

> **Why "Ask"?** The name refers not just to the question queue, but to the design principle that runs through every layer of the platform: human judgment enters the system through structured touch points. Workflow escalations, Commander triage, human decision steps, directives — they all converge on the same idea. The machine does what it can; when it can't, it asks.

## What AskOS Does

```
Human Operator
  ├─ Web Dashboard (React)          ← questions, tasks, agents, documents
  ├─ AI Terminal (Claude Code)      ← bottom panel, auto-launched
  └─ Slack (planned)
        │
  Orchestrator API (Express, 48+ endpoints)
        │
  ┌─────┴──────────────────────────────────────────────┐
  │                                                    │
  Portfolio Commander     Project Commanders            │
  (cross-project          (per-project triage,          │
   coordination)           spec/decision matching)      │
        │                        │                      │
        │              ┌─────────┼─────────┐            │
        │              Impl      Reviewer   Adopted     │
        │              Agent     Agent      Agent       │
        │                   │                           │
  Workflow Engine            Runtime Adapter (tmux)      │
  (contract-based            ├─ stdout-watcher          │
   step execution,           ├─ inbox delivery          │
   YAML definitions)         └─ session lifecycle       │
        │                                               │
  DGE Workflow (planned)                                │
  (dialogue → spec discovery)                           │
  └────────────────────────────────────────────────────┘
```

## Key Features

**Question-driven orchestration** — Agents escalate decisions as structured questions with priority and staleness tracking. A 6-rule Commander triage system auto-resolves what it can; the rest reaches the human.

**Workflow Engine** — Contract-based step execution from YAML definitions. Steps declare what they produce (JSON Schema), and the engine validates outputs before routing to the next step. Human decision steps, retry with feedback, escalation to AskOS questions, and four intervention types (pause / inject / redirect / interject).

**Agent lifecycle** — Register, start, stop, restart agents via API. Adopt external tmux coding agents (Claude Code, Codex, Gemini, Aider) into AskOS management. Heartbeat monitoring and automatic dead agent detection.

**Portfolio & project management** — Group related projects into portfolios. Project dependencies with on-change actions. Phase system (spec / implementation / stabilization / maintenance) with Commander enforcement.

**AI Terminal** — Persistent bottom panel on all pages. Auto-launches Claude Code with project context. Onboarding guide for new projects.

**Recovery** — Startup recovery job, stale question detector, heartbeat monitor, watcher auto-reconnect. The system self-heals across restarts.

**Decision capture** — Every human answer is automatically appended to the project's decision log. Commander can reference past decisions for future auto-resolution.

**Metrics & visibility** — Attention heatmap, Commander effectiveness metrics, return-from-absence summary, GTD-style action list, system diagnostics.

## Quick Start

```bash
npm install
npm run dev          # API server → http://localhost:3000
npm run dev:web      # Web UI (dev mode) → http://localhost:5173
npm test             # 156 tests across 13 suites
```

## Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| Schema | Zod, Ajv | Entity validation (Zod), workflow schema validation (Ajv), ID strategy (ULID) |
| Database | SQLite (better-sqlite3, WAL) | Persistent state, event log, read models |
| Orchestrator | TypeScript | Command handlers, Commander triage, delivery, decision capture |
| Workflow Engine | TypeScript, js-yaml | YAML loader, 10 semantic validators, 6-step extraction, contract execution |
| Recovery | TypeScript | Stale detection, heartbeat monitor, startup recovery |
| API | Express | 48+ REST endpoints |
| Web UI | React + Vite | Dashboard, question queue, task board, agent management, AI terminal |
| Runtime | tmux | Agent session management, stdout-watcher, inbox delivery |

## Implementation Status

| Slice | Status | Description |
|-------|--------|-------------|
| A — Question Loop | Complete | Schema, DB, orchestrator, agent protocol, Commander triage |
| B — Commander | Complete | 6 rules, data-driven config, context assembly, decision auto-capture |
| C — Dashboard | Complete | React SPA, dark theme, 8 pages, i18n (EN/JA) |
| D — Recovery | Complete | Startup job, stale checker, heartbeat monitor |
| E — Workflow Engine | Complete | YAML loader, semantic validation, contract execution, AskOS bridge |
| F — Agent Management | Complete | Start/stop/restart, adopt/release, auto-assignment, agent-to-agent handoff |
| G — Orchestration | Complete | Route decomposition, async workflow, phase enforcement, terminal commands |
| H — Async Workflow | In Progress | Job queue-based execution (current: synchronous) |
| I — LLM Triage | Planned | LLM-augmented Commander (flag exists, logic not implemented) |

156 tests passing across 13 suites. 48+ API endpoints.

## Project Structure

```
src/
├── api/                       # REST API (Express, 12 route files)
├── config/defaults.ts         # Operational defaults
├── db/                        # SQLite connection + repositories
├── maintenance/               # Stale checker, heartbeat, startup recovery
├── orchestrator/
│   ├── commander/             # Triage rules + context assembly
│   ├── commands/              # openQuestion, answerQuestion, etc.
│   ├── delivery/              # Inbox file writer + tmux send-keys
│   └── workflow/              # Workflow engine (loader, validator, executor)
└── runtime/                   # Agent protocol (stdout parser, inbox, adopt)
packages/
├── schema/                    # Zod entity definitions
└── web/                       # React dashboard (Vite)
docs/                          # Specification + ADRs
askos-stories/                 # DGE dialogue scripts (22 stories, 108 UCs)
specs/workflow-engine/         # Workflow engine spec (independent package)
```

## Documentation

### Core
- [Vision](docs/vision.md) — Why this platform exists
- [Architecture](docs/architecture.md) — System design, subsystem boundaries
- [Current Capabilities](docs/current-capabilities.md) — Detailed feature inventory with API reference
- [Domain Model](docs/domain-model.md) — Entities, fields, invariants
- [Data Model](docs/data-model.md) — Relational schema, ID strategy

### Workflow Engine
- [Workflow Engine README](specs/workflow-engine/README.md) — Contract-based execution spec
- [Step Model](specs/workflow-engine/docs/step-model.md) — who / given / produces / allows / routing
- [Contract Verification](specs/workflow-engine/docs/contract-verification.md) — Validation pipeline
- [AskOS Integration](specs/workflow-engine/docs/integration-askos.md) — Escalation, task binding

### Operational
- [Question Lifecycle](docs/question-lifecycle.md) — States, triage, stale policy
- [Agent Protocol](docs/agent-protocol.md) — stdout markers, inbox delivery
- [API Surface](docs/api-surface.md) — REST endpoint design

### DGE (Dialogue Grounding Engineering)
- [AskOS Stories](askos-stories/README.md) — 22 dialogue scripts that discovered 108 use cases
- [Spec Gaps from Stories](docs/spec-gap-from-stories.md) — Gaps discovered through DGE

### Decisions
- [ADR-005: Commander Model](docs/decisions/ADR-005-commander-model.md) — Triage rules, context assembly
- [ADR-006: Transaction Model](docs/decisions/ADR-006-transaction-model.md) — Single-tx write pattern
- [ADR-007: ID Strategy](docs/decisions/ADR-007-id-strategy.md) — ULID with entity prefix

### Planning
- [Backlog](docs/backlog.md) — Prioritized backlog with completion status
- [Implementation Status](docs/implementation-status.md) — Per-slice implementation details

## How AskOS Was Built

AskOS's own specification was developed using Dialogue Grounding Engineering (DGE) — a method where LLM-generated user dialogue scripts reveal specification gaps that formal reviews miss. Five rounds of spec review (v2→v7) found ~20 issues. A single DGE session found 108 use cases and 97 spec implications.

> **spec レビューを何回しても見つからなかったことが、会話劇 10 分で出てきた。**
> (What five rounds of spec review couldn't find, a 10-minute dialogue script revealed.)

## Version History

- **v0.3.0**: Route decomposition, async workflow, task auto-assignment, agent handoff, adopt, phase enforcement, terminal commands, agent GUI dashboard
- **v0.2.0**: tmux runtime, workflow engine, directive system, decision auto-capture, attention heatmap, AI terminal, dark theme, i18n
- **v0.1.0**: Question loop, Commander triage, React dashboard, recovery subsystem

## License

Private
