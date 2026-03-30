# I Made My AI Reviewer Argue With Itself — and It Found Bugs I Never Would

> Spec review catches what's written. DGE catches what's NOT written.

## TL;DR

- `npm install @unlaxer/dge-toolkit && npx dge-install`
- Tell Claude Code "run DGE on this"
- Characters start arguing about your design — and find gaps in your spec
- It's fun. That's the main selling point.

---

## Design reviews are boring. Let's fix that.

Pull request reviews. Spec reviews. Architecture reviews. They all follow the same pattern: someone reads the document, points out what's wrong, and everyone moves on.

**DGE (Dialogue-driven Gap Extraction)** takes a different approach. Instead of a single reviewer, it creates a cast of characters who *argue* about your design.

A quality guardian says "this is an insult to the user." A lazy genius replies "do we even need this? Tea, please." A small-scale survivor whispers "can we... make this smaller?" And an ancient philosopher asks "why do you think JWT is the right choice? Who told you that?"

In between their arguments, gaps emerge — things nobody wrote in the spec.

---

## 30-Second Setup

In your project root:

```bash
npm install @unlaxer/dge-toolkit
npx dge-install
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

→ Gap: No technical rationale for JWT over sessions (sophistry #5 detected)

**3 gaps in 2 minutes.** The last one — questioning JWT itself — is something a plain AI review would never suggest. Plain AI accepts JWT as given and tells you what's missing. DGE questions whether you should use it at all.

---

## The Experiment: DGE vs Plain AI

I ran both on the same auth API spec. The twist: the plain AI ran in an **isolated subprocess** with zero knowledge of DGE's results.

| | DGE | Plain AI (isolated) |
|---|-----|-----|
| Total gaps | **9** | **28** |
| Critical | 2 | 2 |
| High | **6** | 9 |
| DGE-only findings | **3** | — |

Plain AI found 3x more gaps. But look at the content:

**Plain AI's gaps**: "Missing CSRF protection", "No HTTPS enforcement", "No password reset flow", "Missing MFA" — these are a **best practices checklist**. Valid, but you'd find them in any auth guide.

**DGE-only gaps**: "Why JWT?", "Token expiration doesn't match app type", "Schema breaks when you add OAuth" — these question the **design decisions themselves**. Plain AI never does this.

### The Bias Discovery

When I first ran "plain AI" in the same conversation as DGE, it found 15 gaps. When I ran it in an isolated subprocess (no DGE context), it found **28 gaps** — 87% more.

The AI was unconsciously avoiding DGE's findings. **Isolation matters for honest comparison.**

DGE toolkit v2 does this automatically — runs both in parallel, isolated, and merges the results.

---

## Real World: DGE Found a Path Traversal + Auto-Accept Kill Chain

This one's from an actual project — a personal terminal multiplexer tool (not production, just my own dev setup). I ran DGE with Sengoku (quality), Red Team (attacker), House (hidden problems), Imaizumi (assumptions), and Saul (legal).

**10 Critical gaps in one session.** Here are the top 3 that a plain review would never combine:

### The Template API Path Traversal

**⚔ Levi**: "Show me the template duplicate code."
```javascript
const source = path.join(USER_TEMPLATES_DIR, sourceName);
await fs.copy(source, dest);
```
"No sanitization on `sourceName`. Send `../../.ssh/id_ed25519` and your SSH private key gets copied to the templates directory. Then `GET /api/templates` reads it out. Game over."

→ Gap: CWE-22 Path Traversal — arbitrary file read via template API

### The Windows File Destruction Combo

**🏥 House** (barging in uninvited): "One more thing. `/mnt/c/var` is mounted read-write. The auto-accept feature sends `y` to confirmation prompts. Now imagine a process asks `Delete all files in /mnt/c/var? (y/n)` — auto-accept sends `y`. Your Windows data is gone. Nobody designed this attack. It's an *emergent* kill chain from two features that were never meant to interact."

→ Gap: RW mount + auto-accept = unintended file destruction vector

### The Cross-Session Mislinking

**🎭 Socrates**: "Everyone assumes `setMetadata` is safe. But look — it's read-modify-write with `await` in between. Another request can overwrite during the gap. If auto-accept targets the wrong session because metadata got corrupted by a race condition..."

→ Gap: Metadata race condition → auto-accept sends `y` to the wrong session

**None of these are single-point bugs.** They're *combinations* — path traversal + API exposure, RW mount + auto-accept, race condition + auto-accept. A plain AI review would list "add input validation" and "add authentication" separately. DGE characters combined them into attack chains because they argue *with each other*, building on each other's findings.

*(This was a personal tool, not deployed publicly. But if it had been... yeah.)*

---

## 19 Characters × 8 Dialogue Techniques × 20 Patterns

DGE isn't just random arguing. It's structured:

**Characters** (19 built-in, English + Japanese):
```
Columbo     — "Just one more thing..." (questions assumptions)
Picard      — "Make it so" (quality standards)
Holmes      — "Boring! Do we need this?" (simplification)
Charlie Brown — "Good grief... smaller?" (scope control)
Red Team    — "What if a competitor does this?" (attack scenarios)
Socrates    — Detects logical fallacies by NUMBER (19 types)
House       — "Everybody lies" (hidden problems)
+ 12 more
```

**Dialogue Techniques** (8):
- Five Whys, Six Thinking Hats, Strawman→Steelman, Socratic Method, Devil's Advocate, Yes-and, Lateral Thinking, Sophistry Detection (19 patterns)

**Conversation Patterns** (20):
- `zero-state` (what happens with no data?)
- `security-adversary` (attacker's perspective)
- `scale-break` (N=1 works, N=100K?)
- `disaster-recovery` (DB goes down, then what?)
- 16 more, with 9 presets

---

## Custom Characters

```
Human: add Guts from Berserk
```

The LLM analyzes personality, quotes, trauma, growth arc — saves permanently. Next session, Guts is available.

Or create original characters through a wizard:
```
Q: What's this character's name?
Q: What situation do they shine in?
Q: Cautious or decisive?
Q: Any catchphrases?
→ Character generated, saved to dge/custom/characters/
```

---

## Three Modes

- **⚡ Quick**: "run DGE" → instant dialogue → gaps
- **🔍 Design Review**: templates, patterns, character selection → dialogue → specs
- **💡 Brainstorm**: "brainstorm this" → Yes-and dialogue → ideas

Auto-detected from your input. No mode selection needed.

---

## How It Works Inside

```
Your input → Flow detection → Character selection → Dialogue generation
     ↓                                                      ↓
  Background: isolated plain LLM review              Gap extraction
     ↓                                                      ↓
  Merge results (DGE-only / Plain-only / Both)     Save to file
     ↓
  Summary + numbered choices (MUST: never skip)
```

The `dge-tool` CLI enforces critical rules via code, not just prompts:
- `dge-tool save` — guaranteed file save
- `dge-tool prompt` — guaranteed choice display
- `dge-tool compare` — structured gap comparison

---

## Links

- **npm**: `@unlaxer/dge-toolkit`
- **GitHub**: [DGE-toolkit](https://github.com/opaopa6969/DGE-toolkit)
- **Internals**: [INTERNALS.md](https://github.com/opaopa6969/DGE-toolkit/blob/main/kit/INTERNALS.md) (mermaid flow diagrams)
- **Customizing**: [CUSTOMIZING.md](https://github.com/opaopa6969/DGE-toolkit/blob/main/kit/CUSTOMIZING.md) (fork guide)
- **Real-world use**: [unlaxer-parser DGE papers](https://github.com/opaopa6969/unlaxer-parser/blob/main/paper/INDEX.md)

---

*DGE won't make your code 10x better. But it will make design reviews fun. And Socrates calling out your logical fallacies by number is worth the install alone.*
