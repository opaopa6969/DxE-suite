// git-linker — scan git log for "Ref: DD-*" and create implements edges

import { execSync } from "node:child_process";
import type { Edge } from "../graph/schema.js";

const REF_RE = /Ref:\s*(DD-\d+)/gi;

export interface GitLink {
  commit: string;
  date: string;
  message: string;
  ddRef: string;
}

export function scanGitLog(cwd: string, maxCommits = 500): GitLink[] {
  const links: GitLink[] = [];

  try {
    const log = execSync(
      `git log --oneline --format="%H|%aI|%s" -${maxCommits}`,
      { cwd, encoding: "utf-8", timeout: 10000 }
    );

    for (const line of log.split("\n")) {
      if (!line.trim()) continue;
      const [commit, date, ...msgParts] = line.split("|");
      const message = msgParts.join("|");

      for (const match of message.matchAll(REF_RE)) {
        links.push({
          commit: commit.trim(),
          date: date?.trim() ?? "",
          message: message.trim(),
          ddRef: match[1],
        });
      }
    }
  } catch {
    // git not available or not a repo — return empty
  }

  return links;
}

export function gitLinkerEdges(cwd: string, existingDDIds: Set<string>): Edge[] {
  const links = scanGitLog(cwd);
  const edges: Edge[] = [];

  for (const link of links) {
    if (existingDDIds.has(link.ddRef)) {
      edges.push({
        source: link.ddRef,
        target: `commit:${link.commit.slice(0, 7)}`,
        type: "implements",
        confidence: "explicit",
        evidence: `git commit ${link.commit.slice(0, 7)}: ${link.message}`,
      });
    }
  }

  return edges;
}
