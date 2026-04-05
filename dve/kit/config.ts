// DVE configuration — multi-project support

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

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
