# DGE Effectiveness Validation -- Comparative Experiment Design

> Addressing Critical gaps 1-007 and 1-008.
> Quantitatively verify: "Is DGE truly superior to simple prompting?"

---

## 1. Purpose of the Experiment

Quantitatively verify whether DGE (gap extraction through character dialogue drama) is
**effective at discovering design gaps** compared to the following existing methods.

Hypotheses to test:

```
H1: DGE discovers more unique gaps than simple prompting
H2: DGE discovers gaps of higher severity than checklist-based review
H3: DGE + human review achieves higher precision than DGE alone
H4: DGE outperforms other methods in useful gaps discovered per unit time (efficiency)
```

---

## 2. Experiment Design

### 2.1 Conditions (4 conditions x 3 targets = 12 cells)

| Condition | Method | Prompt Example | Human Intervention |
|-----------|--------|----------------|-------------------|
| **A: Simple Prompt** | Ask an LLM "Point out the problems in this design" | See below | None |
| **B: Checklist** | Have the LLM review using known frameworks such as STRIDE / OWASP / RFC 2119 | See below | None |
| **C: DGE** | Generate character dialogue drama using DGE template | Use template | None |
| **D: DGE + Human Review** | After DGE generation, a human reviews and adds notes for 10 minutes | Use template | Yes (10 min) |

### 2.2 Prompts for Each Condition

**Condition A: Simple Prompt**
```
Read the following design document and point out problems, oversights, and contradictions.
Assign a severity (Critical / High / Medium / Low) to each problem.

[Full design document]
```

**Condition B: Checklist-Based Review**
```
Review the following design document based on the checklist below.

## Checklist
- [ ] Are validations defined for all inputs?
- [ ] Is error case handling comprehensive?
- [ ] Are authentication/authorization flows explicitly defined? (STRIDE: Spoofing)
- [ ] Are data tampering prevention measures defined? (STRIDE: Tampering)
- [ ] Are audit logs / non-repudiation measures in place? (STRIDE: Repudiation)
- [ ] Has the risk of information leakage been assessed? (STRIDE: Information Disclosure)
- [ ] Are there countermeasures for DoS / resource exhaustion? (STRIDE: Denial of Service)
- [ ] Has the risk of privilege escalation been assessed? (STRIDE: Elevation of Privilege)
- [ ] Are performance requirements (latency, throughput) defined?
- [ ] Is there a backward compatibility / migration strategy?
- [ ] Is there an operational monitoring / alerting design?
- [ ] Are user behavior scenarios covered?

Point out any issues for each item. Include severity.

[Full design document]
```

**Conditions C / D: DGE**
```
Use the DGE templates (api-design.md / feature-planning.md / security-review.md)
as-is. Character selection follows the template recommendations.
```

### 2.3 Target Documents (3 types)

To increase experiment reliability, use design documents with **pre-embedded known problems**.

| # | Target | Template | Known Problem Count | Creation Method |
|---|--------|----------|---------------------|-----------------|
| D1 | REST API Design (Auth + CRUD) | api-design.md | 15 | See below |
| D2 | New Feature Proposal (Notification System) | feature-planning.md | 15 | See below |
| D3 | Security Design (OAuth Flow) | security-review.md | 15 | See below |

**Method for Embedding Known Problems:**

1. First, create a "perfect design document"
2. Intentionally embed 15 problems, 3 from each of the following 5 categories:
   - Missing logic (3): Undefined API edge cases, missing error handling, etc.
   - Spec-impl mismatch (3): Contradictions in descriptions, type inconsistencies, etc.
   - Integration gap (3): Oversights in integration points, etc.
   - Security gap (3): Authentication bypass, information leakage paths, etc.
   - Ops gap (3): Undesigned monitoring, missing recovery procedures, etc.
3. Store the list of embedded problems as a sealed answer (ground truth labels)

> **Why synthetic documents**: With existing project documents, the "true list of problems" is unknown,
> making it impossible to calculate precision / recall. Synthetic documents provide ground truth labels.

