// DVE engine benchmark — measures buildGraph() and query performance.
// Runs across multiple data sizes to measure scaling.
//
// Usage: node bench.js
//
// Reads the compiled DVE from ../dve/kit/dist (must run `tsc` first).

import { mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DVE_DIST = path.join(REPO_ROOT, "dve", "kit", "dist");

if (!existsSync(DVE_DIST)) {
  console.error("dve/kit/dist not found. Run `npx tsc -p dve/kit/tsconfig.json` first.");
  process.exit(1);
}

// Import compiled DVE modules.
const { buildGraph } = await import(path.join(DVE_DIST, "graph", "builder.js"));
const { traceDecision, impactOf, orphanGaps, search } = await import(path.join(DVE_DIST, "graph", "query.js"));

// ─── Benchmark harness ───

function fmtMs(ns) {
  return (ns / 1e6).toFixed(1);
}

function time(fn, runs = 3) {
  // warmup
  fn();
  const samples = [];
  for (let r = 0; r < runs; r++) {
    const t = process.hrtime.bigint();
    fn();
    samples.push(Number(process.hrtime.bigint() - t));
  }
  const min = Math.min(...samples);
  const med = samples.sort((a, b) => a - b)[Math.floor(samples.length / 2)];
  return { min, med, samples };
}

function summarize(results) {
  const lines = [];
  lines.push("size,build_ms,trace_ms,impact_ms,orphans_ms,search_ms,nodes,edges");
  for (const r of results) {
    lines.push(
      `${r.label},${fmtMs(r.build.med)},${fmtMs(r.trace.med)},${fmtMs(r.impact.med)},${fmtMs(r.orphans.med)},${fmtMs(r.search.med)},${r.nodes},${r.edges}`
    );
  }
  return lines.join("\n");
}

// ─── Run sizes ───

const sizes = [
  { label: "100s_5g",  s: 100,  g: 5   },
  { label: "500s_10g", s: 500,  g: 10  },
  { label: "1000s_10g", s: 1000, g: 10 },
  { label: "2000s_10g", s: 2000, g: 10 },
  { label: "4000s_10g", s: 4000, g: 10 },
];

const results = [];

for (const sz of sizes) {
  const dataRoot = path.join(__dirname, "data", sz.label);
  console.log(`\n=== ${sz.label} (sessions=${sz.s}, gaps/sess=${sz.g}) ===`);

  // Generate data
  const gen = spawnSync(process.execPath, [path.join(__dirname, "gen-data.js"), dataRoot, String(sz.s), String(sz.g)], {
    encoding: "utf-8",
  });
  if (gen.status !== 0) {
    console.error("gen-data failed:", gen.stderr);
    process.exit(1);
  }
  console.log("  " + gen.stdout.trim().replace(/\n/g, "\n  "));

  // Build graph
  const buildRes = time(() => {
    const g = buildGraph({
      sessionsDir: path.join(dataRoot, "dge", "sessions"),
      decisionsDir: path.join(dataRoot, "dge", "decisions"),
      specsDir: path.join(dataRoot, "dge", "specs"),
      annotationsDir: path.join(dataRoot, "dve", "annotations"),
      cwd: dataRoot,
      enableGitLinker: false, // git linker needs a git repo; disabled for synthetic
    });
    return g;
  }, 3);

  // Re-build once to get a stable graph for queries
  const graph = buildGraph({
    sessionsDir: path.join(dataRoot, "dge", "sessions"),
    decisionsDir: path.join(dataRoot, "dge", "decisions"),
    specsDir: path.join(dataRoot, "dge", "specs"),
    annotationsDir: path.join(dataRoot, "dve", "annotations"),
    cwd: dataRoot,
    enableGitLinker: false,
  });

  // Pick a decision id that exists (last one)
  const decNodes = graph.nodes.filter((n) => n.type === "decision");
  const targetId = decNodes[decNodes.length - 1]?.id ?? "DD-001";
  const searchKw = "Decision";

  // Trace
  const traceRes = time(() => traceDecision(graph, targetId), 5);
  // Impact
  const impactRes = time(() => impactOf(graph, targetId), 5);
  // Orphans
  const orphansRes = time(() => orphanGaps(graph), 5);
  // Search
  const searchRes = time(() => search(graph, searchKw), 5);

  const r = {
    label: sz.label,
    build: buildRes,
    trace: traceRes,
    impact: impactRes,
    orphans: orphansRes,
    search: searchRes,
    nodes: graph.nodes.length,
    edges: graph.edges.length,
  };
  results.push(r);
  console.log(
    `  nodes=${r.nodes} edges=${r.edges}\n` +
    `  build=${fmtMs(r.build.med)}ms  trace=${fmtMs(r.trace.med)}ms  impact=${fmtMs(r.impact.med)}ms\n` +
    `  orphans=${fmtMs(r.orphans.med)}ms  search=${fmtMs(r.search.med)}ms`
  );

  // Clean up data to save disk for large runs
  if (sz.s >= 1000) {
    rmSync(dataRoot, { recursive: true, force: true });
  }
}

console.log("\n=== Summary (median ms) ===");
console.log(summarize(results));

// Write results to file
const outPath = path.join(__dirname, "results-baseline.csv");
import { writeFileSync as wfs2 } from "node:fs";
wfs2(outPath, summarize(results) + "\n");
console.log(`\nWritten: ${outPath}`);
