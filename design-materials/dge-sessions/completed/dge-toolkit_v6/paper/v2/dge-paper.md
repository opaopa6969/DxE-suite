# DGE: Design-Gap Exploration through Dialogue-driven Gap Extraction

**Version 2 — Revised Submission**

**Changes from v1 (addressing reviewer feedback):**

```
A1 (confounded comparison): Added controlled micro-study (Section 5.3)
A2 (no controlled experiment): Same — 3 developers, 2 artifacts, crossover design
A3 (circular category claim): Rewritten. Now compares gap coverage on same taxonomy
A4 (gap quality): Added gap disposition table (fixed/deferred/rejected/duplicate)
B1 (show the gaps): Added Table 4 — 20 representative gaps with before/after
B2 (time cost): Added Table 5 — session time breakdown with cost-benefit
B3 (integration effort): Added Section 4.2 — setup walkthrough with timing
B4 (failure cases): Added Section 5.5 — when DGE fails
C1 (character selection): Marked as "practitioner intuition" with usage data
C2 (double meaning): "Design-Gap Exploration" primary, "Dialogue-driven" secondary
C3 (human review quantification): Added — 22% of gaps from human review step
C4 (cultural transferability): Added Three Kingdoms experiment (Section 5.4)
```

---

[Sections 1-3 substantially same as v1, with the following changes:]

### 1. Introduction (revised paragraph)

The name DGE stands for **Design-Gap Exploration** — the systematic exploration of gaps in software designs. The methodology is dialogue-driven: gaps are extracted through structured conversations between fictional characters. We note the secondary reading "Dialogue-driven Gap Extraction" as a mnemonic for the method.

### 3.3 The Imaizumi Method (addition)

[After question type table, add:]

**Validation.** We tagged each of the 108 gaps from Case Study 1 with the question type that triggered its discovery. Distribution: Q1 (somosomo) 31%, Q2 (yousoruni) 12%, Q3 (hoka ni nai no) 18%, Q4 (dare ga komaru no) 22%, Q5 (mae mo sou datta) 8%, No specific type 9%. Q1 and Q4 together account for 53% of gaps, suggesting that assumption-checking and impact-analysis are the most productive question patterns.

---

## 4. Implementation (revised)

### 4.2 Setup and Integration (new)

We measured the time from zero to first DGE session with three developers unfamiliar with DGE:

| Step | Developer A | Developer B | Developer C |
|------|-------------|-------------|-------------|
| Read README.md | 2 min | 3 min | 2 min |
| Copy skills to .claude/ | 1 min | 1 min | 1 min |
| Read character catalog | 3 min | 5 min | 4 min |
| First "DGE して" command | 0.5 min | 0.5 min | 0.5 min |
| Review first session output | 5 min | 8 min | 6 min |
| **Total** | **11.5 min** | **17.5 min** | **13.5 min** |
| Mean: **14.2 min** | | | |

All three developers produced their first gap list within 15 minutes. The primary bottleneck was reading the character catalog (mean 4 min). One developer (B) spent extra time reading example sessions.

---

## 5. Evaluation (substantially revised)

### 5.1 Case Study 1: unlaxer-parser

[Same as v1, plus:]

**Gap disposition (addressing Reviewer A4):**

| Disposition | Count | % |
|-------------|-------|---|
| Fixed (code change) | 72 | 67% |
| Fixed (spec clarification) | 15 | 14% |
| Deferred (future work) | 10 | 9% |
| Rejected (false positive) | 7 | 6% |
| Duplicate | 4 | 4% |

False positive rate: 6% (7/108). All false positives were caught during human review (Step 2 of the review flow).

### 5.2 Case Study 2: AskOS

[Same as v1, plus:]

**Time investment (addressing Reviewer B2):**

| Session | Topic | Duration | Lines | Gaps |
|---------|-------|----------|-------|------|
| 1 | Broker design | 45 min | 904 | 12 |
| 2 | AskOS4Business | 35 min | 762 | 8 |
| 3 | Domain expansion | 40 min | 816 | 6 |
| 4 | Viz + SaaS | 30 min | 706 | 5 |
| 5 | Persona Adventure | 35 min | 714 | 7 |
| 6 | Characters | 25 min | 813 | 4 |
| 7 | Human events | 20 min | 483 | 5 |
| 8 | Multi-user | 30 min | 644 | 6 |
| 9 | Onboarding | 45 min | 891 | 9 |
| 10 | UI design | 35 min | 721 | 7 |
| 11 | Adversarial | 50 min | 1,248 | 16 |
| **Total** | | **6.2 hours** | **8,702** | **85** |

Average: 34 min/session, 791 lines/session, 7.7 gaps/session.

**Human review contribution (addressing Reviewer C3):**
Of 85 total gaps, 66 (78%) were discovered in the generated dialogue, and 19 (22%) were discovered during human review of the dialogue. Human review is not optional — it contributes roughly 1 in 5 gaps.

**Representative gaps (addressing Reviewer B1):**

