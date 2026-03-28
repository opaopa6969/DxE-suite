# DGE Paper — Review Dialogue v1

## Reviewers

```
Reviewer A: 方法論原理主義者（Dr. ハウス系）
  専門: ソフトウェア工学の方法論、エビデンスベース SE
  性格: 再現性と厳密さを最重要視。「感覚」で書かれた論文が嫌い。

Reviewer B: 実務家（リヴァイ系）
  専門: プロダクション環境の SE、DevOps
  性格: 「で、現場で使えるの？」しか聞かない。理論嫌い。

Reviewer C: HCI / 創造性研究者（千石系）
  専門: 人間とAIの協調、創造性支援ツール
  性格: アイデアは評価するが、主張の裏付けに厳しい。
```

---

## Reviewer A: Reject (Major Revision Required)

### Summary
The paper presents an interesting idea — using fictional character personas to guide adversarial design reviews — but the evaluation is fundamentally weak. The claims are not supported by the evidence presented.

### Major Issues

**A1. Confounded comparison (Section 5.1).**
The paper claims "3.5x more gaps than traditional review" by comparing v2→v3 (31 gaps, traditional) with v3→v4 (108 gaps, DGE). The authors acknowledge that the v3→v4 transition was larger in scope, but dismiss this as a threat to validity. This is not a threat to validity — it is a fatal flaw. The gap count difference could be entirely explained by scope difference, not methodology difference. The same developer, the same project, different scope — this comparison proves nothing.

**A2. No controlled experiment.**
To claim DGE finds gaps that traditional review misses, you need to compare DGE and traditional review on the **same artifact at the same time**. The current evaluation is a before-after comparison with multiple confounding variables. At minimum, provide a crossover study: two artifacts, one reviewed with DGE first then traditional, the other in reverse order.

**A3. "73% of gaps were in categories not examined" is circular.**
Of course DGE finds gaps in new categories — you introduced new gap categories (business, legal, messaging) that didn't exist in the traditional review framework. This is not DGE discovering new gaps; it is the new taxonomy creating new categories. Restate this claim more carefully.

**A4. Gap quality is not assessed.**
108 gaps were found, but how many were actionable? How many were false positives? The paper says "97 of 108 were resolved" but resolution could mean "closed as won't-fix." Provide a breakdown: fixed, deferred, rejected, duplicate.

### Minor Issues
- The Imaizumi Method's five question types are interesting but not validated. Do they actually produce different gap types? Show the distribution.
- The "name as interface" principle is asserted but not tested. Compare "review like Sengoku" vs "review with high quality standards" in an LLM experiment.

### Verdict: Reject → Major Revision

---

## Reviewer B: Major Revision

### Summary
I like the toolkit. I could use it tomorrow. But the paper reads like a manifesto, not a research paper. Too much philosophy, not enough evidence.

### Major Issues

**B1. Show me the gaps, not the conversation.**
The paper spends pages describing character personalities and dialogue formats. I want to see the actual gaps. Table 2 (gap categories) has 6 rows with counts. That's not enough. Show 20 representative gaps with their before/after: what was the spec before DGE, what gap was found, what was the fix. Without this, I can't judge whether the gaps are real or noise.

**B2. How long does a DGE session take?**
The paper says "10-30 minutes" for generation and "5-10 minutes" for review. But the AskOS case study produced 14,978 lines in 11 sessions. That's an average of 1,361 lines per session. Even with LLM generation, that's more than 30 minutes. Be honest about the time investment and compare it with the time saved.

**B3. Integration effort is understated.**
"Copy two files to .claude/skills/" — but the skills reference templates, templates reference characters, characters reference prompts. The dependency chain is longer than implied. Quantify: how many minutes from zero to first DGE session?

**B4. No failure cases.**
Every case study is a success story. When does DGE fail? When do characters produce useless output? When does the human review reject 80% of the gaps? Show the failure mode.

### Minor Issues
- The toolkit's Markdown-based format is pragmatic but fragile. What if the LLM ignores the character prompt?
- "Senpai" as a role name may confuse non-Japanese readers. Consider "Narrator" as the primary term.

### Verdict: Major Revision

---

## Reviewer C: Weak Accept (Minor Revision)

### Summary
This is a creative and potentially impactful contribution. The use of well-known fictional characters as design review personas is novel and well-motivated. The "name as interface" principle is a genuine insight that extends beyond DGE to LLM-persona research in general. However, several claims need strengthening.

### Issues

**C1. Character selection bias.**
The paper recommends character combinations (Table: "API design → Imaizumi + Sengoku + Boku") but does not justify these recommendations empirically. Are these the result of experimentation, or intuition? If intuition, say so honestly. If experimentation, show the data.

**C2. The double meaning of DGE is clever but may confuse.**
"Design-Gap Exploration" and "Dialogue-driven Gap Extraction" are both valid names, but using both simultaneously in an academic paper creates ambiguity. Pick one as the primary definition and acknowledge the other as a mnemonic. I suggest leading with "Design-Gap Exploration" (the what) and presenting "Dialogue-driven Gap Extraction" as the method (the how).

**C3. The human review step needs more emphasis.**
Section 3.7 mentions that human review "often discovers gaps that the characters missed" but provides no quantification. What percentage of final gaps came from the human review step vs the generated dialogue? This is critical for understanding the human-AI division of labor.

**C4. Cultural transferability.**
All characters are from Japanese or American media. Will this methodology work with characters from Chinese literature (Three Kingdoms), Indian mythology, or European fiction? The custom character feature addresses this architecturally, but has it been tested?

### Strengths
- The toolkit is immediately usable
- The case studies are real (10^9 transactions/month is impressive)
- The Imaizumi Method is a genuine contribution to design review practice
- The Senpai/Narrator role is a useful innovation for LLM-driven dialogues

### Verdict: Weak Accept → Minor Revision
