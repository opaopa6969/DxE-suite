// Drift detector — detect decisions that may have diverged from implementation

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { GraphNode, Decision } from "../graph/schema.js";

export interface DriftResult {
  ddId: string;
  commitsSince: number;
  latestCommit: string;
  ddDate: string;
}

export function detectDrift(ddNodes: GraphNode[], cwd: string): DriftResult[] {
  const results: DriftResult[] = [];

  for (const dd of ddNodes) {
    const data = dd.data as Partial<Decision>;
    if (!data.date || data.status === "overturned") continue;

    // Guard: only accept sane date strings to avoid passing garbage to git.
    // Accepted: YYYY-MM-DD (optionally with time / timezone suffix).
    if (!/^\d{4}-\d{2}-\d{2}([ T]\S*)?$/.test(data.date)) continue;

    try {
      const result = spawnSync(
        "git",
        ["log", "--oneline", `--since=${data.date}`, "--", "."],
        { cwd, encoding: "utf-8", timeout: 5000 }
      );
      if (result.status !== 0) continue;
      const log = (result.stdout ?? "").trim();

      const commits = log ? log.split("\n").length : 0;
      // Heuristic: if more than 10 commits since DD date, it might have drifted
      if (commits > 10) {
        const latest = log.split("\n")[0] ?? "";
        results.push({
          ddId: dd.id,
          commitsSince: commits,
          latestCommit: latest,
          ddDate: data.date,
        });
      }
    } catch {
      // git not available
    }
  }

  return results;
}