### 2.4 Control Variables

| Variable | Control Method |
|----------|---------------|
| LLM | Same model and parameters across all conditions (Claude Sonnet 4, temperature 0) |
| Document | Same documents used across all conditions |
| Repetitions | 5 runs per cell (to measure LLM output variance) |
| Order effects | Condition A->B->C order is randomized (in practice, runs are independent so this is not an issue) |
| DGE characters | Fixed use of template-recommended combinations |
| Condition D human | Same person (the author) reviews all sessions |

---

## 3. Measurement Metrics

### 3.1 Primary Metrics

| Metric | Definition | Calculation Method |
|--------|------------|-------------------|
| **Gap Discovery Count** | Total number of gaps discovered per condition | Manual count from output |
| **Unique Rate** | Proportion of gaps after removing duplicates | Unique gap count / Total gap count |
| **Severity Distribution** | Ratio of Critical / High / Medium / Low | Blind assessment by the author |
| **Precision** | Proportion of discovered gaps that were actually useful | Useful gap count / Discovered gap count |
| **Recall** | Proportion of embedded problems that were discovered | Discovered known problem count / 15 |
| **Time Required** | Time to complete gap extraction (seconds) | LLM response time + human review time |
| **Efficiency** | Useful gaps per unit time | Useful gap count / Time required (minutes) |

### 3.2 Criteria for Judging a Gap as "Useful"

The author judges each gap on the following 3-point scale:

```
Useful    -- Knowing this gap leads to or should lead to a design change
Marginal  -- The observation is correct but does not warrant a design change
Noise     -- Incorrect, already addressed, or trivial
```

For precision calculations, only `Useful` gaps are counted.

### 3.3 Gap Deduplication Criteria

Criteria for determining whether gaps refer to the same problem:

```
Same:      Pointing out the same problem in the same location using different wording
Similar:   Related but addressing a different aspect -> Count as separate gaps
Unrelated: Different problem -> Count as separate gaps
```

The author performs the assessment. In ambiguous cases, gaps are generously counted as "separate."

---

## 4. Statistical Testing

### 4.1 Testing Methods

| Comparison | Test | Rationale |
|------------|------|-----------|
| Gap discovery count across 4 conditions | Friedman test | Repeated measures (same documents), normality cannot be assumed, small sample size |
| Post-hoc pairwise comparisons | Wilcoxon signed-rank test + Bonferroni correction | Non-parametric, multiple comparison correction |
| Precision / Recall | Fisher's exact test | 2x2 contingency table, expected frequencies may be less than 5 in some cells |
| Severity distribution | Chi-squared test (if expected frequencies >= 5) / Fisher's exact test | Categorical data |

### 4.2 Rationale for Sample Size

```
Number of cells: 4 conditions x 3 documents x 5 runs = 60 executions
Comparison unit: 15 data points per condition (3 documents x 5 runs)

Effect size assumptions:
  - DGE discovers 30% or more gaps than simple prompting (Cohen's d ~ 0.8)
  - This assumption is based on the track record showing DGE's high gap discovery
    capability from unlaxer-parser (108 gaps / 5 sessions) and AskOS (16 gaps)

Power analysis:
  - alpha = 0.05, power = 0.80, effect size = large (d = 0.8)
  - Required sample size for Wilcoxon signed-rank test: n ~ 15
  - Satisfied by 15 data points per condition (3 x 5)
```

> **Note**: This is a pilot experiment, prioritizing "estimation of effect direction and
> magnitude" over large-scale statistical power. Confidence intervals will also be reported.

### 4.3 Significance Level

```
alpha = 0.05 (after Bonferroni correction: 0.05 / 6 = 0.0083 applied to each pairwise comparison)
  Pairwise comparisons: A-B, A-C, A-D, B-C, B-D, C-D (6 pairs)
```

---

## 5. Retrospective Analysis of Existing Data