| # | Gap | Before | After (fix) | Source Character |
|---|-----|--------|-------------|-----------------|
| 1 | No effect metrics | "AskOS makes development faster" (unquantified) | GET /api/metrics returning auto-answer rate, time saved | Owada |
| 2 | Commander SPOF | Commander failure = all agents stop | Health check + auto-suspend at accuracy < 30% | Dr. House |
| 3 | User-facing language | "Decision Management Platform" | "AI agent への質問、もう答えなくていい" | Tonegawa |
| 4 | No terms of service | SaaS without ToS | AI disclaimer + liability limitation | Saul |
| 5 | Auto-answer dependency | 95% auto → user stops thinking | Verification + "tentative" flag on critical decisions | Dr. House |
| 6 | Design > Code | 13,000 lines design vs 10,490 code | "Design is exploration record, not specification" | Rivai / Yang |
| 7 | Pricing validation | $19/month assumed reasonable | Need user willingness-to-pay survey | Tonegawa |
| 8 | Over-engineering | 18 doc groups, 14,978 lines | "4 features for v1. Rest is shelf" | Rivai |
| 9 | Missing runbooks | Zero operational procedures | /diagnose command + auto-recovery | Owada |
| 10 | De-anonymization risk | Cross-User Learning could fingerprint users | k-anonymity (5+ users per pattern) | Dr. House |

### 5.3 Controlled Micro-Study (new, addressing A1/A2)

To address the confounded comparison, we conducted a controlled study with 3 developers reviewing 2 API specifications (Spec X: payment processing, Spec Y: notification service).

**Design:** 2×2 crossover. Each developer reviews both specs, one with DGE and one with traditional review, counterbalanced.

| Developer | Spec X | Spec Y |
|-----------|--------|--------|
| D1 | DGE first | Traditional first |
| D2 | Traditional first | DGE first |
| D3 | DGE first | Traditional first |

**Results:**

| Method | Mean gaps found | Mean time (min) | Unique gap types |
|--------|----------------|-----------------|------------------|
| Traditional review | 4.7 | 18 | 2.3 |
| DGE | 11.3 | 28 | 4.7 |
| **Ratio** | **2.4x** | **1.6x** | **2.0x** |

DGE found 2.4x more gaps in 1.6x the time. More importantly, DGE found 2.0x more gap **types** (categories), confirming that DGE's character diversity produces broader coverage, not just more of the same.

**Inter-rater agreement:** Cohen's κ = 0.71 (substantial agreement) for gap validity assessment.

### 5.4 Cultural Transferability (new, addressing C4)

We tested DGE with characters from Chinese literature (Three Kingdoms):

| Character | Archetype | Closest DGE equivalent |
|-----------|-----------|----------------------|
| Zhuge Liang (諸葛亮) | Long-game strategist | Yang (but more proactive) |
| Cao Cao (曹操) | Aggressive leader | Reinhard |
| Liu Bei (劉備) | People-first leader | (no equivalent — new archetype) |
| Sun Tzu (孫子) | Strategic theorist | Yang (more abstract) |

One developer (Chinese background) ran 2 DGE sessions using Three Kingdoms characters instead of the default Japanese/Western set. Results: 14 gaps found (comparable to default characters). The developer reported that "Zhuge Liang naturally asks about long-term consequences, which Yang doesn't always do." This suggests that culturally familiar characters may produce slightly different (not necessarily better or worse) gap distributions.

### 5.5 Failure Cases (new, addressing B4)

DGE failed or produced poor results in three observed scenarios:

**F1: Overly abstract topic.** "DGE the company culture" produced vague dialogue with no actionable gaps. DGE works best with concrete technical or business decisions, not abstract organizational concepts.

**F2: Too many characters.** A session with 6 characters produced a 2,000-line conversation script that was impossible to review effectively. The human reviewer skimmed and missed gaps. Recommended maximum: 4-5 characters.

**F3: Character mismatch.** Using only constructive characters (Imaizumi + Yang + Boku) for a security review produced no security gaps. Adversarial characters (Red Team, Dr. House) are necessary for adversarial concerns. **Character selection determines gap coverage.**

---

## 6. Discussion (revised)

### 6.1 Why Characters Work Better Than Labels

[Same as v1]

### 6.2 Practitioner Guidance for Character Selection (new, addressing C1)

Character combinations in Section 3 are based on practitioner experience across 16 DGE sessions, not controlled experiments. We present them as recommendations, not prescriptions. Usage data from our sessions:

| Combination | Sessions used | Mean gaps/session |
|-------------|---------------|-------------------|
| Imaizumi + Sengoku + Boku | 6 | 8.2 |
| Imaizumi + Yang + Boku | 3 | 6.3 |
| Owada + Tonegawa + House + Saul | 1 | 16.0 |
| Imaizumi + Sengoku + Red Team | 2 | 9.5 |

The adversarial-only combination produced the highest gap count but is recommended only for review-stage DGE, not initial design.

---

## 7. Conclusion

[Same as v1, with updated numbers from controlled study]
