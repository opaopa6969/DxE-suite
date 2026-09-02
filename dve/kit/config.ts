// DVE configuration — multi-project support

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export interface ProjectConfig {
  name: string;
  path: string;        // absolute path to project root
  sessionsDir: string; // relative to path, default "dge/sessions"
  decisionsDir: string;
  specsDir: string;
  annotationsDir: string;
}

export interface DVEConfig {
  projects: ProjectConfig[];
  outputDir: string;   // where graph files go
}

const DEFAULT_DIRS = {
  sessionsDir: "dge/sessions",
  decisionsDir: "dge/decisions",
  specsDir: "dge/specs",
  annotationsDir: "dve/annotations",
};

export function loadConfig(configPath: string): DVEConfig | null {
  if (!existsSync(configPath)) return null;
  const raw = JSON.parse(readFileSync(configPath, "utf-8"));
  return {
    outputDir: raw.outputDir ?? "dve/dist",
    projects: (raw.projects ?? []).map((p: any) => ({
      name: p.name ?? path.basename(p.path),
      path: path.resolve(path.dirname(configPath), p.path),
      sessionsDir: p.sessionsDir ?? DEFAULT_DIRS.sessionsDir,
      decisionsDir: p.decisionsDir ?? DEFAULT_DIRS.decisionsDir,
      specsDir: p.specsDir ?? DEFAULT_DIRS.specsDir,
      annotationsDir: p.annotationsDir ?? DEFAULT_DIRS.annotationsDir,
    })),
  };
}

export function singleProjectConfig(cwd: string): DVEConfig {
  return {
    outputDir: path.join(cwd, "dve", "dist"),
    projects: [
      {
        name: path.basename(cwd),
        path: cwd,
        ...DEFAULT_DIRS,
      },
    ],
  };
}

export function resolveProjectDirs(project: ProjectConfig) {
  return {
    sessionsDir: path.join(project.path, project.sessionsDir),
    decisionsDir: path.join(project.path, project.decisionsDir),
    specsDir: path.join(project.path, project.specsDir),
    annotationsDir: path.join(project.path, project.annotationsDir),
    cwd: project.path,
  };
}

/** Return stable, filesystem-safe stems for per-project output files. */
export function projectFileStems(projects: ProjectConfig[]): string[] {
  const counts = new Map<string, number>();
  for (const project of projects) counts.set(project.name, (counts.get(project.name) ?? 0) + 1);
  const used = new Set<string>();

  return projects.map((project) => {
    const base = project.name.replace(/[^a-zA-Z0-9._-]+/g, "-") || "project";
    let stem = counts.get(project.name)! > 1
      ? `${base}-${createHash("sha1").update(project.path).digest("hex").slice(0, 8)}`
      : base;
    let suffix = 2;
    while (used.has(stem)) stem = `${base}-${suffix++}`;
    used.add(stem);
    return stem;
  });
}
