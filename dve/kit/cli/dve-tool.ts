#!/usr/bin/env node
// dve-tool — DVE CLI

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { buildGraph } from "../graph/builder.js";
import { traceDecision, impactOf, orphanGaps, search } from "../graph/query.js";
import { generateBundle } from "../context/bundle.js";
import type { DVEGraph, Changelog, Gap } from "../graph/schema.js";

const CWD = process.cwd();
const DIST_DIR = path.join(CWD, "dve", "dist");
const ANN_DIR = path.join(CWD, "dve", "annotations");
const CTX_DIR = path.join(CWD, "dve", "contexts");

function defaultOpts() {
  return {
    sessionsDir: path.join(CWD, "dge", "sessions"),
    decisionsDir: path.join(CWD, "dge", "decisions"),
    annotationsDir: ANN_DIR,
  };
}

function loadGraph(): DVEGraph {
  const p = path.join(DIST_DIR, "graph.json");
  if (!existsSync(p)) {
    console.error("graph.json not found. Run `dve build` first.");
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, "utf-8"));
}

// ─── build ───

function build() {
  const start = Date.now();
  const graph = buildGraph(defaultOpts());

  mkdirSync(DIST_DIR, { recursive: true });

  const prevPath = path.join(DIST_DIR, "graph.json");
  let changelog: Changelog | null = null;
  if (existsSync(prevPath)) {
    const prev: DVEGraph = JSON.parse(readFileSync(prevPath, "utf-8"));
    const prevIds = new Set(prev.nodes.map((n) => n.id));
    const currIds = new Set(graph.nodes.map((n) => n.id));
    changelog = {
      since: prev.generated_at,
      new_nodes: graph.nodes.filter((n) => !prevIds.has(n.id)).map((n) => n.id),
      removed_nodes: prev.nodes.filter((n) => !currIds.has(n.id)).map((n) => n.id),
      changed_statuses: [],
    };
    for (const node of graph.nodes) {
      if (node.type === "decision") {
        const prevNode = prev.nodes.find((n) => n.id === node.id);
        if (prevNode && (prevNode.data as any).status !== (node.data as any).status) {
          changelog.changed_statuses.push({
            id: node.id,
            from: (prevNode.data as any).status,
            to: (node.data as any).status,
          });
        }
      }
    }
  }

  writeFileSync(path.join(DIST_DIR, "graph.json"), JSON.stringify(graph, null, 2));
  if (changelog) {
    writeFileSync(path.join(DIST_DIR, "changelog.json"), JSON.stringify(changelog, null, 2));
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const s = graph.stats;
  const unknownSev = graph.nodes.filter(
    (n) => n.type === "gap" && (n.data as Gap).severity === "Unknown"
  ).length;
  const noMarkers = graph.warnings.filter((w) => w.message.includes("No gap markers")).length;

  console.log(`\nDVE build complete (${elapsed}s):`);
  console.log(`  Sessions:    ${s.sessions}${noMarkers ? ` (${s.sessions - noMarkers} with gaps, ${noMarkers} no markers)` : ""}`);
  console.log(`  Gaps:        ${s.gaps}${unknownSev ? ` (${unknownSev} severity unknown)` : ""}`);
  console.log(`  Decisions:   ${s.decisions}`);
  console.log(`  Annotations: ${s.annotations}`);
  if (graph.warnings.length > 0) console.log(`  Warnings:    ${graph.warnings.length}`);
  if (changelog && changelog.new_nodes.length > 0) {
    console.log(`  New:         ${changelog.new_nodes.length} nodes`);
  }
  console.log(`\n  → ${path.join(DIST_DIR, "graph.json")}`);

  return graph;
}

// ─── serve ───

async function serve(watch: boolean) {
  const { execSync, spawn } = await import("child_process");
  const appDir = path.join(CWD, "dve", "app");

  if (!existsSync(path.join(DIST_DIR, "graph.json"))) {
    console.log("graph.json not found, building...");
    build();
  }

  if (!existsSync(path.join(appDir, "node_modules"))) {
    console.log("Installing app dependencies...");
    execSync("npm install", { cwd: appDir, stdio: "inherit" });
  }

  // Build app if dist/index.html doesn't exist
  if (!existsSync(path.join(DIST_DIR, "index.html"))) {
    console.log("Building Web UI...");
    execSync("npx vite build", { cwd: appDir, stdio: "inherit" });
  }

  if (watch) {
    console.log("\nWatching for changes...");
    const chokidar = await import("chokidar");
    const dirs = [
      path.join(CWD, "dge", "sessions"),
      path.join(CWD, "dge", "decisions"),
      ANN_DIR,
    ];

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const watcher = chokidar.watch(dirs, {
      ignoreInitial: true,
      ignored: /(^|[\/\\])\../,
    });

    watcher.on("all", (event: string, filePath: string) => {
      if (!filePath.endsWith(".md")) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        console.log(`\n  [${event}] ${path.relative(CWD, filePath)}`);
        build();
      }, 500);
    });
  }

  // Serve with vite preview
  console.log(`\nStarting server...`);
  const vite = spawn("npx", ["vite", "preview", "--port", "4173"], {
    cwd: appDir,
    stdio: "inherit",
  });
  vite.on("close", (code) => process.exit(code ?? 0));
}

// ─── trace ───

