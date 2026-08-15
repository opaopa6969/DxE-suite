// Decision parser — extract DD from dge/decisions/DD-*.md

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Decision, ParseResult } from "../graph/schema.js";

const DD_ID_RE = /^DD-(\d+)/;
const FIELD_RE = /^-\s+\*{0,2}(\w[\w\s/]*?)\*{0,2}[:：]\s*(.+)/;
const SESSION_LINK_RE = /\[([^\]]+)\]\(\.\.\/sessions\/([^)]+)\)/g;
const GAP_REF_RE = /#(\d+)/g;
const SUPERSEDES_RE = /Supersedes[:：]\s*(DD-\d+(?:\s*,\s*DD-\d+)*)/i;
const SUPERSEDED_BY_RE = /Superseded\s+by[:：]\s*(DD-\d+(?:\s*,\s*DD-\d+)*)/i;
const RATIONALE_RE = /^##\s+(Rationale|Decision)/i;

export function parseDecision(filePath: string): ParseResult<Decision> {
  const content = readFileSync(filePath, "utf-8");
  const warnings: string[] = [];
  const stem = path.basename(filePath, ".md");

  // ID from filename
  const idMatch = stem.match(DD_ID_RE);
  const id = idMatch ? `DD-${idMatch[1]}` : stem;

  // Single-pass over lines: extract H1 title, frontmatter fields, rationale,
  // supersedes/superseded-by (line-based, avoids full-content .match() scans).
  const fields: Record<string, string> = {};
  let title = "";
  let rationale = "";
  let inRationale = false;
  const supersedes: string[] = [];
  const supersededBy: string[] = [];

  const lines = content.split("\n");
  for (const line of lines) {
    // H1 title (first occurrence)
    if (!title && line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "").replace(/^DD-\d+[:：]?\s*/, "");
    }

    // Frontmatter-style fields
    const m = line.match(FIELD_RE);
    if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();

    // Rationale section
    if (RATIONALE_RE.test(line)) {
      inRationale = true;
      continue;
    }
    if (inRationale) {
      if (line.startsWith("## ")) break;
      const trimmed = line.trim();
      if (trimmed) rationale += (rationale ? " " : "") + trimmed;
    }
  }

  // Supersedes / superseded-by via single full-content scan each (rare lines,
  // but anchored regex is cheaper than per-line testing for these patterns).
  const supMatch = content.match(SUPERSEDES_RE);
  if (supMatch) supersedes.push(...supMatch[1].split(/\s*,\s*/));
  const supByMatch = content.match(SUPERSEDED_BY_RE);
  if (supByMatch) supersededBy.push(...supByMatch[1].split(/\s*,\s*/));

  const date = fields["date"] ?? "";

  // Session refs from links
  const sessionRefs: string[] = [];
  for (const match of content.matchAll(SESSION_LINK_RE)) {
    sessionRefs.push(match[2].replace(".md", ""));
  }

  // Gap refs from # numbers
  const gapRefs: string[] = [];
  const gapField = fields["gap"] ?? "";
  if (gapField) {
    for (const match of gapField.matchAll(GAP_REF_RE)) {
      gapRefs.push(match[0]);
    }
  }

  // Status — check frontmatter for explicit status, otherwise default to active
  const statusField = fields["status"]?.toLowerCase();
  const status = statusField === "overturned" ? "overturned" as const : "active" as const;

  if (!date) warnings.push("date not found");
  if (sessionRefs.length === 0) warnings.push("no session references found");

  return {
    node: {
      id,
      title,
      date,
      rationale,
      status,
      supersedes,
      superseded_by: supersededBy,
      gap_refs: gapRefs,
      session_refs: sessionRefs,
      file_path: filePath,
      content,
    },
    confidence: date && title ? 1.0 : 0.7,
    warnings,
    source: { file: filePath },
  };
}
