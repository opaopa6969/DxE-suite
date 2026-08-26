// DxE MCP server — Streamable HTTP /mcp + /healthz
// DGE (SQLite) + DVE (graph.json + pure functions) を 1 プロセスで束ねる

import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import Database from "better-sqlite3";

import { buildGraph } from "../dve/kit/graph/builder.js";
import { traceDecision, impactOf, orphanGaps, search } from "../dve/kit/graph/query.js";
import { clusterBySupersedes } from "../dve/kit/graph/cluster.js";
import { generateBundle } from "../dve/kit/context/bundle.js";
import { detectProjectState } from "../dve/kit/parser/state-detector.js";
import type { DVEGraph } from "../dve/kit/graph/schema.js";

const VERSION = "4.2.0";
const NAMESPACE = "dxe";

// --- paths ---
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DGE_DB_PATH = process.env.DGE_DB_PATH || path.join(REPO_ROOT, "dge", "server", "data", "dge.db");
const DVE_CONFIG_PATH = path.join(REPO_ROOT, "dve.config.json");
const DVE_DIST_DIR = path.join(REPO_ROOT, "dve", "dist");
const ANNOTATIONS_DIR = path.join(DVE_DIST_DIR, "annotations");

// --- project whitelist (from dve.config.json) ---
interface DveConfig {
  outputDir: string;
  projects: { name: string; path: string }[];
}
function loadDveConfig(): DveConfig {
  if (!existsSync(DVE_CONFIG_PATH)) return { outputDir: DVE_DIST_DIR, projects: [] };
  return JSON.parse(readFileSync(DVE_CONFIG_PATH, "utf-8"));
}
function resolveProjectDir(project: string | undefined): { name: string; path: string } | null {
  const cfg = loadDveConfig();
  if (!project) return cfg.projects[0] ?? null;
  return cfg.projects.find((p) => p.name === project) ?? null;
}

// --- DGE SQLite (read-only) ---
function openDgeDb(): Database.Database | null {
  if (!existsSync(DGE_DB_PATH)) return null;
  try {
    const db = new Database(DGE_DB_PATH, { readonly: true });
    return db;
  } catch {
    return null;
  }
}

// --- DVE graph cache ---
let graphCache: { project: string; graph: DVEGraph; at: number } | null = null;
const GRAPH_TTL_MS = 60_000;

function loadGraph(project: string | undefined): DVEGraph | null {
  const proj = resolveProjectDir(project);
  const distDir = proj
    ? path.resolve(REPO_ROOT, loadDveConfig().outputDir)
    : DVE_DIST_DIR;

  // Try pre-built graph.json first (fast path)
  const graphFile = path.join(distDir, project ? `graph-${project}.json` : "graph.json");
  if (existsSync(graphFile)) {
    const graph: DVEGraph = JSON.parse(readFileSync(graphFile, "utf-8"));
    return graph;
  }

  // Fallback: build from source (slower)
  if (!proj) return null;
  const sessionsDir = path.join(proj.path, "dge", "sessions");
  const decisionsDir = path.join(proj.path, "dge", "decisions");
  const specsDir = path.join(proj.path, "spec");
  const annotationsDir = path.join(distDir, "annotations");
  if (!existsSync(sessionsDir)) return null;
  return buildGraph({
    sessionsDir,
    decisionsDir,
    specsDir,
    annotationsDir,
    cwd: proj.path,
  });
}

function getGraph(project: string | undefined): DVEGraph | null {
  const key = project ?? "_default";
  const now = Date.now();
  if (graphCache && graphCache.project === key && now - graphCache.at < GRAPH_TTL_MS) {
    return graphCache.graph;
  }
  const g = loadGraph(project);
  if (g) graphCache = { project: key, graph: g, at: now };
  return g;
}

