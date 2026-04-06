#!/usr/bin/env bash
# discover-decisions.sh — Scan Claude Code logs for implicit decisions
# Finds decision-like patterns in regular conversations (not just DGE sessions)
# Outputs DD draft candidates for review.
#
# Usage:
#   bash dve/kit/scripts/discover-decisions.sh [project-dir]
#   bash dve/kit/scripts/discover-decisions.sh [project-dir] --apply  # create DD drafts

set -euo pipefail

PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" 2>/dev/null && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
CLAUDE_LOGS_DIR="$HOME/.claude/projects"
DRY_RUN=true

for arg in "$@"; do [ "$arg" = "--apply" ] && DRY_RUN=false; done

# Find log directory
PATH_ENCODED=$(echo "$PROJECT_DIR" | sed 's|/|-|g')
LOG_DIR=""
for d in "$CLAUDE_LOGS_DIR"/*/; do
  [ -d "$d" ] || continue
  [ "$(basename "$d")" = "$PATH_ENCODED" ] && LOG_DIR="$d" && break
done

if [ -z "$LOG_DIR" ]; then
  echo "No Claude Code logs found for ${PROJECT_NAME}"
  exit 0
fi

echo "🔍 Discovering implicit decisions in: ${PROJECT_NAME}"
echo "   Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "APPLY")"
echo ""

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Extract all assistant text from logs
for LOGFILE in "$LOG_DIR"/*.jsonl; do
  [ -f "$LOGFILE" ] || continue
  grep '"type":"assistant"' "$LOGFILE" 2>/dev/null | \
    jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null \
    >> "$TMPDIR/all_text.txt" 2>/dev/null || true
done

[ ! -s "$TMPDIR/all_text.txt" ] && echo "  No assistant text found." && exit 0

TOTAL_LINES=$(wc -l < "$TMPDIR/all_text.txt")
echo "  Scanned ${TOTAL_LINES} lines of conversation"
echo ""

# Decision patterns — phrases that indicate a decision was made
# Japanese + English patterns
grep -niE \
  "にしよう|にする$|に決定|で行く|を採用|を選択|で確定|却下|不要|やめる|使わない|で十分|にした$|を使う|に変更|方針:|決定:|確定:|採用:|選定:|Direction:|Decision:|Decided:|We.ll (use|go with)|Let.s (use|go with|switch)|chose|picked|settled on|going with" \
  "$TMPDIR/all_text.txt" 2>/dev/null > "$TMPDIR/candidates_raw.txt" || true

CANDIDATE_COUNT=$(wc -l < "$TMPDIR/candidates_raw.txt" 2>/dev/null || echo 0)

if [ "$CANDIDATE_COUNT" -eq 0 ]; then
  echo "  No decision patterns found."
  exit 0
fi

# Deduplicate and extract context (nearby lines)
echo "  Found ${CANDIDATE_COUNT} potential decision lines"
echo ""

# Group by topic — extract key phrases
awk '{
  # Remove line numbers and whitespace
  gsub(/^[0-9]+:/, "")
  gsub(/^[[:space:]]+/, "")
  # Skip very short lines
  if (length < 15) next
  # Skip lines that are clearly code
  if (/^[{}\[\]<>\/]/ || /^import / || /^const / || /^function /) next
  # Skip DGE session markers (already captured)
  if (/→ Gap 発見/ || /^##.*Scene/) next
  print
}' "$TMPDIR/candidates_raw.txt" | sort -u > "$TMPDIR/candidates.txt"

UNIQUE_COUNT=$(wc -l < "$TMPDIR/candidates.txt")
echo "  Unique candidates: ${UNIQUE_COUNT}"
echo ""

# Display candidates
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Implicit Decision Candidates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

INDEX=0
while IFS= read -r line; do
  INDEX=$((INDEX + 1))
  echo "  ${INDEX}. ${line}"
done < "$TMPDIR/candidates.txt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create DD drafts if --apply
if [ "$DRY_RUN" = false ]; then
  DD_DIR="${PROJECT_DIR}/dge/decisions"
  mkdir -p "$DD_DIR"

  # Find next DD number
  LAST_DD=$(find "$DD_DIR" -name "DD-*.md" 2>/dev/null | \
    grep -oP 'DD-\d+' | sort -t- -k2 -n | tail -1 | grep -oP '\d+' || echo 0)
  NEXT_DD=$((LAST_DD + 1))

  # Create a single DD draft with all candidates
  DD_NUM=$(printf "%03d" $NEXT_DD)
  DD_FILE="${DD_DIR}/DD-${DD_NUM}-implicit-decisions.md"

  {
    echo "# DD-${DD_NUM}: Implicit Decisions (discovered from conversations)"
    echo ""
    echo "- **Date**: $(date +%Y-%m-%d)"
    echo "- **Status**: draft"
    echo "- **Source**: Claude Code conversation logs (discover-decisions.sh)"
    echo ""
    echo "## Decisions Found"
    echo ""
    echo "Review each candidate. Keep relevant ones, delete the rest."
    echo ""
    INDEX=0
    while IFS= read -r line; do
      INDEX=$((INDEX + 1))
      echo "### ${INDEX}. ${line}"
      echo ""
      echo "- **Status**: TODO (keep / reject / merge with existing DD)"
      echo "- **Rationale**: (fill in)"
      echo ""
    done < "$TMPDIR/candidates.txt"
  } > "$DD_FILE"

  echo ""
  echo "  Created: ${DD_FILE}"
  echo "  Review and edit the file — keep relevant decisions, delete noise."
fi

echo ""
if [ "$DRY_RUN" = true ]; then
  echo "  Add --apply to create DD draft: dge/decisions/DD-NNN-implicit-decisions.md"
fi
