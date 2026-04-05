// DVE lightweight API server — annotation write + drift detection
// Runs alongside vite preview, not a separate process

import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import type { DVEGraph } from "../graph/schema.js";
import { detectProjectState } from "../parser/state-detector.js";

interface APIConfig {
  annotationsDir: string;
  distDir: string;
  projectDirs: { name: string; path: string; decisionsDir: string }[];
}

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: string) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function cors(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: any, data: any, status = 200) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function startAPIServer(config: APIConfig, port = 4174) {
  const server = createServer(async (req, res) => {
    cors(res);
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    const url = new URL(req.url ?? "/", `http://localhost:${port}`);

    // POST /api/annotations — create annotation
    if (req.method === "POST" && url.pathname === "/api/annotations") {
      const body = await parseBody(req);
      const { target, action, author, body: text } = body;
      if (!target || !text) {
        return json(res, { error: "target and body required" }, 400);
      }

      mkdirSync(config.annotationsDir, { recursive: true });
      const existing = existsSync(config.annotationsDir)
        ? readdirSync(config.annotationsDir).filter((f) => f.endsWith(".md")).length
        : 0;
      const annNum = String(existing + 1).padStart(3, "0");
      const slug = target.replace(/[^a-zA-Z0-9-]/g, "_");
      const filename = `${annNum}-${slug}-${action ?? "comment"}.md`;
      const filePath = path.join(config.annotationsDir, filename);

      const content = `---
target: ${target}
action: ${action ?? "comment"}
date: ${new Date().toISOString().split("T")[0]}
author: ${author ?? ""}
---

${text}
`;
      writeFileSync(filePath, content);
      return json(res, { ok: true, file: filename });
    }

    // GET /api/drift — detect decisions that may have drifted
    if (req.method === "GET" && url.pathname === "/api/drift") {
      const drifted: { dd: string; file: string; lastModified: string; ddDate: string }[] = [];

      for (const proj of config.projectDirs) {
        const graphPath = path.join(config.distDir, `graph-${proj.name}.json`);
        const fallback = path.join(config.distDir, "graph.json");
        const gp = existsSync(graphPath) ? graphPath : fallback;
        if (!existsSync(gp)) continue;

        const graph: DVEGraph = JSON.parse(readFileSync(gp, "utf-8"));
        const ddNodes = graph.nodes.filter((n) => n.type === "decision");

        for (const dd of ddNodes) {
          const data = dd.data as any;
          if (!data.file_path || data.status === "overturned") continue;

          // Check git: files changed since DD date
          try {
            const since = data.date || "2020-01-01";
            const log = execSync(
              `git log --oneline --since="${since}" -- .`,
              { cwd: proj.path, encoding: "utf-8", timeout: 5000 }
            ).trim();
            if (log.split("\n").length > 5) {
              // Many commits since DD — potential drift
              const ddFile = path.join(proj.path, data.file_path);
              if (existsSync(ddFile)) {
                const stat = statSync(ddFile);
                drifted.push({
                  dd: dd.id,
                  file: data.file_path,
                  lastModified: stat.mtime.toISOString(),
                  ddDate: since,
                });
              }
            }
          } catch { /* git not available */ }
        }
      }

      return json(res, { drifted });
    }

    // GET /api/coverage — character coverage analysis
    if (req.method === "GET" && url.pathname === "/api/coverage") {
      const graphPath = path.join(config.distDir, "graph.json");
      if (!existsSync(graphPath)) return json(res, { error: "graph.json not found" }, 404);

      const graph: DVEGraph = JSON.parse(readFileSync(graphPath, "utf-8"));
      const charGaps: Record<string, { total: number; critical: number; high: number }> = {};

      // Count gaps per session's characters
      const sessions = graph.nodes.filter((n) => n.type === "session");
      for (const session of sessions) {
        const chars = (session.data as any).characters ?? [];
        const sessionGaps = graph.edges
          .filter((e) => e.source === session.id && e.type === "discovers")
          .map((e) => graph.nodes.find((n) => n.id === e.target))
          .filter(Boolean);

        for (const char of chars) {
          if (!charGaps[char]) charGaps[char] = { total: 0, critical: 0, high: 0 };
          charGaps[char].total += sessionGaps.length;
          charGaps[char].critical += sessionGaps.filter((g) => (g!.data as any).severity === "Critical").length;
          charGaps[char].high += sessionGaps.filter((g) => (g!.data as any).severity === "High").length;
        }
      }

      return json(res, { coverage: charGaps });
    }

    // GET /api/status — project states (DRE + phase)
    if (req.method === "GET" && url.pathname === "/api/status") {
      const states = config.projectDirs.map((p) =>
        detectProjectState(p.name, p.path)
      );
      return json(res, {
        projects: states,
        stateChart: {
          phases: ["spec", "implementation", "stabilization", "maintenance"],
          dreStates: ["FRESH", "INSTALLED", "CUSTOMIZED", "OUTDATED"],
        },
      });
    }

    // 404
    json(res, { error: "Not found" }, 404);
  });

  server.listen(port, () => {
    console.log(`  DVE API: http://localhost:${port}`);
  });

  return server;
}
