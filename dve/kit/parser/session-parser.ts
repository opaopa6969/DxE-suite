// Session parser — graduated extraction from dge/sessions/*.md

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Session, Gap, ParseResult } from "../graph/schema.js";

const GAP_MARKER = /^.*→\s*Gap\s*発見[:：]\s*(.+)/;
const GAP_TABLE_ROW = /\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*\*{0,2}(Critical|High|Medium|Low)\*{0,2}\s*\|/;
const GAP_TABLE_ROW_5COL = /\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(Critical|High|Medium|Low)\s*\|\s*(.+?)\s*\|/;
const CHAR_LINE = /^\*{0,2}([^\*]+?)\*{0,2}[:：]/;
const ICON_NAME = /^([\p{Emoji_Presentation}\p{Emoji}\uFE0F]+)\s*(.+)/u;

interface SessionParseOutput {
  session: ParseResult<Session>;
  gaps: ParseResult<Gap>[];
}

function extractDateAndTheme(filename: string): { date: string; theme: string } | null {
  const stem = path.basename(filename, ".md");
  const match = stem.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (match) return { date: match[1], theme: match[2] };
  return null;
}

function extractFrontmatter(lines: string[]): Record<string, string> {
  const fm: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(/^-\s+\*{0,2}(\w[\w\s]*?)\*{0,2}[:：]\s*(.+)/);
    if (m) fm[m[1].trim().toLowerCase()] = m[2].trim();
    if (line.startsWith("---") && Object.keys(fm).length > 0) break;
    if (line.startsWith("## ") && Object.keys(fm).length > 0) break;
  }
  return fm;
}

export function parseSession(filePath: string): SessionParseOutput {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const warnings: string[] = [];

  // Level 1: filename → date + id
  const fileInfo = extractDateAndTheme(filePath);
  const id = path.basename(filePath, ".md");
  const date = fileInfo?.date ?? "";
  const theme = fileInfo?.theme ?? "";

  if (!fileInfo) {
    warnings.push("Could not extract date/theme from filename");
  }

  // Frontmatter extraction
  const fm = extractFrontmatter(lines);

  // Characters from frontmatter
  const charsRaw = fm["characters"] ?? "";
  const characters = charsRaw
    ? charsRaw.split(/[,、]/).map((c) => c.trim()).filter(Boolean)
    : [];

  const flow = fm["flow"]?.replace(/\s*\(.+\)/, "") ?? "quick";
  const structure = fm["structure"] ?? "roundtable";
  const sessionTheme = fm["theme"] ?? fm["テーマ"] ?? theme;

  const session: ParseResult<Session> = {
    node: {
      id,
      date,
      theme: sessionTheme || theme,
      flow,
      structure,
      characters,
      file_path: filePath,
    },
    confidence: fileInfo ? 0.9 : 0.5,
    warnings: [...warnings],
    source: { file: filePath },
  };

  // Level 2: Gap markers
  const gaps: ParseResult<Gap>[] = [];
  let gapIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const gapMatch = line.match(GAP_MARKER);
    if (gapMatch) {
      gapIndex++;
      const gapId = `${id}#G-${String(gapIndex).padStart(3, "0")}`;
      gaps.push({
        node: {
          id: gapId,
          session_id: id,
          summary: gapMatch[1].trim(),
          category: "",
          severity: "Unknown",
          status: "Active",
          line_ref: i + 1,
          discovered_by: [],
        },
        confidence: 0.9,
        warnings: [],
        source: { file: filePath, line: i + 1 },
      });
    }
  }

  // Level 3: Gap table → category + severity (supports 4-col and 5-col tables)
  const tableGaps: { index: number; summary: string; category: string; severity: string; status?: string }[] = [];
  for (const line of lines) {
    const match5 = line.match(GAP_TABLE_ROW_5COL);
    if (match5) {
      tableGaps.push({
        index: parseInt(match5[1], 10),
        summary: match5[2].trim(),
        category: match5[3].trim(),
        severity: match5[4],
        status: match5[5].trim(),
      });
      continue;
    }
    const tableMatch = line.match(GAP_TABLE_ROW);
    if (tableMatch) {
      tableGaps.push({
        index: parseInt(tableMatch[1], 10),
        summary: tableMatch[2].trim(),
        category: tableMatch[3].trim(),
        severity: tableMatch[4],
      });
    }
  }

  // If no gap markers found but table exists, create gaps from table
  if (gaps.length === 0 && tableGaps.length > 0) {
    for (const tg of tableGaps) {
      const gapId = `${id}#G-${String(tg.index).padStart(3, "0")}`;
      const status = tg.status?.includes("Resolved") ? "Archived" as const
        : tg.status?.includes("Active") ? "Active" as const
        : "Active" as const;
      gaps.push({
        node: {
          id: gapId,
          session_id: id,
          summary: tg.summary,
          category: tg.category,
          severity: tg.severity as Gap["severity"],
          status,
          line_ref: 0,
          discovered_by: [],
        },
        confidence: 0.8,
        warnings: ["Gap extracted from table (no inline marker)"],
        source: { file: filePath },
      });
    }
  } else {
    // Match table rows to gaps by index
    for (const tg of tableGaps) {
      const gap = gaps[tg.index - 1];
      if (gap?.node) {
        if (tg.category) gap.node.category = tg.category;
        if (tg.severity) {
          gap.node.severity = tg.severity as Gap["severity"];
          gap.confidence = 0.95;
        }
        if (tg.status?.includes("Resolved")) gap.node.status = "Archived";
        if (tg.summary.length > (gap.node.summary?.length ?? 0)) {
          gap.node.summary = tg.summary;
        }
      }
    }

    // Mark gaps without severity
    for (const gap of gaps) {
      if (gap.node.severity === "Unknown") {
        gap.warnings.push("severity not found (no gap table or pre-v3 format)");
        gap.confidence = Math.min(gap.confidence, 0.7);
      }
    }
  }

  if (gaps.length === 0) {
    session.warnings.push("No gap markers found");
    session.confidence = Math.min(session.confidence, 0.6);
  }

  return { session, gaps };
}
