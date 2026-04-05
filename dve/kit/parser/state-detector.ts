// State detector — detect DRE install state and project phase for each project

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

// ─── DRE Install State ───

export type DREInstallState = "FRESH" | "INSTALLED" | "CUSTOMIZED" | "OUTDATED" | "UNKNOWN";

export interface DREState {
  installState: DREInstallState;
  localVersion: string | null;
  kitVersion: string | null;
  customizedFiles: string[];
  totalFiles: number;
}

export function detectDREState(projectPath: string): DREState {
  const claudeDir = path.join(projectPath, ".claude");
  const dreVersionFile = path.join(claudeDir, ".dre-version");

  // Check if .claude/ exists
  if (!existsSync(claudeDir)) {
    return { installState: "FRESH", localVersion: null, kitVersion: null, customizedFiles: [], totalFiles: 0 };
  }

  // Read local version
  const localVersion = existsSync(dreVersionFile)
    ? readFileSync(dreVersionFile, "utf-8").trim()
    : null;

  if (!localVersion) {
    return { installState: "FRESH", localVersion: null, kitVersion: null, customizedFiles: [], totalFiles: 0 };
  }

  // Try to find kit version
  let kitVersion: string | null = null;
  const kitVersionPaths = [
    path.join(projectPath, "dre", "kit", "version.txt"),
    path.join(projectPath, "node_modules", "@unlaxer", "dre-toolkit", "version.txt"),
  ];
  for (const p of kitVersionPaths) {
    if (existsSync(p)) {
      kitVersion = readFileSync(p, "utf-8").trim();
      break;
    }
  }

  // Count files and detect customizations
  const dirs = ["rules", "skills", "agents", "commands", "profiles"];
  let totalFiles = 0;
  const customizedFiles: string[] = [];

  for (const dir of dirs) {
    const localDir = path.join(claudeDir, dir);
    if (!existsSync(localDir)) continue;

    const files = readdirSync(localDir).filter((f) => f.endsWith(".md"));
    totalFiles += files.length;

    // Check if any files differ from kit
    const kitDir = kitVersionPaths[0]
      ? path.join(path.dirname(kitVersionPaths[0]), "..", "kit", dir)
      : null;

    if (kitDir && existsSync(kitDir)) {
      for (const file of files) {
        const localFile = path.join(localDir, file);
        const kitFile = path.join(kitDir, file);
        if (existsSync(kitFile)) {
          try {
            const localContent = readFileSync(localFile, "utf-8");
            const kitContent = readFileSync(kitFile, "utf-8");
            if (localContent !== kitContent) {
              customizedFiles.push(`${dir}/${file}`);
            }
          } catch { /* ignore */ }
        }
      }
    }
  }

  // Determine state
  let installState: DREInstallState = "INSTALLED";
  if (kitVersion && localVersion !== kitVersion) {
    installState = "OUTDATED";
  } else if (customizedFiles.length > 0) {
    installState = "CUSTOMIZED";
  }

  return { installState, localVersion, kitVersion, customizedFiles, totalFiles };
}

// ─── Development Phase ───

export type DevPhase = "spec" | "implementation" | "stabilization" | "maintenance" | "unknown";

export interface PhaseState {
  phase: DevPhase;
  source: string;  // where was phase detected
}

export function detectPhase(projectPath: string): PhaseState {
  // 1. Check CLAUDE.md for active_phase
  const claudeMd = path.join(projectPath, ".claude", "CLAUDE.md");
  if (existsSync(claudeMd)) {
    const content = readFileSync(claudeMd, "utf-8");
    const match = content.match(/active_phase[:：]\s*(spec|implementation|stabilization|maintenance)/i);
    if (match) {
      return { phase: match[1].toLowerCase() as DevPhase, source: ".claude/CLAUDE.md" };
    }
  }

  // 2. Check CLAUDE.md at root
  const rootClaude = path.join(projectPath, "CLAUDE.md");
  if (existsSync(rootClaude)) {
    const content = readFileSync(rootClaude, "utf-8");
    const match = content.match(/active_phase[:：]\s*(spec|implementation|stabilization|maintenance)/i);
    if (match) {
      return { phase: match[1].toLowerCase() as DevPhase, source: "CLAUDE.md" };
    }
  }

  // 3. Heuristic: check git commit messages for phase prefixes
  try {
    const log = execSync("git log --oneline -20", {
      cwd: projectPath, encoding: "utf-8", timeout: 5000,
    }).trim();

    const lines = log.split("\n");
    const prefixes = lines.map((l) => {
      const m = l.match(/^\w+ (hotfix|fix|feat|docs|spec|test|refactor)[:(!]/);
      return m?.[1] ?? null;
    }).filter(Boolean) as string[];

    if (prefixes.length === 0) return { phase: "unknown", source: "no commits" };

    // Count prefix types
    const counts: Record<string, number> = {};
    for (const p of prefixes) counts[p] = (counts[p] ?? 0) + 1;

    if (counts["hotfix"]) return { phase: "maintenance", source: "git log (hotfix commits)" };
    if ((counts["fix"] ?? 0) + (counts["test"] ?? 0) > (counts["feat"] ?? 0)) {
      return { phase: "stabilization", source: "git log (fix/test > feat)" };
    }
    if ((counts["docs"] ?? 0) + (counts["spec"] ?? 0) > (counts["feat"] ?? 0)) {
      return { phase: "spec", source: "git log (docs/spec dominant)" };
    }
    return { phase: "implementation", source: "git log (feat dominant)" };
  } catch {
    return { phase: "unknown", source: "git not available" };
  }
}

// ─── Combined Project State ───

export interface ProjectState {
  projectName: string;
  projectPath: string;
  dre: DREState;
  phase: PhaseState;
  dgeSessionCount: number;
  ddCount: number;
  lastSessionDate: string | null;
}

export function detectProjectState(projectName: string, projectPath: string): ProjectState {
  const dre = detectDREState(projectPath);
  const phase = detectPhase(projectPath);

  // Count DGE sessions and DDs
  const sessionsDir = path.join(projectPath, "dge", "sessions");
  const decisionsDir = path.join(projectPath, "dge", "decisions");

  let dgeSessionCount = 0;
  let ddCount = 0;
  let lastSessionDate: string | null = null;

  if (existsSync(sessionsDir)) {
    const files = readdirSync(sessionsDir).filter((f) => f.endsWith(".md") && f !== "index.md");
    dgeSessionCount = files.length;
    // Extract latest date from filenames
    const dates = files
      .map((f) => f.match(/^(\d{4}-\d{2}-\d{2})/)?.[1])
      .filter(Boolean) as string[];
    if (dates.length > 0) lastSessionDate = dates.sort().reverse()[0];
  }

  if (existsSync(decisionsDir)) {
    ddCount = readdirSync(decisionsDir).filter((f) => f.endsWith(".md") && f !== "index.md").length;
  }

  return { projectName, projectPath, dre, phase, dgeSessionCount, ddCount, lastSessionDate };
}
