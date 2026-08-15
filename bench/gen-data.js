// Synthetic data generator for DVE benchmark.
// Generates N sessions + M decisions + K specs as markdown files into a target dir,
// mimicking the real DxE-suite layout so buildGraph() can parse them.
//
// Usage: node gen-data.js <outRoot> <sessionCount> <decisionsPerSession>

import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const [outRoot, sessCountStr, gapsPerSessStr] = process.argv.slice(2);
const sessCount = parseInt(sessCountStr ?? "100", 10);
const gapsPerSess = parseInt(gapsPerSessStr ?? "5", 10);

if (!outRoot) {
  console.error("Usage: gen-data.js <outRoot> [sessionCount] [gapsPerSession]");
  process.exit(1);
}

const sessDir = path.join(outRoot, "dge", "sessions");
const decDir = path.join(outRoot, "dge", "decisions");
const specDir = path.join(outRoot, "dge", "specs");

if (existsSync(outRoot)) rmSync(outRoot, { recursive: true, force: true });
mkdirSync(sessDir, { recursive: true });
mkdirSync(decDir, { recursive: true });
mkdirSync(specDir, { recursive: true });

const characters = ["先輩", "若手", "アーキテクト", "運用", "顧客", "🌟プロデューサー"];
const categories = ["Architecture", "Performance", "Security", "Usability", "Data", "Process"];
const severities = ["Critical", "High", "Medium", "Low"];
const flows = ["roundtable", "tribunal", "wargame", "pitch", "consult"];

function pad(n, w = 3) { return String(n).padStart(w, "0"); }

// --- Sessions ---
let totalGaps = 0;
for (let i = 1; i <= sessCount; i++) {
  const date = `2026-${pad((i % 12) + 1, 2)}-${pad((i % 28) + 1, 2)}`;
  const sid = `S-${pad(i)}`;
  const chars = [characters[i % characters.length], characters[(i + 1) % characters.length]];
  let body = `# Session ${sid} — テーマ${i}\n\n`;
  body += `date: ${date}\nflow: ${flows[i % flows.length]}\ncharacters: ${chars.join(", ")}\n\n`;
  body += `## Scene 1: 導入\n\n先輩: ここが重要なポイントです。\n若手: なるほど。\n☕\n\n`;
  for (let g = 1; g <= gapsPerSess; g++) {
    totalGaps++;
    body += `\n### Gap #${pad(g)} [${categories[g % categories.length]}] ${severities[g % severities.length]}\n`;
    body += `Gap summary for ${sid} gap ${g}.\n\n`;
  }
  writeFileSync(path.join(sessDir, `${date}-${sid}.md`), body);
}

// --- Decisions: each resolves one gap from one session ---
const decCount = totalGaps;
for (let i = 1; i <= decCount; i++) {
  const ddId = `DD-${pad(i)}`;
  const sessIdx = ((i - 1) % sessCount) + 1;
  const gapIdx = Math.floor((i - 1) / sessCount) + 1;
  const sessDate = `2026-${pad((sessIdx % 12) + 1, 2)}-${pad((sessIdx % 28) + 1, 2)}`;
  const sid = `S-${pad(sessIdx)}`;
  const ddDate = `2026-08-${pad((i % 28) + 1, 2)}`;
  let body = `---\nid: ${ddId}\ndate: ${ddDate}\nstatus: active\n---\n\n`;
  body += `# ${ddId} — Decision ${i}\n\n`;
  body += `Date: ${ddDate}\nStatus: active\nSupersedes: []\n\n`;
  body += `## Rationale\nDecision ${i} rationale text.\n\n`;
  body += `## References\n- Session: [${sid}](dge/sessions/${sessDate}-${sid}.md)\n`;
  body += `- Gap: ${sid}#G-${pad(gapIdx)}\n`;
  if (i > 1 && i % 10 === 0) {
    body += `- Supersedes: DD-${pad(i - 10)}\n`;
  }
  writeFileSync(path.join(decDir, `${ddId}-decision-${i}.md`), body);
}

// --- Specs ---
const specCount = Math.floor(decCount / 5);
for (let i = 1; i <= specCount; i++) {
  const spId = `SPEC-${pad(i)}`;
  const ddRef = `DD-${pad(i * 5)}`;
  let body = `---\nid: ${spId}\ntype: TECH\nstatus: reviewed\n---\n\n`;
  body += `# ${spId} — Spec ${i}\n\nDecision refs: ${ddRef}\n`;
  writeFileSync(path.join(specDir, `${spId}-spec.md`), body);
}

console.log(`Generated: ${sessCount} sessions, ${totalGaps} gaps, ${decCount} decisions, ${specCount} specs`);
console.log(`  → ${outRoot}`);
