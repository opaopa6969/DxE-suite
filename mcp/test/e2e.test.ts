// e2e test for DxE MCP server
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MCP_DIR = path.resolve(__dirname, "..");

const PORT = process.env.MCP_TEST_PORT || "9244";
const BASE = `http://127.0.0.1:${PORT}`;

let serverProc: any;
let client: Client;

describe("DxE MCP server e2e", { timeout: 30000 }, () => {
  before(async () => {
    // Start server
    serverProc = spawn("npx", ["tsx", "server.ts"], {
      env: { ...process.env, PORT },
      stdio: ["pipe", "pipe", "pipe"],
      cwd: MCP_DIR,
    });
    serverProc.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));
    // wait for healthz
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch(`${BASE}/healthz`);
        if (r.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
      if (i === 39) throw new Error("server did not start");
    }
    // Create MCP client
    client = new Client({ name: "test-client", version: "1.0" }, { capabilities: {} });
    const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`));
    await client.connect(transport);
  });

  after(async () => {
    if (client) await client.close().catch(() => {});
    if (serverProc) {
      serverProc.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 500));
      if (!serverProc.killed) serverProc.kill("SIGKILL");
    }
  });

  test("healthz returns 200 with name and version", async () => {
    const r = await fetch(`${BASE}/healthz`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.ok, true);
    assert.equal(body.name, "dxe");
    assert.equal(body.version, "4.2.0");
  });

  test("tools/list returns expected tools", async () => {
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name).sort();
    assert.ok(names.includes("list_sessions"), `missing list_sessions: ${names.join(",")}`);
    assert.ok(names.includes("recommend_characters"));
    assert.ok(names.includes("list_patterns"));
    assert.ok(names.includes("get_graph"));
    assert.ok(names.includes("trace"));
    assert.ok(names.includes("impact"));
    assert.ok(names.includes("orphans"));
    assert.ok(names.includes("search"));
    assert.ok(names.includes("drift"));
    assert.ok(names.includes("status"));
    assert.ok(names.includes("clusters"));
    assert.ok(names.includes("build_context"));
    assert.ok(names.includes("annotate"));
    assert.ok(names.includes("record_session"));
    assert.equal(names.length, 14);
  });

  test("tools have annotations", async () => {
    const result = await client.listTools();
    for (const tool of result.tools) {
      assert.ok(tool.annotations, `tool ${tool.name} missing annotations`);
      if (tool.name === "annotate" || tool.name === "record_session") {
        assert.equal(tool.annotations.destructiveHint, true, `tool ${tool.name} should have destructiveHint`);
      } else {
        assert.equal(tool.annotations.readOnlyHint, true, `tool ${tool.name} should have readOnlyHint`);
      }
    }
  });

  test("list_patterns returns presets", async () => {
    const result = await client.callTool({ name: "list_patterns", arguments: {} });
    const text = (result.content as any)[0].text;
    const data = JSON.parse(text);
    assert.ok(data.presets);
    assert.ok(data.presets["new-project"]);
    assert.ok(data.presets["comprehensive"]);
  });

  test("get_graph returns graph structure or not-found error", async () => {
    const result = await client.callTool({ name: "get_graph", arguments: {} });
    const text = (result.content as any)[0].text;
    const data = JSON.parse(text);
    if (data.error) {
      assert.ok(data.error.includes("not found"));
    } else {
      assert.ok(data.nodes);
      assert.ok(data.edges);
      assert.ok(data.stats);
    }
  });

  test("search returns array or not-found", async () => {
    const result = await client.callTool({ name: "search", arguments: { keyword: "test" } });
    const text = (result.content as any)[0].text;
    const data = JSON.parse(text);
    if (data.error) {
      assert.ok(data.error.includes("not found"));
    } else {
      assert.ok(Array.isArray(data));
    }
  });

  test("annotate dry-run returns plan without writing", async () => {
    const result = await client.callTool({
      name: "annotate",
      arguments: { target: "DD-001", body: "test annotation", confirm: false },
    });
    const text = (result.content as any)[0].text;
    const data = JSON.parse(text);
    assert.equal(data.dry_run, true);
    assert.ok(data.plan);
    assert.ok(data.plan.file);
    assert.ok(data.plan.content);
  });

  test("record_session dry-run returns plan without writing", async () => {
    const result = await client.callTool({
      name: "record_session",
      arguments: { theme: "test theme", confirm: false },
    });
    const text = (result.content as any)[0].text;
    const data = JSON.parse(text);
    assert.equal(data.dry_run, true);
    assert.ok(data.plan);
    assert.ok(data.plan.id.startsWith("ses_"));
  });

  test("dxe://spec resource returns JSON with capabilities", async () => {
    const result = await client.readResource({ uri: "dxe://spec" });
    const text = result.contents[0].text as string;
    const spec = JSON.parse(text);
    assert.equal(spec.namespace, "dxe");
    assert.equal(spec.name, "DxE-suite");
    assert.equal(spec.capabilities.length, 14);
    assert.ok(spec.compositions.length >= 3);
    assert.ok(spec.depends_on.length >= 1);
    assert.equal(spec.health, "/healthz");
  });

  test("dxe://guide resource returns markdown", async () => {
    const result = await client.readResource({ uri: "dxe://guide" });
    const text = result.contents[0].text as string;
    assert.ok(text.includes("DGE"));
    assert.ok(text.includes("DVE"));
    assert.ok(text.includes("DRE"));
  });

  test("skill://dxe-restart-session resource returns markdown", async () => {
    const result = await client.readResource({ uri: "skill://dxe-restart-session" });
    const text = result.contents[0].text as string;
    assert.ok(text.includes("dxe-restart-session"));
    assert.ok(text.includes("volta:"));
  });
});
