# AI Characters Arguing About Your Code. Yes, Really.

> Plain AI reviews what you wrote. DGE finds what you forgot to write.

## TL;DR

- `npm install @unlaxer/dge-toolkit && npx dge-install --lang en`
- Tell Claude Code "run DGE on this"
- Characters argue about your design — and surface gaps plain AI misses
- 3 gaps in 2 minutes. The kind that change your architecture.

### Demo (2 min)

{% youtube 0sG0fMbA_Jo %}

---

## The Problem With AI Code Review

AI review is great at checking what you wrote — missing validation, style violations, known best practices. It's a smart checklist.

But **the hardest bugs live in what you didn't write.** The unstated assumption. The two features that are fine alone but deadly together. The "why JWT?" that nobody asked.

**DGE (Dialogue-driven Gap Extraction)** creates a cast of characters who *argue* about your design. A quality guardian, a lazy genius, an attacker, a philosopher — each with a different blind spot they refuse to ignore.

In between their arguments, gaps emerge.

---

## 30-Second Setup

```bash
npm install @unlaxer/dge-toolkit
npx dge-install --lang en
```

Then in Claude Code:

```
Human: run DGE on the auth API design
```

That's it.

---

## Live Demo: Auth API Review

Here's what actually happened when I DGE'd an auth API:

**👤 Columbo**: "Just one more thing... this refresh token lasts 30 days. Who decided that? Did anyone ask users if they want to stay logged in for a month?"

→ Gap: Refresh token expiration has no documented rationale

**🎩 Picard**: "The login response format is undefined. Do you return tokens in the body? Set-Cookie? And on error — if you tell them 'wrong email' vs 'wrong password', you've leaked whether the account exists."

→ Gap: Login response format undefined + error information leakage

**🎭 Socrates**: "Everyone is assuming JWT. I detect fallacy #5: 'JWT is the modern standard' — says who? If you have one server, sessions work fine. What's the actual reason for JWT?"

→ Gap: No technical rationale for JWT over sessions

**3 gaps in 2 minutes.** These aren't style nits — they change the architecture. The last one — questioning JWT itself — is something plain AI never does. Plain AI accepts your choices and tells you what's missing. DGE questions whether those choices were right.

---

## DGE vs Plain AI: Same Spec, Honest Comparison

I ran both on the same auth API spec. The plain AI ran in an **isolated subprocess** — zero knowledge of DGE's results.

| | DGE | Plain AI (isolated) |
|---|-----|-----|
| Total gaps | **9** | **28** |
| Critical | 2 | 2 |
| High | **6** | 9 |
| DGE-only findings | **3** | — |

Plain AI found 3x more gaps. But look at the content:

**Plain AI**: "Missing CSRF protection", "No HTTPS enforcement", "No password reset flow" — a **best practices checklist**. Valid, but you'd find them in any auth guide.

**DGE-only**: "Why JWT?", "Token expiration doesn't match app type", "Schema breaks when you add OAuth" — these question **design decisions themselves**.

They're complementary. DGE toolkit v2 runs both in parallel and merges results automatically.

### The Isolation Discovery

First time I ran "plain AI" in the same conversation as DGE, it found 15 gaps. In an isolated subprocess: **28 gaps** — 87% more. The AI was unconsciously avoiding DGE's findings. Isolation matters.

---

## Real World: DGE Found an Attack Chain Nobody Designed

This one's from an actual project. I ran DGE with 5 characters on a terminal multiplexer tool. **10 Critical gaps in one session.** Here are two that no single-point review would catch:

### Path Traversal → Data Exfiltration

**⚔ Levi**: "Show me the template duplicate code."
```javascript
const source = path.join(USER_TEMPLATES_DIR, sourceName);
await fs.copy(source, dest);
```
"No sanitization on `sourceName`. Send `../../.ssh/id_ed25519` and your SSH private key gets copied to the templates directory. Then `GET /api/templates` reads it out."

→ Gap: CWE-22 Path Traversal — arbitrary file read via template API

### Two Safe Features → One Dangerous Combo

**🏥 House**: "The `/mnt/c/var` mount is read-write. The auto-accept feature sends `y` to confirmation prompts. Now imagine a process asks `Delete all files? (y/n)` — auto-accept sends `y`. Two features, both fine alone, deadly together."

→ Gap: RW mount + auto-accept = unintended file destruction

**These aren't single-point bugs.** They're *combinations* that emerge because characters build on each other's findings. A checklist review says "add input validation" and "add authentication" separately. DGE characters chain them into attack paths.

---

## What's Inside

- **19 characters** (Columbo, Picard, Holmes, Red Team, Socrates...) — each with distinct blind spots
- **3 modes**: Quick (instant), Design Review (structured), Brainstorm (ideas)
- **Custom characters**: `add Batman` — personality analyzed, saved, available next session
- **Multi-tool**: Works with Claude Code, Codex, Gemini CLI, and Cursor out of the box
- **20 conversation patterns** × **8 dialogue techniques** — not random arguing, structured exploration

Details: [GitHub](https://github.com/opaopa6969/DGE-toolkit) · [INTERNALS.md](https://github.com/opaopa6969/DGE-toolkit/blob/main/kit/INTERNALS.en.md) · [CUSTOMIZING.md](https://github.com/opaopa6969/DGE-toolkit/blob/main/kit/CUSTOMIZING.en.md)

---

## How DGE Was Born

While developing the parser framework [unlaxer-parser](https://github.com/opaopa6969/unlaxer-parser), I had Claude doing the coding and documentation. One day, Claude discovered a **palindrome parser** buried deep in the codebase. From there, it noticed the unique properties of unlaxer's PropagationStopper and argued: "this should be a paper."

"Fine, write it then." And it did. It was actually good.

But there was nobody around to peer-review it. So I thought — let's have **fictional reviewers at a fictional conference** review it. Three reviewers independently evaluated the paper and source code, then characters argued and defended against those reviews.

**5 review plays found 108 gaps.** I fell in love with the method and packaged it as DGE toolkit so anyone could use it.

- Full review plays: [unlaxer-parser DGE papers](https://github.com/opaopa6969/unlaxer-parser/blob/master/paper/INDEX.md)
- DGE toolkit: [GitHub](https://github.com/opaopa6969/DGE-toolkit)

---

*DGE catches what you forgot to write. Plain AI catches what you wrote wrong. You need both.*

*npm: `@unlaxer/dge-toolkit` · MIT License*
