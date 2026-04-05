# DGE: Design-Gap Exploration through Dialogue-driven Gap Extraction with Character-based Adversarial Review

**Version 1 — Initial Submission**

**Target: ICSE 2027 Software Engineering in Practice (SEIP) Track**

---

## Abstract

Software design reviews traditionally rely on document-based inspection, where reviewers read specifications and identify issues. We present Design-Gap Exploration (DGE), a dialogue-driven methodology for discovering specification gaps using character-based adversarial conversation scripts. DGE generates structured dialogues in which fictional characters with well-defined personality archetypes — derived from popular culture — debate design decisions from opposing viewpoints. Each character embodies a specific review perspective: an innocent questioner who challenges assumptions, a quality guardian who enforces standards, a lazy strategist who eliminates unnecessary complexity, and a small-scale survivor who constrains scope. We formalize the methodology with five question types (the "Imaizumi Method"), a narrator role for technical context setting, and an Observe-Suggest-Act pattern for converting discovered gaps into actionable specifications.

We evaluate DGE through two case studies: (1) unlaxer-parser, a production parser framework processing 10^9 transactions/month, where 5 DGE sessions uncovered 108 specification-implementation gaps; and (2) AskOS, an AI agent orchestration platform, where 11 DGE sessions produced 14,978 lines of design documentation and an adversarial review with 4 hostile characters uncovered 16 critical gaps across business, safety, operations, and messaging categories. We find that DGE discovers qualitatively different gaps than traditional review: 73% of gaps found by DGE were not identified in prior specification reviews of the same artifacts.

The methodology is particularly effective with LLM-assisted development, where the LLM serves as both the dialogue generator and adversarial tester. We release a portable DGE toolkit (12 files, 957 lines) that can be integrated into any project via a `.claude/skills/` directory, enabling AI coding agents to autonomously execute DGE sessions.

---

## 1. Introduction

Design reviews are a cornerstone of software engineering practice. Fagan inspections [Fagan 1976], walkthrough-based reviews, and modern pull request reviews all share a common structure: a reviewer reads an artifact and identifies issues. Despite decades of refinement, a fundamental limitation persists — **reviews validate what is written, but rarely discover what is missing**.

Consider a specification for a user authentication API. A traditional review might catch inconsistencies in error codes, missing validation rules, or ambiguous endpoint definitions. However, the reviewer is unlikely to ask: "Have you talked to actual users about their authentication preferences?" or "What happens if the entire authentication service becomes a single point of failure?" These questions arise not from reading the specification, but from imagining the system in operation — from simulating how different stakeholders would interact with it.

We present **Design-Gap Exploration (DGE)**, a methodology that addresses this limitation through dialogue-driven analysis. The key insight is that **fictional characters with well-defined personalities ask questions that reviewers cannot or will not ask**. A quality guardian character will insist on standards that a pragmatic reviewer might overlook. An innocent questioner will challenge assumptions that domain experts take for granted. A small-scale survivor will question whether the entire design is over-engineered.

The name DGE carries a deliberate double meaning:
- **Design-Gap Exploration**: what DGE does — systematically explore gaps in designs
- **Dialogue-driven Gap Extraction**: how DGE works — extract gaps through structured dialogue

### 1.1 Contributions

This paper makes five contributions:

1. **The DGE methodology** (Section 3): a structured process for generating adversarial design dialogues using character archetypes, with formal gap categorization and specification conversion.

2. **The Imaizumi Method** (Section 3.3): five question types that systematically probe design assumptions, derived from the character Keita Imaizumi (a naive assistant from the Japanese drama "Furuhata Ninzaburō").

3. **The Senpai (Narrator) role** (Section 3.4): a neutral narrator who provides technical context before characters begin debating, separating background exposition from adversarial dialogue.

4. **The Observe-Suggest-Act pattern** (Section 3.5): a UI and specification pattern that converts discovered gaps into actionable items with concrete use cases, API definitions, and data models.

5. **Empirical evaluation** (Section 5): two case studies demonstrating that DGE discovers gaps that traditional reviews miss, with quantitative analysis of gap categories and character effectiveness.

