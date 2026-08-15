import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DVE_DIST = path.join(REPO_ROOT, "dve", "kit", "dist");

const { buildGraph } = await import(path.join(DVE_DIST, "graph", "builder.js"));
const { parseSession } = await import(path.join(DVE_DIST, "parser", "session-parser.js"));
const { parseDecision } = await import(path.join(DVE_DIST, "parser", "decision-parser.js"));
const { parseSpec } = await import(path.join(DVE_DIST, "parser", "spec-parser.js"));

const dataRoot = path.join(__dirname, "data", "4000s_10g");
const gen = spawnSync(process.execPath, [path.join(__dirname, "gen-data.js"), dataRoot, "4000", "10"], { encoding: "utf-8" });
console.log(gen.stdout.trim());

const sessDir = path.join(dataRoot, "dge", "sessions");
const decDir = path.join(dataRoot, "dge", "decisions");
const specDir = path.join(dataRoot, "dge", "specs");

const sessFiles = readdirSync(sessDir).filter(f => f.endsWith(".md")).map(f => path.join(sessDir, f));
const decFiles = readdirSync(decDir).filter(f => f.endsWith(".md") && f !== "index.md").map(f => path.join(decDir, f));
const specFiles = readdirSync(specDir).filter(f => f.endsWith(".md")).map(f => path.join(specDir, f));

function timeIt(label, fn, runs = 3) {
  fn();
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const t = process.hrtime.bigint();
    fn();
    samples.push(Number(process.hrtime.bigint() - t) / 1e6);
  }
  samples.sort((a, b) => a - b);
  console.log(`  ${label}: ${samples[Math.floor(samples.length / 2)].toFixed(1)}ms`);
}

console.log(`\nfiles: sessions=${sessFiles.length} decisions=${decFiles.length} specs=${specFiles.length}`);
timeIt("parseSession (all)", () => { for (const f of sessFiles) parseSession(f); });
timeIt("parseDecision (all)", () => { for (const f of decFiles) parseDecision(f); });
timeIt("parseSpec (all)",   () => { for (const f of specFiles) parseSpec(f); });
timeIt("buildGraph (full)", () => {
  buildGraph({
    sessionsDir: sessDir, decisionsDir: decDir, specsDir: specDir,
    annotationsDir: path.join(dataRoot, "dve", "annotations"),
    cwd: dataRoot, enableGitLinker: false,
  });
});