// --- tool catalog (static, for spec resource) ---
const TOOL_CATALOG: { name: string; summary: string; side_effect: "read" | "write"; dry_run: boolean; min_role: string }[] = [
  { name: "list_sessions", summary: "DGE セッション一覧を返す（SQLite から読み取り専用）", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "recommend_characters", summary: "議題に合う DGE キャラクターを推奨する（keyword-based, no LLM）", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "list_patterns", summary: "DGE パターン・プリセット一覧を返す", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "record_session", summary: "DGE セッションを SQLite に記録する（confirm 必須）", side_effect: "write", dry_run: true, min_role: "MEMBER" },
  { name: "get_graph", summary: "DVE 決定グラフを取得する（nodes, edges, stats）", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "trace", summary: "決定の因果連鎖（DD→Gap→Session）を遡る", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "impact", summary: "ノードの下流インパクトを算出する", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "orphans", summary: "決定未紐付の orphan gap を列挙する", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "search", summary: "決定グラフを全文検索する", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "drift", summary: "決定グラフから drift（コード乖離）を検出する", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "status", summary: "DVE プロジェクト状態（DRE phase + sub-state）を返す", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "clusters", summary: "決定クラスタ（supersedes 連鎖）を返す", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "build_context", summary: "DGE 再開用 ContextBundle を生成しプロンプトを返す", side_effect: "read", dry_run: false, min_role: "VIEWER" },
  { name: "annotate", summary: "ノードに注釈を作成する（confirm 必須）", side_effect: "write", dry_run: true, min_role: "MEMBER" },
];

// --- spec resource generator ---
function buildSpec() {
  return {
    namespace: NAMESPACE,
    name: "DxE-suite",
    version: VERSION,
    summary: "DGE/DDE/DVE/DRE の 4 ツールキットを束ねる monorepo。設計ギャップ抽出→決定可視化→ルール配布の lifecycle を MCP tool で提供。",
    capabilities: TOOL_CATALOG.map((t) => ({
      kind: "tool" as const,
      name: t.name,
      summary: t.summary,
      input: "<see tools/list>",
      output: "<JSON text>",
      side_effect: t.side_effect,
      long_running: false,
      dry_run: t.dry_run,
      min_role: t.min_role,
    })),
    compositions: [
      { title: "DGE ギャップの台本検証", flow: ["dxe__list_sessions", "dxe__build_context", "kamishibai__validate"], note: "gap を台本構造の検証材料にする" },
      { title: "未決定 gap の可視化と注釈", flow: ["dxe__get_graph", "dxe__orphans", "dxe__annotate"], note: "orphan gap にコメント付け → DGE 再開" },
      { title: "キャラ推奨→記録→drift 監視", flow: ["dxe__recommend_characters", "dxe__record_session", "dxe__drift"], note: "推奨キャラで DGE を回し drift を監視" },
    ],
    depends_on: [
      { namespace: "volta", capability: "volta__svc_add / volta__gateway_routes_apply" },
      { namespace: "kamishibai", capability: "kamishibai__validate" },
    ],
    health: "/healthz",
    docs: ["dxe://guide", "volta://docs/PROMPT-mcpify-phase2-design-impl"],
  };
}

const GUIDE_MD = `# DxE Guide — lifecycle: DGE → DDE → DVE → DRE

DxE-suite は設計のギャップを見つけ（DGE）、ドキュメントの穴を補完し（DDE）、決定を可視化し（DVE）、ルールを配布・強制する（DRE）4 つのツールキットを束ねる。

## MCP でできること

- **DGE**: \`dxe__list_sessions\` で過去のセッション一覧、\`dxe__recommend_characters\` で議題に合うキャラ推奨、\`dxe__record_session\` でセッション記録
- **DVE**: \`dxe__get_graph\` で決定グラフ、\`dxe__trace\` / \`dxe__impact\` / \`dxe__orphans\` で因果探索、\`dxe__annotate\` で注釈、\`dxe__drift\` でコード乖離検出
- **DRE**: \`dxe__status\` でプロジェクトの DRE phase 確認
- **ブリッジ**: \`dxe__build_context\` で DVE ノードから DGE 再開用プロンプトを生成

## 典型的な流れ

1. DGE で壁打ち → gap が見つかる
2. gap が未決定なら \`dxe__orphans\` で確認 → DGE 再開 or 決定
3. 決定は DD-NNN として記録 → DVE graph に載る
4. \`dxe__drift\` で決定後のコード変更を監視
5. DRE でルール配布 → \`dxe__status\` で phase 確認

詳細: \`dxe://spec\`
`;

function log(...a: any[]) {
  process.stderr.write("[dxe-mcp] " + a.map((x) => typeof x === "string" ? x : JSON.stringify(x)).join(" ") + "\n");
}