function trace(ddId: string) {
  const graph = loadGraph();
  const chain = traceDecision(graph, ddId);

  if (chain.length === 0) {
    console.error(`${ddId} not found in graph.`);
    process.exit(1);
  }

  console.log(`\nTrace: ${ddId}\n`);
  for (const node of chain) {
    const data = node.data as any;
    switch (node.type) {
      case "decision":
        console.log(`  DD  ${node.id}: ${data.title} (${data.date}) [${data.status}]`);
        break;
      case "gap":
        console.log(`    ← Gap ${node.id}: ${data.summary} (${data.severity})`);
        break;
      case "session":
        console.log(`    ← Session: ${node.id} (${(data.characters ?? []).join(", ")})`);
        break;
      default:
        console.log(`    ← ${node.type}: ${node.id}`);
    }
  }
}

// ─── impact ───

function impact(nodeId: string) {
  const graph = loadGraph();
  const affected = impactOf(graph, nodeId);

  if (affected.length === 0) {
    console.log(`\nNo downstream impact from ${nodeId}.`);
    return;
  }

  console.log(`\nImpact of ${nodeId} (${affected.length} affected):\n`);
  for (const node of affected) {
    const data = node.data as any;
    const label = data.title ?? data.summary ?? data.theme ?? "";
    console.log(`  ${node.type.padEnd(10)} ${node.id}: ${label}`);
  }
}

// ─── orphans ───

function showOrphans() {
  const graph = loadGraph();
  const orphans = orphanGaps(graph);

  if (orphans.length === 0) {
    console.log("\nNo orphan gaps. All gaps are linked to decisions.");
    return;
  }

  console.log(`\nOrphan gaps (${orphans.length} — no decision linked):\n`);
  for (const gap of orphans) {
    const data = gap.data as Gap;
    console.log(`  ${gap.id}: ${data.summary} (${data.severity})`);
  }
}

// ─── search ───

function doSearch(keyword: string) {
  const graph = loadGraph();
  const results = search(graph, keyword);

  if (results.length === 0) {
    console.log(`\nNo results for "${keyword}".`);
    return;
  }

  console.log(`\nSearch "${keyword}" (${results.length} results):\n`);
  for (const node of results) {
    const data = node.data as any;
    const label = data.title ?? data.theme ?? data.summary ?? data.body?.slice(0, 60) ?? "";
    console.log(`  ${node.type.padEnd(10)} ${node.id}: ${label}`);
  }
}

// ─── annotate ───

function annotate(targetId: string, action: string, body: string) {
  mkdirSync(ANN_DIR, { recursive: true });

  const existing = existsSync(ANN_DIR)
    ? readdirSync(ANN_DIR).filter((f) => f.endsWith(".md")).length
    : 0;
  const annNum = String(existing + 1).padStart(3, "0");
  const slug = targetId.replace(/[^a-zA-Z0-9-]/g, "_");
  const filename = `${annNum}-${slug}-${action}.md`;
  const filePath = path.join(ANN_DIR, filename);

  const content = `---
target: ${targetId}
action: ${action}
date: ${new Date().toISOString().split("T")[0]}
---

${body}
`;

  writeFileSync(filePath, content);
  console.log(`\nAnnotation created: ${filePath}`);
}

// ─── context ───

function context(originId: string, constraints: string[]) {
  const graph = loadGraph();
  const bundle = generateBundle({
    graph,
    originId,
    constraints,
    outputDir: CTX_DIR,
  });

  console.log(`\nContextBundle generated.`);
  console.log(`  Action: ${bundle.suggested_action}`);
  console.log(`  Theme:  ${bundle.summary.theme}`);
  console.log(`\n--- prompt (copy to DGE) ---\n`);
  console.log(bundle.prompt_template);
  console.log(`\n---`);
}

// ─── Main ───

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "build":
    build();
    break;
  case "serve":
    serve(args.includes("--watch") || args.includes("-w"));
    break;
  case "trace":
    if (!args[0]) { console.error("Usage: dve trace <DD-id>"); process.exit(1); }
    trace(args[0]);
    break;
  case "impact":
    if (!args[0]) { console.error("Usage: dve impact <node-id>"); process.exit(1); }
    impact(args[0]);
    break;
  case "orphans":
    showOrphans();
    break;
  case "search":
    if (!args[0]) { console.error("Usage: dve search <keyword>"); process.exit(1); }
    doSearch(args.join(" "));
    break;
  case "annotate": {
    const target = args[0];
    const actionFlag = args.find((a) => a.startsWith("--action="))?.split("=")[1]
      ?? args[args.indexOf("--action") + 1]
      ?? "comment";
    const bodyFlag = args.find((a) => a.startsWith("--body="))?.split("=")[1]
      ?? args[args.indexOf("--body") + 1]
      ?? "";
    if (!target || !bodyFlag) {
      console.error('Usage: dve annotate <target-id> --action <type> --body "text"');
      process.exit(1);
    }
    annotate(target, actionFlag, bodyFlag);
    break;
  }
  case "context": {
    const origin = args[0];
    const constraintArgs = args.filter((a) => a.startsWith("--constraint=")).map((a) => a.split("=")[1]);
    if (!origin) { console.error("Usage: dve context <node-id> [--constraint=...]"); process.exit(1); }
    context(origin, constraintArgs);
    break;
  }
  case "version":
    console.log("DVE toolkit v4.0.0");
    break;
  default:
    console.log(`
  DVE — Decision Visualization Engine

  Commands:
    build                           Build graph.json from sessions/decisions
    serve [--watch]                 Start web UI (with optional file watching)
    trace <DD-id>                   Trace decision back to sessions/gaps
    impact <node-id>                Show downstream impact of a node
    orphans                         Show gaps not linked to any decision
    search <keyword>                Search nodes by keyword
    annotate <id> --action <type> --body "text"
                                    Create annotation (comment/fork/overturn/constrain/drift)
    context <id> [--constraint=...] Generate ContextBundle for DGE restart
    version                         Show version
    `);
}