In addition to the new experiment, existing DGE session data will also be included in the analysis.

### 5.1 unlaxer-parser (108 gaps / 5 sessions)

**Purpose**: Track what happened to gaps discovered by DGE in the actual implementation.

**Procedure**:

1. Obtain the list of 108 gaps
2. For each gap, determine:
   - **Resolved**: Addressed in code or specification
   - **Acknowledged**: Recognized but not yet addressed (backlog)
   - **Rejected**: Determined not to require action after review
   - **False positive**: Was not actually a problem
3. Calculate resolution rate = (Resolved + Acknowledged) / 108
4. Calculate precision (retrospective) = (Resolved + Acknowledged + Rejected) / 108
   (Everything except false positives is considered a "useful finding")
5. Analyze resolution rate by severity

**Additional analysis**: Apply Condition A (simple prompt) and Condition B (checklist) retroactively
to the unlaxer-parser design documents to identify gaps that DGE discovered but other methods
did not (DGE-unique gaps).

### 5.2 AskOS (16 gaps / adversarial review)

**Purpose**: Verify the quality of gaps from adversarial DGE.

**Procedure**:

1. Obtain the list of 16 gaps
2. For each gap, determine:
   - **Resolved**: Addressed in design or implementation
   - **Acknowledged**: Recognized but not yet addressed
   - **Rejected**: No action required
   - **False positive**: Was not a problem
3. Apply Conditions A and B to the AskOS design document (14,978 lines)
4. Visualize the overlap of gap discovery between conditions with a Venn diagram

### 5.3 Limitations of the Retrospective

```
Limitations:
  - Recall cannot be calculated due to the absence of ground truth labels (unlike the synthetic experiment)
  - Author bias: The DGE developer performs the assessment, which may introduce favorable bias
  - Mitigation: Pre-define assessment criteria and publish all assessment results
```

---

## 6. Execution Procedure

### Phase 0: Preparation (1 day)

```
0-1. Create 3 synthetic design documents
     - D1: REST API Design (Authenticated CRUD API)
     - D2: New Feature Proposal (Real-time Notification System)
     - D3: Security Design (OAuth 2.0 + PKCE Flow)

0-2. Embed 15 known problems in each document
     - Category allocation: Missing logic x 3, Spec-impl mismatch x 3,
       Integration gap x 3, Security gap x 3, Ops gap x 3
     - Store the problem list as sealed-answers.md (kept private until experiment completion)

0-3. Prepare the experiment environment
     - LLM: Claude Sonnet 4 (via API, temperature = 0)
     - Execution script: Shell script to automatically submit prompts for each condition
     - Recording template: Prepare CSV template for recording results
```

### Phase 1: Prospective Experiment (2-3 days)

```
1-1. Execute Condition A (Simple Prompt)
     - D1, D2, D3 x 5 runs each = 15 runs
     - Save each run's output to results/A/D{1,2,3}/run{1..5}.md
     - Record time taken

1-2. Execute Condition B (Checklist)
     - D1, D2, D3 x 5 runs each = 15 runs
     - Save results to results/B/D{1,2,3}/run{1..5}.md
     - Record time taken

1-3. Execute Condition C (DGE)
     - D1: api-design.md template, characters = Imaizumi + Sengoku + Boku
     - D2: feature-planning.md template, characters = Imaizumi + Yang + Boku
     - D3: security-review.md template, characters = Sengoku + Red Team + House
     - D1, D2, D3 x 5 runs each = 15 runs
     - Save results to results/C/D{1,2,3}/run{1..5}.md

1-4. Execute Condition D (DGE + Human Review)
     - Human (the author) reviews Condition C output for 10 minutes
     - Append additionally discovered gaps with a markup annotation
     - D1, D2, D3 x 5 runs each = 15 runs
     - Save results to results/D/D{1,2,3}/run{1..5}.md
     - Record the number of additional gaps found and time spent on human review
```

### Phase 2: Gap Assessment (1 day)