// --- create MCP server ---
function createServer(): McpServer {
  const server = new McpServer({ name: "dxe", version: VERSION });

  // --- DGE tools (SQLite read) ---

  server.registerTool("list_sessions",
    {
      description: "DGE セッション一覧を返す（SQLite から読み取り専用）",
      inputSchema: { project: z.string().optional().describe("プロジェクト名（省略時は全件）") },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_args) => {
      const db = openDgeDb();
      if (!db) return { content: [{ type: "text", text: JSON.stringify({ sessions: [], note: "DGE DB not found" }) }] };
      try {
        const rows = db.prepare("SELECT id, theme, template, pattern, characters, gap_count, gap_critical, gap_high, gap_medium, gap_low, file_path, project_id, created_at FROM sessions ORDER BY created_at DESC").all();
        return { content: [{ type: "text", text: JSON.stringify(rows) }] };
      } finally { db.close(); }
    }
  );

  server.registerTool("recommend_characters",
    {
      description: "議題に合う DGE キャラクターを推奨する（keyword-based, no LLM）",
      inputSchema: {
        agenda: z.string().max(500).describe("議題テキスト"),
        template: z.string().optional().describe("テンプレート名（api-design/feature-planning/go-nogo/incident-review/security-review）"),
        max: z.number().optional().describe("最大推奨数（既定 4）"),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const db = openDgeDb();
      if (!db) return { content: [{ type: "text", text: JSON.stringify({ error: "DGE DB not found" }) }] };
      try {
        // Reuse recommend logic from dge/server/src/recommend.ts via dynamic import
        const { recommend } = await import("../dge/server/src/recommend.js");
        const result = recommend(args.agenda, args.template, args.max || 4);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } finally { db.close(); }
    }
  );

  server.registerTool("list_patterns",
    {
      description: "DGE パターン・プリセット一覧を返す",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const PRESETS = {
        "new-project": { patterns: ["zero-state", "role-contrast", "escalation-chain"], label: "新規プロジェクト" },
        "feature-extension": { patterns: ["before-after", "cross-persona-conflict", "expertise-contrast"], label: "機能追加" },
        "pre-release": { patterns: ["scale-break", "security-adversary", "concurrent-operation", "disaster-recovery"], label: "リリース前" },
        "advocacy": { patterns: ["before-after", "app-type-variation", "role-contrast"], label: "社内提案" },
        "comprehensive": { patterns: ["zero-state", "role-contrast", "escalation-chain", "cross-persona-conflict", "scale-break", "security-adversary", "migration-path"], label: "網羅的" },
      };
      return { content: [{ type: "text", text: JSON.stringify({ presets: PRESETS }) }] };
    }
  );

  server.registerTool("record_session",
    {
      description: "DGE セッションを SQLite に記録する。confirm:true で実行、未指定(=false)なら dry-run（書き込む内容を返す）",
      inputSchema: {
        theme: z.string().describe("セッションテーマ"),
        template: z.string().optional(),
        pattern: z.string().optional(),
        characters: z.string().optional().describe("JSON array string"),
        gap_count: z.number().optional(),
        gap_critical: z.number().optional(),
        gap_high: z.number().optional(),
        gap_medium: z.number().optional(),
        gap_low: z.number().optional(),
        file_path: z.string().optional(),
        project_id: z.string().optional(),
        confirm: z.boolean().optional().describe("true で実行。未指定なら dry-run"),
      },
      annotations: { destructiveHint: true },
    },
    async (args) => {
      const plan = {
        id: `ses_${Date.now()}`,
        ...args,
      };
      if (!args.confirm) {
        return { content: [{ type: "text", text: JSON.stringify({ dry_run: true, plan: { ...plan, confirm: undefined } }) }] };
      }
      const db = openDgeDb();
      if (!db) return { content: [{ type: "text", text: JSON.stringify({ error: "DGE DB not found (read-only)" }) }] };
      try {
        db.prepare(
          "INSERT INTO sessions (id, theme, template, pattern, characters, gap_count, gap_critical, gap_high, gap_medium, gap_low, file_path, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(plan.id, args.theme, args.template || null, args.pattern || null, args.characters || null,
          args.gap_count || 0, args.gap_critical || 0, args.gap_high || 0, args.gap_medium || 0, args.gap_low || 0,
          args.file_path || null, args.project_id || null);
        return { content: [{ type: "text", text: JSON.stringify({ id: plan.id }) }] };
      } finally { db.close(); }
    }
  );

  // --- DVE tools (graph.json + pure functions) ---

  server.registerTool("get_graph",
    {
      description: "DVE 決定グラフを取得する（nodes, edges, stats）",
      inputSchema: { project: z.string().optional().describe("プロジェクト名（dve.config.json の projects[].name）") },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const g = getGraph(args.project);
      if (!g) return { content: [{ type: "text", text: JSON.stringify({ error: "graph not found" }) }] };
      return { content: [{ type: "text", text: JSON.stringify(g) }] };
    }
  );

  server.registerTool("trace",
    {
      description: "決定の因果連鎖（DD→Gap→Session）を遡る",
      inputSchema: { ddId: z.string().describe("決定 ID（DD-001 等）"), project: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const g = getGraph(args.project);
      if (!g) return { content: [{ type: "text", text: JSON.stringify({ error: "graph not found" }) }] };
      const chain = traceDecision(g, args.ddId);
      return { content: [{ type: "text", text: JSON.stringify(chain) }] };
    }
  );

  server.registerTool("impact",
    {
      description: "ノードの下流インパクト（変更が影響する全ノード）を算出する",
      inputSchema: { nodeId: z.string().describe("ノード ID"), project: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const g = getGraph(args.project);
      if (!g) return { content: [{ type: "text", text: JSON.stringify({ error: "graph not found" }) }] };
      const impacted = impactOf(g, args.nodeId);
      return { content: [{ type: "text", text: JSON.stringify(impacted) }] };
    }
  );

  server.registerTool("orphans",
    {
      description: "決定に紐付かない orphan gap を列挙する",
      inputSchema: { project: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const g = getGraph(args.project);
      if (!g) return { content: [{ type: "text", text: JSON.stringify({ error: "graph not found" }) }] };
      const orphans = orphanGaps(g);
      return { content: [{ type: "text", text: JSON.stringify(orphans) }] };
    }
  );

  server.registerTool("search",
    {
      description: "決定グラフを全文検索する",
      inputSchema: { keyword: z.string().describe("検索キーワード"), project: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const g = getGraph(args.project);
      if (!g) return { content: [{ type: "text", text: JSON.stringify({ error: "graph not found" }) }] };
      const results = search(g, args.keyword);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.registerTool("drift",
    {
      description: "決定グラフから drift（コード乖離）を検出する。dve.config.json のホワイトリスト内プロジェクトのみ対象",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const cfg = loadDveConfig();
      const distDir = path.resolve(REPO_ROOT, cfg.outputDir);
      const drifted: { dd: string; file: string; lastModified: string; ddDate: string; project: string }[] = [];

      for (const proj of cfg.projects) {
        const graphPath = path.join(distDir, `graph-${proj.name}.json`);
        const fallback = path.join(distDir, "graph.json");
        const gp = existsSync(graphPath) ? graphPath : fallback;
        if (!existsSync(gp)) continue;

        const graph: DVEGraph = JSON.parse(readFileSync(gp, "utf-8"));
        const ddNodes = graph.nodes.filter((n) => n.type === "decision");
        const projPath = path.resolve(REPO_ROOT, proj.path);

        for (const dd of ddNodes) {
          const data = dd.data as any;
          if (!data.file_path || data.status === "overturned") continue;
          try {
            const since = data.date || "2020-01-01";
            const log = execSync(`git log --oneline --since="${since}" -- .`, { cwd: projPath, encoding: "utf-8", timeout: 5000 }).trim();
            if (log.split("\n").length > 5) {
              const ddFile = path.join(projPath, data.file_path);
              if (existsSync(ddFile)) {
                const stat = require("node:fs").statSync(ddFile);
                drifted.push({ dd: dd.id, file: data.file_path, lastModified: stat.mtime.toISOString(), ddDate: since, project: proj.name });
              }
            }
          } catch { /* git not available */ }
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ drifted }) }] };
    }
  );

  server.registerTool("status",
    {
      description: "DVE プロジェクト状態（DRE phase + sub-state）を返す",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => {
      const cfg = loadDveConfig();
      const states = cfg.projects.map((p) => {
        const projPath = path.resolve(REPO_ROOT, p.path);
        try {
          return detectProjectState(p.name, projPath);
        } catch {
          return { name: p.name, error: "state detection failed" };
        }
      });
      return { content: [{ type: "text", text: JSON.stringify({ projects: states }) }] };
    }
  );

  server.registerTool("clusters",
    {
      description: "決定クラスタ（supersedes 連鎖）を返す",
      inputSchema: { project: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const g = getGraph(args.project);
      if (!g) return { content: [{ type: "text", text: JSON.stringify({ error: "graph not found" }) }] };
      const clusters = clusterBySupersedes(g);
      return { content: [{ type: "text", text: JSON.stringify(clusters) }] };
    }
  );

  server.registerTool("build_context",
    {
      description: "DGE 再開用 ContextBundle を生成しプロンプトを返す",
      inputSchema: {
        originId: z.string().describe("起点ノード ID（session/gap/decision）"),
        constraints: z.array(z.string()).optional().describe("追加制約"),
        project: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const g = getGraph(args.project);
      if (!g) return { content: [{ type: "text", text: JSON.stringify({ error: "graph not found" }) }] };
      const distDir = path.resolve(REPO_ROOT, loadDveConfig().outputDir);
      const ctxDir = path.join(distDir, "context");
      try {
        const bundle = generateBundle({ graph: g, originId: args.originId, constraints: args.constraints || [], outputDir: ctxDir });
        return { content: [{ type: "text", text: JSON.stringify({ suggested_action: bundle.suggested_action, summary: bundle.summary, prompt_template: bundle.prompt_template }) }] };
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }] };
      }
    }
  );

  server.registerTool("annotate",
    {
      description: "ノードに注釈（annotation）を作成する。confirm:true で実行、未指定(=false)なら dry-run（書き込む内容を返す）",
      inputSchema: {
        target: z.string().describe("注釈対象ノード ID"),
        action: z.string().optional().describe("comment/fork/overturn/constrain/drift（既定 comment）"),
        author: z.string().optional(),
        body: z.string().describe("注釈本文"),
        project: z.string().optional(),
        confirm: z.boolean().optional().describe("true で実行。未指定なら dry-run"),
      },
      annotations: { destructiveHint: true },
    },
    async (args) => {
      const annotationsDir = path.resolve(REPO_ROOT, loadDveConfig().outputDir, "annotations");
      mkdirSync(annotationsDir, { recursive: true });
      const existing = existsSync(annotationsDir) ? readdirSync(annotationsDir).filter((f) => f.endsWith(".md")).length : 0;
      const annNum = String(existing + 1).padStart(3, "0");
      const slug = args.target.replace(/[^a-zA-Z0-9-]/g, "_");
      const action = args.action || "comment";
      const filename = `${annNum}-${slug}-${action}.md`;
      const content = `---\ntarget: ${args.target}\naction: ${action}\ndate: ${new Date().toISOString().split("T")[0]}\nauthor: ${args.author || ""}\n---\n\n${args.body}\n`;

      if (!args.confirm) {
        return { content: [{ type: "text", text: JSON.stringify({ dry_run: true, plan: { file: filename, content } }) }] };
      }
      writeFileSync(path.join(annotationsDir, filename), content);
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, file: filename }) }] };
    }
  );

  // --- resources ---

  server.resource("spec", "dxe://spec", { mimeType: "application/json", description: "DxE 能力仕様（機械可読）" }, async () => {
    const spec = buildSpec();
    return { contents: [{ uri: "dxe://spec", mimeType: "application/json", text: JSON.stringify(spec, null, 2) }] };
  });

  server.resource("guide", "dxe://guide", { mimeType: "text/markdown", description: "DxE lifecycle guide (DGE→DDE→DVE→DRE)" }, async () => ({
    contents: [{ uri: "dxe://guide", mimeType: "text/markdown", text: GUIDE_MD }],
  }));

  // --- skills (resource skill://) ---

  const SKILLS: { name: string; text: string }[] = [
    {
      name: "dxe-restart-session",
      text: `---
name: dxe-restart-session
description: ContextBundle から DGE 再開プロンプトを組み立てて壁打ちを再起動する手順
volta:
  version: 2
  namespace: dxe
  locality: repo
  applies_when: "DGE を再開したい／未決 gap から壁打ちを再起動したい"
  requires:
    tools: [dxe__build_context, dxe__list_sessions]
  tags: [dge, dve, restart]
---
# DGE セッションの再開

1. \`dxe__list_sessions\` で過去セッション一覧を取得
2. 再開したいセッションの gap や決定を確認
3. \`dxe__build_context\` に \`originId\`（session/gap/decision ノード ID）を渡す
4. 返った \`prompt_template\` を使って DGE を再開

origin が gap なら deep_dive、session なら revisit、constraints を渡せば new_angle になる。
`,
    },
    {
      name: "dxe-run-dde",
      text: `---
name: dxe-run-dde
description: DDE でドキュメントの穴を補完し用語リンクを張る手順
volta:
  version: 2
  namespace: dxe
  locality: repo
  applies_when: "ドキュメントの穴を補完したい／用語リンクを張りたい"
  tags: [dde, docs, glossary]
---
# DDE の実行

1. \`dxe\` CLI で \`dde extract\` → 用語抽出
2. \`dde generate\` → 用語記事生成
3. \`dde link\` → ドキュメントに \`[term](docs/glossary/xxx.md)\` を自動挿入

詳細: \`dde/kit/method.md\`
`,
    },
    {
      name: "dxe-dre-workflow",
      text: `---
name: dxe-dre-workflow
description: DRE ワークフローを初期化・運用する手順（init → transition → hooks）
volta:
  version: 2
  namespace: dxe
  locality: repo
  applies_when: "DRE を導入したい／workflow phase を進めたい"
  requires:
    tools: [dxe__status]
  tags: [dre, workflow, hooks]
---
# DRE ワークフロー運用

1. \`dxe dre init\` → 対象プロジェクトに DRE をインストール
2. \`dxe dre transition <phase>\` → phase を進める（spec→implementation→stabilization→maintenance）
3. \`dxe__status\` で現在の phase と DRE install state を確認
4. hooks が commit-msg / PostToolUse で DD-NNN 記録と gap 保存を強制

詳細: \`dre/kit/README.md\`
`,
    },
  ];

  for (const s of SKILLS) {
    server.resource(`skill-${s.name}`, `skill://${s.name}`, { mimeType: "text/markdown", description: `skill: ${s.name}` }, async () => ({
      contents: [{ uri: `skill://${s.name}`, mimeType: "text/markdown", text: s.text }],
    }));
  }

  return server;
}

