#!/usr/bin/env node
// dve-tool — DVE CLI
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { buildGraph } from "../graph/builder.js";
import { traceDecision, impactOf, orphanGaps, search } from "../graph/query.js";
import { generateBundle } from "../context/bundle.js";
import { loadConfig, singleProjectConfig, resolveProjectDirs } from "../config.js";
import { startAPIServer } from "../server/api.js";
import { clusterBySupersedes } from "../graph/cluster.js";
import { detectDrift } from "../parser/drift-detector.js";
import { detectProjectState } from "../parser/state-detector.js";
const CWD = process.cwd();
const CONFIG_PATH = path.join(CWD, "dve.config.json");
const config = loadConfig(CONFIG_PATH) ?? singleProjectConfig(CWD);
const DIST_DIR = path.resolve(config.outputDir.startsWith("/") ? config.outputDir : path.join(CWD, config.outputDir));
function annDir(projectPath) {
    return path.join(projectPath ?? CWD, "dve", "annotations");
}
function ctxDir(projectPath) {
    return path.join(projectPath ?? CWD, "dve", "contexts");
}
function loadGraph(projectName) {
    const filename = projectName ? `graph-${projectName}.json` : "graph.json";
    const p = path.join(DIST_DIR, filename);
    // Fallback to graph.json for single project
    const fallback = path.join(DIST_DIR, "graph.json");
    const target = existsSync(p) ? p : fallback;
    if (!existsSync(target)) {
        console.error("graph.json not found. Run `dve build` first.");
        process.exit(1);
    }
    return JSON.parse(readFileSync(target, "utf-8"));
}
function buildChangelog(prev, curr) {
    if (!prev)
        return null;
    const prevIds = new Set(prev.nodes.map((n) => n.id));
    const currIds = new Set(curr.nodes.map((n) => n.id));
    const changelog = {
        since: prev.generated_at,
        new_nodes: curr.nodes.filter((n) => !prevIds.has(n.id)).map((n) => n.id),
        removed_nodes: prev.nodes.filter((n) => !currIds.has(n.id)).map((n) => n.id),
        changed_statuses: [],
    };
    for (const node of curr.nodes) {
        if (node.type === "decision") {
            const prevNode = prev.nodes.find((n) => n.id === node.id);
            if (prevNode && prevNode.data.status !== node.data.status) {
                changelog.changed_statuses.push({
                    id: node.id, from: prevNode.data.status, to: node.data.status,
                });
            }
        }
    }
    return changelog;
}
function printBuildReport(name, graph, changelog, elapsed) {
    const s = graph.stats;
    const unknownSev = graph.nodes.filter((n) => n.type === "gap" && n.data.severity === "Unknown").length;
    const noMarkers = graph.warnings.filter((w) => w.message.includes("No gap markers")).length;
    console.log(`\n  [${name}] (${elapsed}s):`);
    console.log(`    Sessions:    ${s.sessions}${noMarkers ? ` (${s.sessions - noMarkers} with gaps, ${noMarkers} no markers)` : ""}`);
    console.log(`    Gaps:        ${s.gaps}${unknownSev ? ` (${unknownSev} severity unknown)` : ""}`);
    console.log(`    Decisions:   ${s.decisions}`);
    if (s.specs)
        console.log(`    Specs:       ${s.specs}`);
    console.log(`    Annotations: ${s.annotations}`);
    if (graph.warnings.length > 0)
        console.log(`    Warnings:    ${graph.warnings.length}`);
    if (changelog && changelog.new_nodes.length > 0) {
        console.log(`    New:         ${changelog.new_nodes.length} nodes`);
    }
}
// ─── build ───
function build() {
    const startAll = Date.now();
    mkdirSync(DIST_DIR, { recursive: true });
    const isMulti = config.projects.length > 1;
    const multiGraph = {
        version: "1.0.0",
        generated_at: new Date().toISOString(),
        projects: [],
    };
    console.log(`\nDVE build — ${config.projects.length} project(s)`);
    for (const project of config.projects) {
        const start = Date.now();
        const dirs = resolveProjectDirs(project);
        const graph = buildGraph({ ...dirs, enableGitLinker: true });
        const graphFile = isMulti
            ? path.join(DIST_DIR, `graph-${project.name}.json`)
            : path.join(DIST_DIR, "graph.json");
        // Changelog
        const prev = existsSync(graphFile)
            ? JSON.parse(readFileSync(graphFile, "utf-8"))
            : null;
        const changelog = buildChangelog(prev, graph);
        writeFileSync(graphFile, JSON.stringify(graph, null, 2));
        if (changelog) {
            const clFile = isMulti
                ? path.join(DIST_DIR, `changelog-${project.name}.json`)
                : path.join(DIST_DIR, "changelog.json");
            writeFileSync(clFile, JSON.stringify(changelog, null, 2));
        }
        multiGraph.projects.push({ name: project.name, path: project.path, graph });
        printBuildReport(project.name, graph, changelog, ((Date.now() - start) / 1000).toFixed(1));
    }
    // Write multi-project index
    if (isMulti) {
        const index = {
            version: "1.0.0",
            generated_at: multiGraph.generated_at,
            projects: multiGraph.projects.map((p) => ({
                name: p.name,
                path: p.path,
                graphFile: `graph-${p.name}.json`,
                stats: p.graph.stats,
            })),
        };
        writeFileSync(path.join(DIST_DIR, "projects.json"), JSON.stringify(index, null, 2));
        // Also write combined graph.json for backwards compat (merge all)
        const merged = {
            version: "1.0.0",
            generated_at: multiGraph.generated_at,
            stats: { sessions: 0, gaps: 0, decisions: 0, annotations: 0, specs: 0 },
            nodes: [],
            edges: [],
            warnings: [],
            glossary: [],
        };
        for (const p of multiGraph.projects) {
            // Prefix node IDs with project name to avoid collisions
            for (const node of p.graph.nodes) {
                merged.nodes.push({ ...node, id: `${p.name}/${node.id}` });
            }
            for (const edge of p.graph.edges) {
                merged.edges.push({ ...edge, source: `${p.name}/${edge.source}`, target: `${p.name}/${edge.target}` });
            }
            merged.warnings.push(...p.graph.warnings);
            merged.stats.sessions += p.graph.stats.sessions;
            merged.stats.gaps += p.graph.stats.gaps;
            merged.stats.decisions += p.graph.stats.decisions;
            merged.stats.annotations += p.graph.stats.annotations;
            merged.stats.specs = (merged.stats.specs ?? 0) + (p.graph.stats.specs ?? 0);
            // Merge glossary (deduplicate by term)
            const existingTerms = new Set((merged.glossary ?? []).map((e) => e.term.toLowerCase()));
            for (const entry of p.graph.glossary ?? []) {
                if (!existingTerms.has(entry.term.toLowerCase())) {
                    merged.glossary.push(entry);
                    existingTerms.add(entry.term.toLowerCase());
                }
            }
        }
        writeFileSync(path.join(DIST_DIR, "graph.json"), JSON.stringify(merged, null, 2));
    }
    const totalElapsed = ((Date.now() - startAll) / 1000).toFixed(1);
    console.log(`\n  Total: ${totalElapsed}s → ${DIST_DIR}`);
    return isMulti ? null : multiGraph.projects[0]?.graph ?? null;
}
// ─── serve ───
async function serve(watch) {
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
        const dirs = [];
        for (const project of config.projects) {
            const d = resolveProjectDirs(project);
            dirs.push(d.sessionsDir, d.decisionsDir, d.annotationsDir);
        }
        let debounce = null;
        const watcher = chokidar.watch(dirs, {
            ignoreInitial: true,
            ignored: /(^|[\/\\])\../,
        });
        watcher.on("all", (event, filePath) => {
            if (!filePath.endsWith(".md"))
                return;
            if (debounce)
                clearTimeout(debounce);
            debounce = setTimeout(() => {
                console.log(`\n  [${event}] ${path.relative(CWD, filePath)}`);
                build();
            }, 500);
        });
    }
    // Start API server (annotations, drift, coverage)
    startAPIServer({
        annotationsDir: annDir(),
        distDir: DIST_DIR,
        projectDirs: config.projects.map((p) => ({
            name: p.name,
            path: p.path,
            decisionsDir: path.join(p.path, p.decisionsDir),
        })),
    }, 4174);
    // Serve with vite preview
    console.log(`\nStarting UI server...`);
    const vite = spawn("npx", ["vite", "preview", "--host", "0.0.0.0", "--port", "4173"], {
        cwd: appDir,
        stdio: "inherit",
    });
    vite.on("close", (code) => process.exit(code ?? 0));
}
// ─── trace ───
function trace(ddId) {
    const graph = loadGraph();
    const chain = traceDecision(graph, ddId);
    if (chain.length === 0) {
        console.error(`${ddId} not found in graph.`);
        process.exit(1);
    }
    console.log(`\nTrace: ${ddId}\n`);
    for (const node of chain) {
        const data = node.data;
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
function impact(nodeId) {
    const graph = loadGraph();
    const affected = impactOf(graph, nodeId);
    if (affected.length === 0) {
        console.log(`\nNo downstream impact from ${nodeId}.`);
        return;
    }
    console.log(`\nImpact of ${nodeId} (${affected.length} affected):\n`);
    for (const node of affected) {
        const data = node.data;
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
        const data = gap.data;
        console.log(`  ${gap.id}: ${data.summary} (${data.severity})`);
    }
}
// ─── search ───
function doSearch(keyword) {
    const graph = loadGraph();
    const results = search(graph, keyword);
    if (results.length === 0) {
        console.log(`\nNo results for "${keyword}".`);
        return;
    }
    console.log(`\nSearch "${keyword}" (${results.length} results):\n`);
    for (const node of results) {
        const data = node.data;
        const label = data.title ?? data.theme ?? data.summary ?? data.body?.slice(0, 60) ?? "";
        console.log(`  ${node.type.padEnd(10)} ${node.id}: ${label}`);
    }
}
// ─── annotate ───
function annotate(targetId, action, body) {
    const ANN_DIR = annDir();
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
function context(originId, constraints) {
    const graph = loadGraph();
    const bundle = generateBundle({
        graph,
        originId,
        constraints,
        outputDir: ctxDir(),
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
        if (!args[0]) {
            console.error("Usage: dve trace <DD-id>");
            process.exit(1);
        }
        trace(args[0]);
        break;
    case "impact":
        if (!args[0]) {
            console.error("Usage: dve impact <node-id>");
            process.exit(1);
        }
        impact(args[0]);
        break;
    case "orphans":
        showOrphans();
        break;
    case "search":
        if (!args[0]) {
            console.error("Usage: dve search <keyword>");
            process.exit(1);
        }
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
        if (!origin) {
            console.error("Usage: dve context <node-id> [--constraint=...]");
            process.exit(1);
        }
        context(origin, constraintArgs);
        break;
    }
    case "status": {
        const DRE_ICONS = {
            FRESH: "\u{26AA}", INSTALLED: "\u{1F7E2}", CUSTOMIZED: "\u{1F7E1}",
            OUTDATED: "\u{1F534}", UNKNOWN: "\u{2753}",
        };
        console.log(`\nDVE Project Status\n`);
        for (const project of config.projects) {
            const state = detectProjectState(project.name, project.path);
            const dreIcon = DRE_ICONS[state.dre.installState] ?? "";
            const wf = state.workflow;
            console.log(`\u{250C}${"─".repeat(70)}`);
            console.log(`\u{2502} ${state.projectName}  ${dreIcon} DRE ${state.dre.installState}${state.dre.localVersion ? ` v${state.dre.localVersion}` : ""}  Sessions:${state.dgeSessionCount} DDs:${state.ddCount}`);
            console.log(`\u{2502}`);
            // Workflow state machine
            const flow = wf.phases.map((p) => {
                const isActive = p.active;
                const isPlugin = p.source === "plugin";
                const label = isPlugin ? `${p.id} (${p.plugin})` : p.id;
                if (isActive)
                    return `[\u{25B6} ${label}]`;
                return isPlugin ? `{${label}}` : label;
            });
            console.log(`\u{2502}  ${flow.join(" → ")}`);
            // Current state + sub-state
            const subLabel = wf.subState ? ` > ${wf.subState}` : "";
            console.log(`\u{2502}  Current: ${wf.currentPhase}${subLabel} (${wf.currentSource})`);
            if (wf.stack.length > 1) {
                console.log(`\u{2502}  Stack: ${wf.stack.join(" > ")}`);
            }
            // Plugin sub-states for current phase
            for (const psm of wf.pluginSMs) {
                if (psm.states.length > 0 && psm.phaseId === wf.currentPhase) {
                    const subFlow = psm.states.map((s) => s.active ? `[\u{25B6} ${s.id}]` : s.id);
                    console.log(`\u{2502}  Sub (${psm.plugin}): ${subFlow.join(" \u{2192} ")}`);
                }
            }
            // Plugins
            if (wf.plugins.length > 0) {
                console.log(`\u{2502}  Plugins: ${wf.plugins.map((p) => `${p.id}${p.version ? ` v${p.version}` : ""}`).join(", ")}`);
            }
            console.log(`\u{2514}${"─".repeat(70)}`);
        }
        break;
    }
    case "clusters": {
        const graph = loadGraph();
        const clusters = clusterBySupersedes(graph);
        if (clusters.length === 0) {
            console.log("\nNo clusters found.");
            break;
        }
        console.log(`\nDecision clusters (${clusters.length}):\n`);
        for (const c of clusters) {
            console.log(`  ${c.label} (${c.ddIds.length} DDs, ${c.gapCount} gaps)`);
            for (const id of c.ddIds) {
                const node = graph.nodes.find((n) => n.id === id);
                console.log(`    ${id}: ${node?.data?.title ?? ""}`);
            }
        }
        break;
    }
    case "drift": {
        const graph = loadGraph();
        const ddNodes = graph.nodes.filter((n) => n.type === "decision");
        const drifted = detectDrift(ddNodes, CWD);
        if (drifted.length === 0) {
            console.log("\nNo drift detected.");
            break;
        }
        console.log(`\nPotential drift (${drifted.length} decisions):\n`);
        for (const d of drifted) {
            console.log(`  ${d.ddId}: ${d.commitsSince} commits since ${d.ddDate}`);
            console.log(`    latest: ${d.latestCommit}`);
        }
        break;
    }
    case "scan": {
        const scanDir = args[0] ? path.resolve(args[0]) : path.resolve(CWD, "..");
        const maxDepth = parseInt(args.find((a) => a.startsWith("--depth="))?.split("=")[1] ?? "3", 10);
        const autoRegister = args.includes("--register") || args.includes("-r");
        console.log(`\nScanning ${scanDir} (depth=${maxDepth})...\n`);
        // Find git repos with DxE markers
        const { readdirSync: rds, statSync: ss } = await import("node:fs");
        const results = [];
        function scanRecursive(dir, depth) {
            if (depth > maxDepth)
                return;
            let entries;
            try {
                entries = rds(dir);
            }
            catch {
                return;
            }
            // Check if this is a project root (has .git or package.json)
            const isProject = entries.includes(".git") || entries.includes("package.json");
            if (isProject) {
                const hasDGE = existsSync(path.join(dir, "dge")) || existsSync(path.join(dir, ".claude", "skills", "dge-session.md"));
                const hasDRE = existsSync(path.join(dir, ".claude", ".dre-version")) || existsSync(path.join(dir, "dre"));
                const hasDVE = existsSync(path.join(dir, "dve")) || existsSync(path.join(dir, ".claude", "skills", "dve-build.md"));
                const hasDDE = existsSync(path.join(dir, "dde"));
                let sessions = 0;
                let decisions = 0;
                const sessDir = path.join(dir, "dge", "sessions");
                const ddDir = path.join(dir, "dge", "decisions");
                if (existsSync(sessDir)) {
                    try {
                        sessions = rds(sessDir).filter((f) => f.endsWith(".md") && f !== "index.md").length;
                    }
                    catch { }
                }
                if (existsSync(ddDir)) {
                    try {
                        decisions = rds(ddDir).filter((f) => f.endsWith(".md") && f !== "index.md").length;
                    }
                    catch { }
                }
                // Only include if has any DxE tooling
                if (hasDGE || hasDRE || hasDVE || hasDDE || sessions > 0) {
                    results.push({
                        path: dir,
                        name: path.basename(dir),
                        hasDGE, hasDRE, hasDVE, hasDDE,
                        sessions, decisions,
                    });
                }
            }
            // Recurse into subdirectories (skip common non-project dirs)
            const skipDirs = new Set(["node_modules", ".git", "dist", "build", ".dre", ".claude", "dve", "dge", "dre", "dde"]);
            for (const entry of entries) {
                if (skipDirs.has(entry) || entry.startsWith("."))
                    continue;
                const full = path.join(dir, entry);
                try {
                    if (ss(full).isDirectory())
                        scanRecursive(full, depth + 1);
                }
                catch { }
            }
        }
        scanRecursive(scanDir, 0);
        if (results.length === 0) {
            console.log("  No DxE projects found.");
            break;
        }
        console.log(`${"Project".padEnd(25)} ${"DGE".padEnd(5)} ${"DRE".padEnd(5)} ${"DVE".padEnd(5)} ${"DDE".padEnd(5)} ${"Sess".padEnd(6)} DDs`);
        console.log("─".repeat(70));
        for (const r of results) {
            console.log(`${r.name.padEnd(25)} ${(r.hasDGE ? "✅" : "—").padEnd(5)} ` +
                `${(r.hasDRE ? "✅" : "—").padEnd(5)} ${(r.hasDVE ? "✅" : "—").padEnd(5)} ` +
                `${(r.hasDDE ? "✅" : "—").padEnd(5)} ${String(r.sessions).padEnd(6)} ${r.decisions}`);
        }
        console.log(`\n  ${results.length} projects found.`);
        // Auto-register
        if (autoRegister) {
            const newConfig = {
                outputDir: config.outputDir.startsWith("/") ? config.outputDir : path.relative(CWD, path.resolve(CWD, config.outputDir)) || "dve/dist",
                projects: results.map((r) => ({
                    name: r.name,
                    path: path.relative(CWD, r.path) || ".",
                })),
            };
            writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2) + "\n");
            console.log(`\n  Registered ${results.length} projects to ${CONFIG_PATH}`);
            console.log(`  Run: dve build`);
        }
        else {
            console.log(`\n  Add --register (-r) to save to dve.config.json`);
        }
        break;
    }
    case "init": {
        if (existsSync(CONFIG_PATH)) {
            console.log(`dve.config.json already exists.`);
            process.exit(0);
        }
        const initProjects = args.length > 0
            ? args.map((p) => ({ name: path.basename(p), path: path.resolve(p) }))
            : [{ name: path.basename(CWD), path: CWD }];
        const initConfig = {
            outputDir: "dve/dist",
            projects: initProjects.map((p) => ({
                name: p.name,
                path: path.relative(CWD, p.path) || ".",
            })),
        };
        writeFileSync(CONFIG_PATH, JSON.stringify(initConfig, null, 2) + "\n");
        console.log(`\nCreated ${CONFIG_PATH}`);
        console.log(`  Projects: ${initProjects.map((p) => p.name).join(", ")}`);
        console.log(`\nEdit to add more projects, then run: dve build`);
        break;
    }
    case "projects": {
        console.log(`\nDVE projects (${config.projects.length}):\n`);
        for (const p of config.projects) {
            console.log(`  ${p.name.padEnd(20)} ${p.path}`);
        }
        break;
    }
    case "version":
        console.log("DVE toolkit v4.0.0");
        break;
    default:
        console.log(`
  DVE — Decision Visualization Engine

  Commands:
    init [path...]                  Create dve.config.json (multi-project)
    projects                        List configured projects
    build                           Build graph.json from all projects
    serve [--watch]                 Start web UI (with optional file watching)
    trace <DD-id>                   Trace decision back to sessions/gaps
    impact <node-id>                Show downstream impact of a node
    orphans                         Show gaps not linked to any decision
    search <keyword>                Search nodes by keyword
    annotate <id> --action <type> --body "text"
                                    Create annotation
    context <id> [--constraint=...] Generate ContextBundle for DGE restart
    status                          Show DRE state + dev phase per project
    clusters                        Show decision clusters (supersedes chains)
    drift                           Detect decisions that may have diverged
    version                         Show version

  Multi-project:
    scan [dir] [--depth=N] [-r]     Auto-discover DxE projects in directory
    init [path...]                  Create dve.config.json manually
    build                           → builds all projects
    projects                        → list projects
    `);
}