```
2-1. Extract and list gaps from all outputs
     - Assign a unique ID to each gap: e.g., A-D1-R1-001
     - CSV: condition, document, run, gap_id, description, severity

2-2. Blind assessment of gap usefulness
     - Shuffle all gaps and hide condition labels before assessment
     - Assessment: Useful / Marginal / Noise

2-3. Cross-reference with known problems (Recall calculation)
     - Open sealed-answers.md
     - Record whether each known problem was "discovered / not discovered"

2-4. Deduplication
     - Consolidate gaps that refer to the same problem across conditions
     - Calculate unique gap count
```

### Phase 3: Retrospective Analysis (1 day)

```
3-1. Perform resolution assessment on the 108 unlaxer-parser gaps
     - Cross-reference with git log / issue tracker

3-2. Apply Conditions A and B to unlaxer-parser design documents
     - 5 runs each
     - Identify DGE-unique gaps

3-3. Perform resolution assessment on the 16 AskOS gaps

3-4. Apply Conditions A and B to AskOS design documents
     - 5 runs each
     - Create Venn diagram showing overlap between conditions
```

### Phase 4: Statistical Analysis and Reporting (1 day)

```
4-1. Calculate descriptive statistics per condition
     - Gap discovery count (mean, median, SD)
     - Unique rate, severity distribution
     - Precision, recall
     - Time required, efficiency

4-2. Execute statistical tests
     - Friedman test -> if significant, Wilcoxon + Bonferroni
     - Report effect size (r = Z / sqrt(N)) and 95% confidence intervals

4-3. Summarize retrospective results
     - Resolution rate, precision
     - Characterization of DGE-unique gaps

4-4. Write the report in paper/experiment-results.md
```

---

## 7. Expected Result Patterns and Interpretation

Pre-define the interpretation of experiment results (to prevent p-hacking).

| Pattern | Interpretation | Action |
|---------|---------------|--------|
| C > A, C > B (significant difference in both gap count and precision) | DGE is more effective than existing methods | Can be claimed in the paper |
| C > A, C ~ B (no difference from checklist) | DGE is equivalent to checklist but more effective than simple prompting | Redefine DGE's advantage as "equivalent quality without needing a checklist" |
| C ~ A, C ~ B (no difference) | DGE's added value cannot be demonstrated statistically | Revise method.md. Shift claims to qualitative advantages (readability, etc.) |
| D > C (significant improvement with human review) | Human review is essential | Emphasize the review flow as mandatory |
| D ~ C (no improvement with human review) | LLM alone is sufficient | Reconsider the positioning of the review flow |

---

## 8. Experiment Execution Script Template

```bash
#!/bin/bash
# run-experiment.sh -- Automated execution of DGE comparative experiment

MODEL="claude-sonnet-4-20250514"
RESULTS_DIR="paper/experiment/results"

for doc in D1 D2 D3; do
  for run in $(seq 1 5); do
    echo "=== Condition A: $doc Run $run ==="
    mkdir -p "$RESULTS_DIR/A/$doc"

    # Condition A: Simple Prompt
    cat <<PROMPT | claude-api --model "$MODEL" --temperature 0 > "$RESULTS_DIR/A/$doc/run${run}.md"
Read the following design document and point out problems, oversights, and contradictions.
Assign a severity (Critical / High / Medium / Low) to each problem.

$(cat "paper/experiment/docs/${doc}.md")
PROMPT

    echo "=== Condition B: $doc Run $run ==="
    mkdir -p "$RESULTS_DIR/B/$doc"

    # Condition B: Checklist
    cat <<PROMPT | claude-api --model "$MODEL" --temperature 0 > "$RESULTS_DIR/B/$doc/run${run}.md"
Review the following design document based on the checklist below.
[Insert full checklist here]

$(cat "paper/experiment/docs/${doc}.md")
PROMPT

    echo "=== Condition C: $doc Run $run ==="
    mkdir -p "$RESULTS_DIR/C/$doc"

    # Condition C: DGE (executed as a Claude Code skill via DGE template)
    # Note: DGE is run as a Claude Code skill, so it is executed
    #       interactively rather than via direct API calls.
    #       Only the output destination is prepared here.
    echo "Execute DGE session manually -> save to $RESULTS_DIR/C/$doc/run${run}.md"

  done
done
```

