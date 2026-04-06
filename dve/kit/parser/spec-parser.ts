// Spec parser — extract specs from dge/specs/*.md

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Spec, ParseResult } from "../graph/schema.js";

const FIELD_RE = /^-\s+\*{0,2}(\w[\w\s/]*?)\*{0,2}[:：]\s*(.+)/;
const DD_REF_RE = /DD-\d+/g;
const SESSION_LINK_RE = /\[([^\]]+)\]\(\.\.\/sessions\/([^)]+)\)/g;

export function parseSpec(filePath: string): ParseResult<Spec> {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const warnings: string[] = [];
  const stem = path.basename(filePath, ".md");

  // Title from H1
  const h1 = lines.find((l) => l.startsWith("# "));
  const rawTitle = h1?.replace(/^#\s+/, "") ?? stem;

  // Extract type from title prefix (e.g. "TECH Spec:", "UC Spec:")
  let type: Spec["type"] = "TECH";
  if (/^UC\b/i.test(rawTitle)) type = "UC";
  else if (/^TECH\b/i.test(rawTitle)) type = "TECH";
  else if (/^DD\b|^ADR\b/i.test(rawTitle)) type = "DD";
  else if (/^DQ\b/i.test(rawTitle)) type = "DQ";
  else if (/^ACT\b/i.test(rawTitle)) type = "ACT";

  const title = rawTitle.replace(/^(UC|TECH|DD|ADR|DQ|ACT)\s+Spec[:：]?\s*/i, "").trim();

  // Fields
  const fields: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(FIELD_RE);
    if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();
  }

  const status = (fields["status"] ?? "draft") as Spec["status"];
  const migratedTo = fields["migrated_to"] ?? fields["migrated to"] ?? undefined;

  // DD references
  const decisionRefs: string[] = [];
  const resolves = fields["resolves"] ?? "";
  // Also scan session links for DD refs
  const allText = content;
  for (const match of allText.matchAll(DD_REF_RE)) {
    if (!decisionRefs.includes(match[0])) decisionRefs.push(match[0]);
  }

  return {
    node: {
      id: stem,
      title,
      type,
      status,
      decision_refs: decisionRefs,
      migrated_to: migratedTo,
      file_path: filePath,
      content,
    },
    confidence: title ? 1.0 : 0.5,
    warnings,
    source: { file: filePath },
  };
}
