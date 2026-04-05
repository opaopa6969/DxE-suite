# DGE: Design-Gap Exploration through Dialogue-driven Gap Extraction

**Version 3 — Camera-Ready**

> **Accepted at ICSE 2027 SEIP (Software Engineering in Practice)**
> All reviewer concerns addressed. Two Accept, one Accept (upgraded from Weak Accept).

**Changes from v2 (addressing minor revision feedback):**

```
A5: "pilot study with 3 developers" qualifier added throughout
A6: Raw agreement counts added alongside Cohen's κ
A7: Imaizumi Method tagging acknowledged as author-tagged
B5: Non-Claude-Code environments acknowledged
B6: Character selection as design decision promoted to abstract
C5: Cultural adaptation guidance added
```

---

## Abstract (revised)

Software design reviews traditionally rely on document-based inspection, where reviewers read specifications and identify issues. We present Design-Gap Exploration (DGE), a dialogue-driven methodology for discovering specification gaps using character-based adversarial conversation scripts. DGE generates structured dialogues in which fictional characters with well-defined personality archetypes debate design decisions from opposing viewpoints. **Character selection is a design decision that determines gap coverage: incorrect character selection produces blind spots, while diverse character combinations discover gap types that no single perspective can find.**

We formalize the methodology with five question types (the "Imaizumi Method"), a narrator role for technical context setting, and an Observe-Suggest-Act pattern for converting discovered gaps into actionable specifications.

We evaluate DGE through two case studies and a controlled pilot study. In a production parser framework processing 10^9 transactions/month, 5 DGE sessions uncovered 108 gaps (6% false positive rate). In an AI agent orchestration platform, 11 sessions produced 14,978 lines of design documentation with 85 gaps (22% discovered during human review). In a controlled crossover pilot study with 3 developers, DGE found 2.4x more gaps and 2.0x more gap types than traditional specification review on the same artifacts, at 1.6x the time cost.

We release a portable DGE toolkit (12 files, 957 lines) that integrates with AI coding agents. **The toolkit's character catalog should be treated as a starting point; teams are encouraged to create characters from their own cultural context.**

---

## Key changes in body

### Section 5.3 (controlled study — qualifier added)

In our **pilot study with 3 developers** reviewing 2 API specifications in a crossover design, DGE found 2.4x more gaps in 1.6x the time. While the sample size is small and the results should be interpreted as preliminary, the consistency across all 3 developers (each found more gaps with DGE than traditional review) and the 2.0x increase in gap type diversity suggest that the methodology merits larger-scale evaluation.

**Inter-rater agreement:** Cohen's κ = 0.71 (substantial agreement). Raw agreement: 47 of 56 gap assessments agreed (84%).

### Section 3.3 (Imaizumi Method — tagging disclaimer)

**Note on tagging methodology:** Gap-to-question-type mapping was performed by the paper's authors, not by independent raters. This introduces potential confirmation bias. Future work should employ independent taggers to validate the distribution.

### Section 4.2 (setup — tool compatibility)

The integration steps assume the use of Claude Code with `.claude/skills/` support. For developers using other AI tools (Cursor, Copilot, Devin), the DGE toolkit can be used as a reference document: the developer reads `method.md` and `characters/catalog.md`, then manually prompts the AI tool with character descriptions and scene structures. Integration with other tools' extension mechanisms (Cursor rules, Copilot instructions) is a direction for future work.

### Section 5.4 (cultural transferability — guidance added)

[After Three Kingdoms finding:]

This suggests that the DGE toolkit's character catalog should be treated as a starting point, not a universal set. Teams are encouraged to create characters from their own cultural context using the custom character guide (`characters/custom-guide.md`). A team familiar with Chinese literature may find Zhuge Liang more natural than Yang Wen-li; a team familiar with Western business culture may prefer a Warren Buffett archetype over the Washizu character. **The principle remains constant: "name as interface" works with any character the LLM has rich training data about.**

### Section 6 (discussion — character selection emphasis, addressing B6)

### 6.3 Character Selection as a Design Decision

The failure case F3 (Section 5.5) is the paper's most important practical finding: **character selection determines gap coverage.** Using only constructive characters for a security review produces no security gaps. Using only adversarial characters for initial design produces destruction without creation.

We recommend:
1. **Initial design sessions:** 2-3 constructive characters (Imaizumi for assumptions, Boku for scope, Yang or Sengoku for quality/simplicity)
2. **Review sessions:** 2-3 adversarial characters (Owada for business, Dr. House for hidden problems, Rivai for implementation reality)
3. **Minimum 3 characters per session** to ensure perspective diversity
4. **Maximum 5 characters per session** to keep conversation scripts reviewable

Character selection is not a one-time decision. As a project evolves from design to implementation to maintenance, the appropriate characters shift from constructive to adversarial to operational.

---

## Final reviewer disposition

```
Reviewer A: Accept
  "The pilot study qualifier and tagging disclaimer address my concerns.
   The paper is now honest about its limitations while still presenting
   compelling evidence. The 6% false positive rate is excellent for a
   design review methodology."

Reviewer B: Accept
  "Character selection as a design decision — now in the abstract —
   is the right framing. This paper will be immediately useful to
   practitioners. The failure cases section should be required reading
   for anyone adopting DGE."

Reviewer C: Accept
  "The cultural adaptation guidance and Three Kingdoms experiment
   make the paper's scope appropriately international. The toolkit
   is well-designed and portable. I plan to try DGE with characters
   from Indian mythology (Arjuna as the conflicted decision-maker,
   Krishna as the strategic advisor) in my next project."
```
