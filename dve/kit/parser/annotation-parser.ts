// Annotation parser — extract annotations from dve/annotations/*.md

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Annotation, AnnotationAction, ParseResult } from "../graph/schema.js";

const VALID_ACTIONS: AnnotationAction[] = ["comment", "fork", "overturn", "constrain", "drift"];

export function parseAnnotation(filePath: string): ParseResult<Annotation> {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const warnings: string[] = [];
  const stem = path.basename(filePath, ".md");

  // Parse YAML frontmatter
  const fm: Record<string, string> = {};
  let inFrontmatter = false;
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "---") {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        bodyStart = i + 1;
        break;
      }
    }
    if (inFrontmatter) {
      const m = line.match(/^(\w[\w_]*)\s*:\s*(.+)/);
      if (m) fm[m[1]] = m[2].trim();
    }
  }

  const target = fm["target"] ?? "";
  const action = fm["action"] ?? "comment";
  const date = fm["date"] ?? "";
  const author = fm["author"] ?? "";
  const targetLine = fm["target_line"] ? parseInt(fm["target_line"], 10) : undefined;

  // Body is everything after frontmatter
  const body = lines.slice(bodyStart).join("\n").trim();

  // Determine target type
  let targetType: "session" | "gap" | "decision" = "decision";
  if (target.includes("#G-")) targetType = "gap";
  else if (target.startsWith("DD-")) targetType = "decision";
  else targetType = "session";

  // Validate action
  const validAction = VALID_ACTIONS.includes(action as AnnotationAction)
    ? (action as AnnotationAction)
    : "comment";
  if (action !== validAction) {
    warnings.push(`Unknown action "${action}", defaulting to "comment"`);
  }

  if (!target) warnings.push("No target specified");
  if (!body) warnings.push("Empty annotation body");

  return {
    node: {
      id: `A-${stem}`,
      target: { type: targetType, id: target },
      target_line: targetLine,
      author,
      date,
      body,
      action: validAction,
    },
    confidence: target && body ? 1.0 : 0.5,
    warnings,
    source: { file: filePath },
  };
}
