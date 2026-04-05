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

export function parseDecision(filePath: string): ParseResult<Decision> {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const warnings: string[] = [];
  const stem = path.basename(filePath, ".md");

  // ID from filename
  const idMatch = stem.match(DD_ID_RE);
  const id = idMatch ? `DD-${idMatch[1]}` : stem;

  // Title from H1
  const h1 = lines.find((l) => l.startsWith("# "));
  const title = h1?.replace(/^#\s+/, "").replace(/^DD-\d+[:：]?\s*/, "") ?? "";

  // Fields from frontmatter-style metadata
  const fields: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(FIELD_RE);
    if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();
  }

  const date = fields["date"] ?? "";

  // Session refs from links
  const sessionRefs: string[] = [];
  for (const match of content.matchAll(SESSION_LINK_RE)) {
    const sessionFile = match[2].replace(".md", "");
    sessionRefs.push(sessionFile);
  }

  // Gap refs from # numbers
  const gapRefs: string[] = [];
  const gapField = fields["gap"] ?? "";
  for (const match of gapField.matchAll(GAP_REF_RE)) {
    gapRefs.push(match[0]);
  }

  // Supersedes
  const supersedes: string[] = [];
  const supMatch = content.match(SUPERSEDES_RE);
  if (supMatch) {
    supersedes.push(...supMatch[1].split(/\s*,\s*/));
  }

  // Superseded by
  const supersededBy: string[] = [];
  const supByMatch = content.match(SUPERSEDED_BY_RE);
  if (supByMatch) {
    supersededBy.push(...supByMatch[1].split(/\s*,\s*/));
  }

  // Rationale — text under ## Rationale or ## Decision
  let rationale = "";
  let inRationale = false;
  for (const line of lines) {
    if (/^##\s+(Rationale|Decision)/i.test(line)) {
      inRationale = true;
      continue;
    }
    if (inRationale && line.startsWith("## ")) break;
    if (inRationale && line.trim()) {
      rationale += (rationale ? " " : "") + line.trim();
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
      rationale: rationale.slice(0, 500),
      status,
      supersedes,
      superseded_by: supersededBy,
      gap_refs: gapRefs,
      session_refs: sessionRefs,
      file_path: filePath,
    },
    confidence: date && title ? 1.0 : 0.7,
    warnings,
    source: { file: filePath },
  };
}