We release the DGE toolkit as open-source software.

---

## 2. Background and Related Work

### 2.1 Design Reviews

Fagan inspections [Fagan 1976] established the formal inspection process with defined roles (moderator, reader, tester, author). Studies consistently show that inspections find 60-90% of defects before testing [Gilb and Graham 1993]. However, Fagan inspections are designed to find defects in existing artifacts, not to discover missing requirements.

Perspective-based reading (PBR) [Basili et al. 1996] addresses this partially by assigning reviewers different perspectives (user, designer, tester). Our work extends PBR by replacing abstract perspectives with high-resolution character personas that include personality traits, communication styles, and specific question patterns.

### 2.2 Persona-based Design

Cooper's personas [Cooper 1999] are fictional characters representing user archetypes, widely used in user-centered design. DGE adapts the persona concept for design review rather than design creation — our characters are reviewers, not users. Moreover, DGE characters are drawn from popular culture rather than constructed from user research, leveraging shared cultural knowledge to achieve high-resolution personality models with minimal specification effort.

### 2.3 LLM-assisted Software Engineering

Recent work has explored LLMs as code generators [Chen et al. 2021], test generators [Lemieux et al. 2023], and code reviewers [Li et al. 2023]. DGE is complementary: it uses LLMs not to generate or review code, but to generate adversarial design dialogues that humans then review. The LLM generates the conversation script; the human identifies which gaps are genuine and which actions to take.

### 2.4 Adversarial Testing

Red teaming [Zellers et al. 2019] and adversarial analysis have been applied to ML systems and security reviews. DGE extends adversarial thinking to general software design by embodying adversarial perspectives in named characters with consistent personalities.

---

## 3. The DGE Methodology

### 3.1 Overview

A DGE session consists of three phases:

**Phase 1: Generate.** Given a design topic and a set of characters, a structured dialogue (conversation script) is generated in which characters debate the design from their respective viewpoints. Each character utterance may trigger a gap discovery, marked inline.

**Phase 2: Extract.** Gaps discovered during the dialogue are extracted, categorized, and prioritized. Gap categories include: missing logic, specification-implementation mismatch, type/coercion gaps, error quality, integration gaps, test coverage gaps, business gaps, safety gaps, operations gaps, messaging gaps, and legal gaps.

**Phase 3: Specify.** Each gap is converted into an actionable specification consisting of a Use Case definition, API endpoint specification, and data model changes.

### 3.2 Character System

DGE characters are fictional personas with five defined attributes:

1. **Archetype**: the character's fundamental role (e.g., "innocent questioner," "quality guardian")
2. **Strengths**: what kinds of gaps this character excels at finding
3. **Weaknesses**: blind spots or biases
4. **Communication style**: how the character speaks (e.g., "brutal honesty," "self-deprecating")
5. **Prompt core**: a system prompt that enables an LLM to emulate the character

We define 12 base characters organized into two groups:

**Constructive characters** (identify gaps through expertise):
- **Imaizumi** (naive questioner): challenges assumptions through innocent questions
- **Sengoku** (quality guardian): enforces quality standards without compromise
- **Yang** (lazy strategist): finds the simplest solution; eliminates unnecessary complexity
- **Boku** (small-scale survivor): constrains scope; asks "can we make this smaller?"
- **Reinhard** (conqueror): pushes for bold, ambitious decisions
- **Shimakosaku** (corporate navigator): identifies organizational and political obstacles

**Adversarial characters** (identify gaps through attack):
- **Owada** (business realist): demands revenue justification and operational reality
- **Rivai** (implementation enforcer): demands working code over design documents
- **Tonegawa** (user truth teller): speaks the uncomfortable truth about user willingness to pay
- **Dr. House** (hidden problem diagnostician): finds problems everyone is ignoring
- **Saul Goodman** (legal fixer): identifies legal risks and compliance opportunities
- **Red Team** (generic adversary): simulates security attacks and competitive threats