---

## 9. Result Recording Templates

### gap-log.csv

```csv
condition,document,run,gap_id,description,severity,useful,matches_known_problem,known_problem_id,time_seconds
A,D1,1,A-D1-R1-001,"Auth token expiration undefined",High,Useful,yes,KP-D1-007,45
A,D1,1,A-D1-R1-002,"Inconsistent error response format",Medium,Marginal,no,,45
...
```

### summary.csv

```csv
condition,document,total_gaps,unique_gaps,useful_gaps,noise_gaps,recall,precision,time_seconds
A,D1,12.4,10.2,7.8,2.0,0.40,0.63,45
B,D1,15.6,13.0,9.2,1.4,0.53,0.59,52
C,D1,18.2,16.4,12.0,1.8,0.60,0.66,180
D,D1,21.0,18.8,15.2,1.2,0.73,0.72,780
...
```

> The numbers above are format examples. Actual values will be determined by the experiment.

---

## 10. Timeline

```
Day 1: Phase 0 -- Create synthetic documents + embed problems
Day 2: Phase 1 first half -- Execute Conditions A, B (automatable)
Day 3: Phase 1 second half -- Execute Conditions C, D (DGE requires manual intervention)
Day 4: Phase 2 -- Gap assessment (blind assessment)
Day 5: Phase 3 -- Retrospective analysis
Day 6: Phase 4 -- Statistical analysis + report writing
```

Total: **approximately 6 days** (executable by a single person)

---

## 11. Threats and Limitations (Threats to Validity)

| Threat | Category | Mitigation |
|--------|----------|------------|
| Author bias (DGE developer performs assessment) | Internal | Blind assessment, pre-defined assessment criteria, full data publication |
| Synthetic documents may not represent real projects | External | Retrospective analysis also covers real projects |
| LLM version dependency | External | Record model name, version, and date for future reproducibility |
| Single assessor | Internal | Pre-define rules for handling ambiguous cases |
| Output varies even at temperature 0 | Internal | Measure variance with 5 repetitions per cell |
| Quality differences in DGE templates themselves | Construct | Use existing templates as-is (no optimization) |
| Checklist comprehensiveness | Construct | Adopt a standard combination of STRIDE + general-purpose checklist |

---

## 12. List of Deliverables

Files to be published after experiment completion:

```
paper/experiment/
├── docs/
│   ├── D1-api-design.md          # Synthetic document
│   ├── D2-feature-planning.md
│   └── D3-security-review.md
├── sealed-answers.md              # Known problem list (published after experiment)
├── results/
│   ├── A/D{1,2,3}/run{1..5}.md   # Raw output for Condition A
│   ├── B/D{1,2,3}/run{1..5}.md   # Raw output for Condition B
│   ├── C/D{1,2,3}/run{1..5}.md   # Raw output for Condition C
│   └── D/D{1,2,3}/run{1..5}.md   # Raw output for Condition D
├── gap-log.csv                    # Assessment results for all gaps
├── summary.csv                    # Aggregation by condition x document
├── retrospective/
│   ├── unlaxer-108-resolution.csv # Resolution assessment for unlaxer gaps
│   ├── unlaxer-baseline-A.md      # Results of applying Condition A to unlaxer
│   ├── unlaxer-baseline-B.md      # Results of applying Condition B to unlaxer
│   ├── askos-16-resolution.csv    # Resolution assessment for AskOS gaps
│   ├── askos-baseline-A.md
│   └── askos-baseline-B.md
├── analysis.py                    # Statistical analysis script
└── experiment-results.md          # Final report
```
