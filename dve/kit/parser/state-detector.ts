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

// ─── DRE Workflow State Machine ───

export interface SMPhase {
  id: string;
  source: "base" | "plugin";
  plugin?: string;       // "dge" | "dde" etc.
  active: boolean;
}

export interface WorkflowState {
  phases: SMPhase[];
  currentPhase: string;
  currentSource: string;  // where was current phase detected
  stack: string[];         // from .dre/context.json
  plugins: { id: string; version: string | null; phase: string; insertAfter: string }[];
}

const BASE_PHASES = ["backlog", "spec", "impl", "review", "release"];

const PLUGIN_DEFS: { dir: string; id: string; phase: string; insertAfter: string }[] = [
  { dir: "dge", id: "dge", phase: "gap_extraction", insertAfter: "spec" },
  { dir: "dde", id: "dde", phase: "doc_deficit_check", insertAfter: "review" },
];

function readYamlSM(projectPath: string): { phases: string[]; pluginPhases: Record<string, string> } | null {
  const smPath = path.join(projectPath, ".dre", "state-machine.yaml");
  if (!existsSync(smPath)) return null;
  // Simple line-based YAML parse (avoid dependency)
  const content = readFileSync(smPath, "utf-8");
  const phases: string[] = [];
  const pluginPhases: Record<string, string> = {};
  let inPhases = false;
  for (const line of content.split("\n")) {
    if (/^phases:/.test(line)) { inPhases = true; continue; }
    if (inPhases) {
      const idMatch = line.match(/^\s+-\s+id:\s*(\S+)/);
      if (idMatch) phases.push(idMatch[1]);
      const pluginMatch = line.match(/^\s+-\s+(\w+)\s*#\s*(\w+)/);
      if (pluginMatch) pluginPhases[pluginMatch[2]] = pluginMatch[1];
    }
  }
  return phases.length > 0 ? { phases, pluginPhases } : null;
}

function readContextJson(projectPath: string): { stack: string[] } | null {
  const ctxPath = path.join(projectPath, ".dre", "context.json");
  if (!existsSync(ctxPath)) return null;
  try {
    const data = JSON.parse(readFileSync(ctxPath, "utf-8"));
    return { stack: data.stack ?? [] };
  } catch { return null; }
}

export function detectWorkflowState(projectPath: string): WorkflowState {
  // 1. Try real state-machine.yaml
  const yamlSM = readYamlSM(projectPath);

  // 2. Detect installed plugins
  const detectedPlugins: WorkflowState["plugins"] = [];
  for (const pdef of PLUGIN_DEFS) {
    const pluginDir = path.join(projectPath, pdef.dir);
    if (existsSync(pluginDir)) {
      let version: string | null = null;
      const versionFiles = [
        path.join(pluginDir, "kit", "version.txt"),
        path.join(pluginDir, "version.txt"),
      ];
      for (const vf of versionFiles) {
        if (existsSync(vf)) { version = readFileSync(vf, "utf-8").trim(); break; }
      }
      detectedPlugins.push({ ...pdef, version });
    }
  }

  // 3. Build phase list
  let phases: SMPhase[];
  if (yamlSM) {
    // Use real SM definition
    phases = yamlSM.phases.map((id) => {
      const pluginId = Object.entries(yamlSM.pluginPhases).find(([, phase]) => phase === id)?.[0];
      return {
        id,
        source: pluginId ? "plugin" as const : "base" as const,
        plugin: pluginId,
        active: false,
      };
    });
  } else {
    // Build from defaults + detected plugins
    const phaseList: SMPhase[] = BASE_PHASES.map((id) => ({
      id, source: "base" as const, active: false,
    }));

    // Insert plugin phases
    for (const plugin of detectedPlugins) {
      const insertIdx = phaseList.findIndex((p) => p.id === plugin.insertAfter);
      if (insertIdx >= 0) {
        phaseList.splice(insertIdx + 1, 0, {
          id: plugin.phase,
          source: "plugin",
          plugin: plugin.id,
          active: false,
        });
      }
    }
    phases = phaseList;
  }

  // 4. Determine current phase
  let currentPhase = "unknown";
  let currentSource = "not detected";
  let stack: string[] = [];

  // Priority 1: .dre/context.json (runtime state)
  const ctx = readContextJson(projectPath);
  if (ctx && ctx.stack.length > 0) {
    currentPhase = ctx.stack[ctx.stack.length - 1].toLowerCase();
    currentSource = ".dre/context.json (stack top)";
    stack = ctx.stack;
  } else {
    // Priority 2: CLAUDE.md active_phase
    const phaseResult = detectPhase(projectPath);
    if (phaseResult.phase !== "unknown") {
      // Map active_phase to SM phase id
      const phaseMap: Record<string, string> = {
        spec: "spec", implementation: "impl",
        stabilization: "review", maintenance: "release",
      };
      currentPhase = phaseMap[phaseResult.phase] ?? phaseResult.phase;
      currentSource = phaseResult.source;
    }
  }

  // Mark active phase
  for (const phase of phases) {
    phase.active = phase.id === currentPhase;
  }

  return { phases, currentPhase, currentSource, stack, plugins: detectedPlugins };
}

// ─── Combined Project State ───

export interface ProjectState {
  projectName: string;
  projectPath: string;
  dre: DREState;
  phase: PhaseState;
  workflow: WorkflowState;
  dgeSessionCount: number;
  ddCount: number;
  lastSessionDate: string | null;
}

export function detectProjectState(projectName: string, projectPath: string): ProjectState {
  const dre = detectDREState(projectPath);
  const phase = detectPhase(projectPath);
  const workflow = detectWorkflowState(projectPath);

  const sessionsDir = path.join(projectPath, "dge", "sessions");
  const decisionsDir = path.join(projectPath, "dge", "decisions");

  let dgeSessionCount = 0;
  let ddCount = 0;
  let lastSessionDate: string | null = null;

  if (existsSync(sessionsDir)) {
    const files = readdirSync(sessionsDir).filter((f) => f.endsWith(".md") && f !== "index.md");
    dgeSessionCount = files.length;
    const dates = files
      .map((f) => f.match(/^(\d{4}-\d{2}-\d{2})/)?.[1])
      .filter(Boolean) as string[];
    if (dates.length > 0) lastSessionDate = dates.sort().reverse()[0];
  }

  if (existsSync(decisionsDir)) {
    ddCount = readdirSync(decisionsDir).filter((f) => f.endsWith(".md") && f !== "index.md").length;
  }

  return { projectName, projectPath, dre, phase, workflow, dgeSessionCount, ddCount, lastSessionDate };
}