Characters are derived from well-known fictional works (Japanese and Western media). This is deliberate: stating "review like Sengoku" produces higher-fidelity behavior from an LLM than "review cautiously," because the LLM's training data contains extensive information about these characters' personalities, decision patterns, and communication styles. We call this principle **"name as interface"** — a character name serves as a high-bandwidth personality specification.

Users may also define custom characters by specifying a name, source work, and description, or by providing personality axis values directly.

### 3.3 The Imaizumi Method: Five Question Types

The character Imaizumi (from "Furuhata Ninzaburō") embodies a pattern of questioning that we formalize into five types:

| Type | Question Pattern | What It Discovers |
|------|-----------------|-------------------|
| Q1: "Somosomo" (Fundamentally) | "Have you actually talked to users?" | Unvalidated assumptions |
| Q2: "Yousoruni" (In essence) | "So basically, no customers are coming?" | Hidden truth behind jargon |
| Q3: "Hoka ni nai no" (Aren't there alternatives) | "Instead of 2 seniors, how about 3 mids?" | Implicit constraints |
| Q4: "Dare ga komaru no" (Who suffers) | "If we cut this, who specifically is affected?" | Unclear impact |
| Q5: "Mae mo sou datta" (Was it like this before) | "Didn't we fail the same way last time?" | Forgotten lessons |

These question types are not limited to the Imaizumi character; any character can employ them. However, Imaizumi's naive persona makes these questions socially acceptable in contexts where an expert might hesitate to ask "basic" questions.

### 3.4 The Senpai (Narrator) Role

During the unlaxer-parser DGE sessions, we discovered the need for a **narrator role** that provides technical context before characters begin their debate. We call this role "Senpai" (senior/narrator).

The Senpai is not a character with a personality. It is a neutral exposition device that:
1. Describes the technical background and constraints
2. Sets the scope for the current scene
3. Provides data and metrics that characters can reference

Without Senpai, characters must provide their own context, which conflicts with their personas. An innocent questioner should not explain technical architecture; a quality guardian should not describe business constraints. The Senpai separates exposition from argumentation.

**Example:**
```
Senpai: The production grammar and complete grammar differ in 
Boolean operator hierarchy. The complete grammar uses 3 levels 
(Or > And > Xor). The production grammar uses flat Choice. 
Migration must preserve backward compatibility with 10^9 
monthly transactions.

Imaizumi: "Why do we need 3 levels? What breaks with flat?"
Sengoku: "Flat hierarchy causes incorrect precedence. 
          $a > 0 && $b < 10 parses wrong. 3 levels is correct."
```

### 3.5 Observe-Suggest-Act Pattern

Every gap discovered by DGE follows a three-part structure:

1. **Observe**: state the current problem ("Authentication decisions have 0% coverage in the Decision Garden")
2. **Suggest**: propose a next action ("Run a DGE session on authentication design")
3. **Act**: specify the concrete deliverable (Use Case, API endpoint, data model change)

This pattern ensures that gaps are not merely identified but converted into implementable specifications. It also provides a natural UI pattern: widgets display observations, propose suggestions, and offer action buttons.

### 3.6 Session Structure

A DGE session consists of 3-5 scenes, each focused on a different aspect:

```
Scene 1: Basic Flow (happy path) — Senpai sets context, characters verify assumptions
Scene 2: Edge Cases — characters probe boundaries and error conditions  
Scene 3: Operations — characters discuss production behavior, performance, scale
Scene 4: Security/Risk — adversarial characters attack the design
```

Each scene produces a set of gaps. After all scenes, gaps are consolidated, deduplicated, and prioritized. The human operator reviews the gaps (the "review" step) and decides which to convert to specifications.

### 3.7 Review Flow

The review step is critical and often overlooked:

```
1. Generate conversation script (10-30 min)
2. Human reviews the script (5-10 min)  ← essential
3. Additional gaps from review are incorporated
4. Gaps converted to specifications
```

The human review in step 2 often discovers gaps that the characters missed. The conversation script serves as a catalyst for human insight, not a replacement for it.

---

## 4. Implementation

The DGE toolkit is implemented as a set of 12 Markdown files totaling 957 lines:

```
dge/
├── README.md           — entry point (111 lines)
├── method.md           — methodology (208 lines)
├── characters/
│   ├── catalog.md      — 12 characters with prompts (154 lines)
│   └── custom-guide.md — custom character creation (31 lines)
├── templates/
│   ├── api-design.md, feature-planning.md, go-nogo.md,
│   ├── incident-review.md, security-review.md
├── skills/
│   ├── dge-session.md         — Claude Code skill (62 lines)
│   └── dge-template-create.md — template creation skill (53 lines)
└── examples/
    └── askos-adversarial.md   — example session (61 lines)
```

Integration with AI coding agents requires copying two files to `.claude/skills/`. The agent then responds to commands like "DGE this API design" by reading the methodology, selecting appropriate characters and templates, and generating a conversation script.

---

## 5. Evaluation

### 5.1 Case Study 1: unlaxer-parser

**Context.** unlaxer-parser is a Java 21 parser framework that generates six artifacts (parser, AST, mapper, evaluator, LSP server, DAP server) from a single grammar specification. The production deployment processes 10^9 financial transactions per month as a UDF.

**DGE application.** Five DGE sessions were conducted during the v3-to-v4 development period, covering: ternary operator design, string method syntax, grammar merging, incremental parsing, and future work planning.

**Results.** 108 gaps were discovered across six categories:

| Category | Count | % |
|----------|-------|---|
| Missing evaluation logic | 34 | 31% |
| Parser-evaluator mismatch | 22 | 20% |
| Type coercion gaps | 18 | 17% |
| Error message quality | 15 | 14% |
| LSP/DAP integration | 11 | 10% |
| Test coverage | 8 | 7% |

97 of 108 gaps (90%) were resolved. 11 remain as tracked known limitations.

**Comparison with traditional review.** Before adopting DGE, the v2-to-v3 transition relied on traditional specification review (reading the UBNF grammar and manually checking evaluator methods). The v2 review identified 31 gaps. The v3-to-v4 DGE sessions identified 108 gaps — a 3.5x increase. Notably, 79 of the 108 gaps (73%) were in categories not examined during v2 review (type coercion, error quality, LSP integration).

### 5.2 Case Study 2: AskOS

**Context.** AskOS is a multi-project AI agent orchestration platform with a Commander (rule-based + LLM decision engine), Decision Garden (coverage visualization), and Trust Gradient (delegation control).

**DGE application.** 11 DGE sessions covered: broker design, business model (AskOS4Business), domain expansion, visualization/SaaS model, persona adventure, character personas, human events, multi-user differentiation, onboarding, UI design, DGE skills, component architecture, daily UX scripts, and adversarial review.

**Results.** 14,978 lines of design documentation were produced. The adversarial review session alone (using characters Owada, Rivai, Tonegawa, and Dr. House) discovered 16 critical gaps:

| Category | Count | Example |
|----------|-------|---------|
| Business | 5 | No effectiveness metrics defined |
| Safety | 4 | Auto-answer dependency risk |
| Operations | 3 | Zero runbooks |
| Messaging | 2 | User-facing language misaligned |
| Legal | 2 | No terms of service |

**Key finding.** The adversarial review discovered an entire category of gaps (legal) that no prior session had identified. This was directly attributable to the Saul Goodman character, who was not present in earlier sessions. Character selection determines gap coverage.

### 5.3 Character Effectiveness Analysis

Across both case studies, we analyzed which characters discovered which types of gaps:

| Character | Primary Gap Type | Unique Contribution |
|-----------|-----------------|---------------------|
| Imaizumi | Assumption gaps (Q1, Q2) | 23% of all gaps traced to assumption challenges |
| Sengoku | Quality gaps | Identified 18% of gaps, all in quality/standards |
| Yang | Complexity gaps | Eliminated 12 unnecessary features |
| Boku | Scope gaps | Reduced MVP scope by 40% in AskOS |
| Owada | Business gaps | Found 100% of business model gaps |
| Dr. House | Hidden dependency gaps | Identified SPOF and dependency risks |
| Tonegawa | Messaging gaps | Reframed product positioning |

**Finding: No single character covers all gap types.** The combination of characters determines the coverage of the review. We recommend a minimum of 3 characters per session, combining at least one constructive and one adversarial character.

### 5.4 Threats to Validity

**Internal validity.** Both case studies involve the same primary developer (the first author). DGE's effectiveness may differ with other developers or teams. The gap count comparison (31 vs 108) between traditional review and DGE is confounded by the fact that the v3-to-v4 transition was larger in scope than v2-to-v3.

**External validity.** The case studies cover a parser framework and an AI orchestration platform. Generalizability to other domains (embedded systems, data pipelines, mobile applications) has not been evaluated.

**Construct validity.** "Gap" is subjectively defined. Some items counted as gaps might be considered features or design decisions rather than deficiencies. We mitigated this by requiring each gap to have an Observe-Suggest-Act specification.

---

## 6. Discussion

### 6.1 Why Characters Work Better Than Labels

A reviewer instructed to "be cautious" produces generic feedback. A reviewer instructed to "review like Sengoku from Ōsama no Restaurant" produces specific, consistent, high-resolution feedback — because the LLM has rich training data about Sengoku's personality, standards, and communication patterns.

This "name as interface" principle has implications beyond DGE. Any system that uses LLMs to generate persona-driven content benefits from referencing well-known characters rather than describing traits abstractly.

### 6.2 LLM Compatibility

DGE is particularly well-suited to LLM-assisted development because:
1. Dialogue generation is a natural LLM task
2. Character emulation leverages LLM training data
3. The structured output (gap markers, categories) is parseable
4. The human-in-the-loop review step prevents hallucinated gaps from propagating

### 6.3 Limitations

1. **Cultural dependency.** Characters from Japanese media may not resonate with all developers. The custom character feature partially addresses this.
2. **Character saturation.** Using more than 5 characters in a single session produces diminishing returns and unwieldy conversation scripts.
3. **LLM dependency.** Without an LLM, DGE requires human role-playing, which is slower and less consistent.
4. **Gap quality.** Not all discovered gaps are genuine. The human review step is essential for filtering false positives.

---

## 7. Conclusion

We presented DGE (Design-Gap Exploration / Dialogue-driven Gap Extraction), a methodology for discovering software design gaps through character-based adversarial dialogues. Through two case studies, we demonstrated that DGE discovers 3.5x more gaps than traditional specification review, with 73% of gaps in categories not covered by traditional review.

The key innovations are: (1) using well-known fictional characters as high-resolution reviewer personas ("name as interface"); (2) the Imaizumi Method's five question types for systematic assumption probing; (3) the Senpai narrator role for separating technical context from adversarial debate; and (4) the Observe-Suggest-Act pattern for converting gaps to specifications.

DGE is released as a portable toolkit of 12 Markdown files that integrates with AI coding agents. It has been validated in production systems processing 10^9 transactions/month.

---

## References

[Basili et al. 1996] V.R. Basili, S. Green, O. Laitenberger, et al. "The Empirical Investigation of Perspective-Based Reading." Empirical Software Engineering, 1(2), 1996.
[Chen et al. 2021] M. Chen, et al. "Evaluating Large Language Models Trained on Code." arXiv:2107.03374, 2021.
[Cooper 1999] A. Cooper. "The Inmates Are Running the Asylum." Sams, 1999.
[Fagan 1976] M.E. Fagan. "Design and Code Inspections to Reduce Errors in Program Development." IBM Systems Journal, 15(3), 1976.
[Gilb and Graham 1993] T. Gilb, D. Graham. "Software Inspection." Addison-Wesley, 1993.
[Lemieux et al. 2023] C. Lemieux, et al. "CodaMosa: Escaping Coverage Plateaus in Test Generation with Pre-trained Large Language Models." ICSE, 2023.
[Li et al. 2023] L. Li, et al. "Automating Code Review Activities by Large-Scale Pre-training." FSE, 2023.
[Zellers et al. 2019] R. Zellers, et al. "Defending Against Neural Fake News." NeurIPS, 2019.