// --- HTTP server (Streamable HTTP + healthz) ---
function serveHttp(port: number) {
  const transports = new Map<string, StreamableHTTPServerTransport>();
  const httpServer = http.createServer(async (req, res) => {
    // gateway が gzip 全読みで SSE が詰まるのを避ける
    res.setHeader("content-encoding", "identity");
    const url = new URL(req.url ?? "/", `http://${req.headers.host || "localhost"}`);
    try {
      if (url.pathname === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: true, name: NAMESPACE, version: VERSION }));
      }
      if (url.pathname !== "/mcp") {
        res.writeHead(404, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "not found" }));
      }
      const sid = req.headers["mcp-session-id"] as string | undefined;
      if (sid && transports.has(sid)) {
        return await transports.get(sid)!.handleRequest(req, res);
      }
      if (req.method === "POST" && !sid) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (id) => { transports.set(id, transport); log("session open", id); },
          onsessionclosed: (id) => { transports.delete(id); log("session closed", id); },
        });
        const server = createServer();
        transport.onclose = () => {
          if (transport.sessionId) transports.delete(transport.sessionId);
          server.close().catch(() => {});
        };
        await server.connect(transport);
        return await transport.handleRequest(req, res);
      }
      res.writeHead(sid ? 404 : 400, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: sid ? "unknown session" : "missing mcp-session-id" }));
    } catch (e: any) {
      log("request failed", url.pathname, e?.stack || e);
      if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: "internal error" })); }
      else res.end();
    }
  });
  httpServer.listen(port, "0.0.0.0", () => log(`http listening on 0.0.0.0:${port}/mcp`));
  return httpServer;
}

// --- entry ---
const argv = process.argv.slice(2);
if (argv.includes("--stdio")) {
  (async () => {
    const server = createServer();
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    await server.connect(new StdioServerTransport());
    log("stdio started");
  })().catch((e) => { log("stdio failed", e?.stack || e); process.exit(1); });
} else {
  const port = parseInt(process.env.PORT || "9243");
  serveHttp(port);
}
