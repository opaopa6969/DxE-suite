import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { rateLimiter } from "./middleware.js";
import db, { migrate } from "./db.js";
import { recommend } from "./recommend.js";

const app = new Hono();

// --- Middleware ---
app.use("*", async (c, next) => {
  c.header("X-DGE-Server", "1.0.0");
  await next();
});

// --- Characters CRUD (no LLM required) ---

app.get("/api/characters", (c) => {
  const rows = db.prepare("SELECT * FROM characters ORDER BY is_builtin DESC, name").all();
  return c.json(rows.map((r: any) => ({ ...r, axes: JSON.parse(r.axes) })));
});

app.get("/api/characters/:id", (c) => {
  const row = db.prepare("SELECT * FROM characters WHERE id = ?").get(c.req.param("id")) as any;
  if (!row) return c.json({ error: "Character not found" }, 404);
  return c.json({ ...row, axes: JSON.parse(row.axes) });
});

app.post("/api/characters", async (c) => {
  const body = await c.req.json();
  const { name, source, archetype, icon, axes, prompt_core } = body;

  if (!name || !axes || !prompt_core) {
    return c.json({ error: "name, axes, prompt_core are required" }, 400);
  }
  if (name.length > 200) return c.json({ error: "name must be <= 200 chars" }, 400);
  if (source && source.length > 200) return c.json({ error: "source must be <= 200 chars" }, 400);

  const id = `chr_custom_${Date.now()}`;
  db.prepare(
    "INSERT INTO characters (id, name, source, archetype, icon, axes, prompt_core, is_builtin) VALUES (?, ?, ?, ?, ?, ?, ?, 0)"
  ).run(id, name, source || null, archetype || null, icon || "🎭", JSON.stringify(axes), prompt_core);

  return c.json({ id, name }, 201);
});

app.put("/api/characters/:id", async (c) => {
  const id = c.req.param("id");
  const existing = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ error: "Character not found" }, 404);
  if (existing.is_builtin) return c.json({ error: "Cannot modify built-in characters" }, 403);

  const body = await c.req.json();
  const { name, source, archetype, icon, axes, prompt_core } = body;

  db.prepare(
    "UPDATE characters SET name = COALESCE(?, name), source = COALESCE(?, source), archetype = COALESCE(?, archetype), icon = COALESCE(?, icon), axes = COALESCE(?, axes), prompt_core = COALESCE(?, prompt_core) WHERE id = ?"
  ).run(
    name || null, source || null, archetype || null, icon || null,
    axes ? JSON.stringify(axes) : null, prompt_core || null, id
  );

  return c.json({ id, updated: true });
});

app.delete("/api/characters/:id", (c) => {
  const id = c.req.param("id");
  const existing = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ error: "Character not found" }, 404);
  if (existing.is_builtin) return c.json({ error: "Cannot delete built-in characters" }, 403);

  db.prepare("DELETE FROM characters WHERE id = ?").run(id);
  return c.json({ id, deleted: true });
});

// --- Recommend (keyword-based, no LLM required for v1) ---

app.post("/api/characters/recommend", async (c) => {
  const body = await c.req.json();
  const { agenda, template, max } = body;

  if (!agenda) return c.json({ error: "agenda is required" }, 400);
  if (agenda.length > 500) return c.json({ error: "agenda must be <= 500 chars" }, 400);

  const result = recommend(agenda, template, max || 4);
  return c.json(result);
});

// --- Patterns (static, no LLM) ---

const PRESETS = {
  "new-project": { patterns: ["zero-state", "role-contrast", "escalation-chain"], label: "新規プロジェクト" },
  "feature-extension": { patterns: ["before-after", "cross-persona-conflict", "expertise-contrast"], label: "機能追加" },
  "pre-release": { patterns: ["scale-break", "security-adversary", "concurrent-operation", "disaster-recovery"], label: "リリース前" },
  "advocacy": { patterns: ["before-after", "app-type-variation", "role-contrast"], label: "社内提案" },
  "comprehensive": { patterns: ["zero-state", "role-contrast", "escalation-chain", "cross-persona-conflict", "scale-break", "security-adversary", "migration-path"], label: "網羅的" },
};

app.get("/api/patterns", (c) => {
  return c.json({ presets: PRESETS });
});

app.post("/api/patterns/recommend", async (c) => {
  const body = await c.req.json();
  const { template } = body;

  const mapping: Record<string, string> = {
    "api-design": "feature-extension",
    "feature-planning": "new-project",
    "go-nogo": "advocacy",
    "incident-review": "comprehensive",
    "security-review": "pre-release",
  };

  const presetKey = mapping[template] || "new-project";
  const preset = PRESETS[presetKey as keyof typeof PRESETS];
  return c.json({ preset: presetKey, ...preset, method: "default" });
});

// --- Sessions CRUD ---

app.get("/api/sessions", (c) => {
  const rows = db.prepare("SELECT * FROM sessions ORDER BY created_at DESC").all();
  return c.json(rows);
});

app.get("/api/sessions/:id", (c) => {
  const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(c.req.param("id"));
  if (!row) return c.json({ error: "Session not found" }, 404);
  return c.json(row);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();
  const { theme, template, pattern, characters, gap_count, gap_critical, gap_high, gap_medium, gap_low, file_path, project_id } = body;

  if (!theme) return c.json({ error: "theme is required" }, 400);

  const id = `ses_${Date.now()}`;
  db.prepare(
    "INSERT INTO sessions (id, theme, template, pattern, characters, gap_count, gap_critical, gap_high, gap_medium, gap_low, file_path, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, theme, template || null, pattern || null, characters || null, gap_count || 0, gap_critical || 0, gap_high || 0, gap_medium || 0, gap_low || 0, file_path || null, project_id || null);

  return c.json({ id }, 201);
});

// --- Projects CRUD ---

app.get("/api/projects", (c) => {
  const rows = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
  return c.json(rows);
});

app.post("/api/projects", async (c) => {
  const body = await c.req.json();
  const { name } = body;
  if (!name) return c.json({ error: "name is required" }, 400);

  const id = `prj_${Date.now()}`;
  db.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run(id, name);
  return c.json({ id, name }, 201);
});

// --- Health ---

app.get("/api/health", (c) => c.json({ status: "ok", version: "1.0.0" }));

// --- Start ---

const host = process.argv.includes("--host") ? "0.0.0.0" : "127.0.0.1";
const port = parseInt(process.env.DGE_PORT || "3456");

migrate();

console.log(`\n  DGE Server v1.0.0`);
console.log(`  http://${host}:${port}`);
console.log(`  ${host === "127.0.0.1" ? "localhost only (use --host to expose)" : "⚠ exposed to network"}\n`);

serve({ fetch: app.fetch, hostname: host, port });
