#!/usr/bin/env node
// dve-tool — DVE CLI

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { buildGraph } from "../graph/builder.js";
import { traceDecision, orphanGaps, search } from "../graph/query.js";
import type { DVEGraph, Changelog, Gap, Decision } from "../graph/schema.js";

const CWD = process.cwd();
const DIST_DIR = path.join(CWD, "dve", "dist");

function defaultOpts() {
  return {
    sessionsDir: path.join(CWD, "dge", "sessions"),
    decisionsDir: path.join(CWD, "dge", "decisions"),
    annotationsDir: path.join(CWD, "dve", "annotations"),
  };
}

function build() {
  const start = Date.now();
  const graph = buildGraph(defaultOpts());

  mkdirSync(DIST_DIR, { recursive: true });

  // Changelog: compare with previous graph.json
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
    // Detect status changes
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
  const warnCount = graph.warnings.length;
  const unknownSev = graph.nodes.filter(
    (n) => n.type === "gap" && (n.data as Gap).severity === "Unknown"
  ).length;
  const noMarkers = graph.warnings.filter((w) => w.message.includes("No gap markers")).length;

  console.log(`\nDVE build complete (${elapsed}s):`);
  console.log(`  Sessions:    ${s.sessions}${noMarkers ? ` (${s.sessions - noMarkers} with gaps, ${noMarkers} no markers)` : ""}`);
  console.log(`  Gaps:        ${s.gaps}${unknownSev ? ` (${unknownSev} severity unknown)` : ""}`);
  console.log(`  Decisions:   ${s.decisions}`);
  console.log(`  Annotations: ${s.annotations}`);
  if (warnCount > 0) console.log(`  Warnings:    ${warnCount}`);
  if (changelog && changelog.new_nodes.length > 0) {
    console.log(`  New:         ${changelog.new_nodes.join(", ")}`);
  }
  console.log(`\n  → ${path.join(DIST_DIR, "graph.json")}`);

  return graph;
}

function trace(ddId: string) {
  const graphPath = path.join(DIST_DIR, "graph.json");
  if (!existsSync(graphPath)) {
    console.error("graph.json not found. Run `npx dve build` first.");
    process.exit(1);
  }
  const graph: DVEGraph = JSON.parse(readFileSync(graphPath, "utf-8"));
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

function showOrphans() {
  const graphPath = path.join(DIST_DIR, "graph.json");
  if (!existsSync(graphPath)) {
    console.error("graph.json not found. Run `npx dve build` first.");
    process.exit(1);
  }
  const graph: DVEGraph = JSON.parse(readFileSync(graphPath, "utf-8"));
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

function doSearch(keyword: string) {
  const graphPath = path.join(DIST_DIR, "graph.json");
  if (!existsSync(graphPath)) {
    console.error("graph.json not found. Run `npx dve build` first.");
    process.exit(1);
  }
  const graph: DVEGraph = JSON.parse(readFileSync(graphPath, "utf-8"));
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

// ─── Main ───

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "build":
    build();
    break;
  case "trace":
    if (!args[0]) { console.error("Usage: dve trace <DD-id>"); process.exit(1); }
    trace(args[0]);
    break;
  case "orphans":
    showOrphans();
    break;
  case "search":
    if (!args[0]) { console.error("Usage: dve search <keyword>"); process.exit(1); }
    doSearch(args.join(" "));
    break;
  case "version":
    console.log("DVE toolkit v4.0.0");
    break;
  default:
    console.log(`
  DVE — Decision Visualization Engine

  Usage:
    npx dve build              Build graph.json from sessions/decisions
    npx dve trace <DD-id>      Trace decision back to sessions/gaps
    npx dve orphans            Show gaps not linked to any decision
    npx dve search <keyword>   Search nodes by keyword
    npx dve version            Show version
    `);
}
