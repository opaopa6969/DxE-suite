#!/usr/bin/env bash
# discover-decisions.sh — Scan Claude Code logs for implicit decisions
# Detects: 1. Decision patterns in assistant text
#          2. User approval patterns (よろしく/GO/OK/うん/やろう) after proposals
#
# Usage:
#   bash dve/kit/scripts/discover-decisions.sh [project-dir]
#   bash dve/kit/scripts/discover-decisions.sh [project-dir] --apply

set -euo pipefail

PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" 2>/dev/null && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
CLAUDE_LOGS_DIR="$HOME/.claude/projects"
DRY_RUN=true

for arg in "$@"; do [ "$arg" = "--apply" ] && DRY_RUN=false; done

PATH_ENCODED=$(echo "$PROJECT_DIR" | sed 's|/|-|g')
LOG_DIR=""
for d in "$CLAUDE_LOGS_DIR"/*/; do
  [ -d "$d" ] || continue
  [ "$(basename "$d")" = "$PATH_ENCODED" ] && LOG_DIR="$d" && break
done

[ -z "$LOG_DIR" ] && echo "No logs for ${PROJECT_NAME}" && exit 0

echo "🔍 Discovering decisions in: ${PROJECT_NAME}"
echo "   Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "APPLY")"
echo ""

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

touch "$TMPDIR/approvals.txt" "$TMPDIR/explicit.txt"

for LOGFILE in "$LOG_DIR"/*.jsonl; do
  [ -f "$LOGFILE" ] || continue

  # Extract explicit decision patterns from assistant text
  grep '"type":"assistant"' "$LOGFILE" 2>/dev/null | \
    jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null | \
    grep -iE "にしよう|に決定|で行く|を採用|を選択|で確定|却下|方針:|決定:|確定:|Direction:|Decision:|Decided:|settled on" 2>/dev/null | \
    sed 's/^[[:space:]]*//' | \
    awk 'length >= 15 && length <= 300 && !/^[{}\[\]<>]/ && !/^import / && !/→ Gap 発見/' \
    >> "$TMPDIR/explicit.txt" 2>/dev/null || true

  # Extract user approval → assistant proposal pairs
  # User says: よろしく/GO/OK/うん/やろう etc. → previous assistant text is a decision
  grep '"type":"user"' "$LOGFILE" 2>/dev/null | \
    jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null | \
    grep -iE "^よろしく|^よろ$|^GO$|^OK|^ok$|^うん|^いいね|^やろう|^いこう|^進めて|^頼む|^push|^deploy|^実装して|^やって|^やる$" \
    >> "$TMPDIR/user_approvals.txt" 2>/dev/null || true

done

APPROVAL_COUNT=$(wc -l < "$TMPDIR/user_approvals.txt" 2>/dev/null || echo 0)

# Deduplicate explicit decisions
sort -u "$TMPDIR/explicit.txt" > "$TMPDIR/explicit_uniq.txt"
EXPLICIT_COUNT=$(wc -l < "$TMPDIR/explicit_uniq.txt" 2>/dev/null || echo 0)

TOTAL=$((EXPLICIT_COUNT + APPROVAL_COUNT))

echo "  Explicit decision patterns: ${EXPLICIT_COUNT}"
echo "  User approval patterns: ${APPROVAL_COUNT}"
echo "  Total: ${TOTAL}"
echo ""

if [ "$TOTAL" -eq 0 ]; then
  echo "  No decisions found."
  exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Discovered Decisions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

INDEX=0
while IFS= read -r line; do
  INDEX=$((INDEX + 1))
  [ $INDEX -gt 30 ] && echo "  ... (${EXPLICIT_COUNT} total, showing first 30)" && break
  echo "  📝 ${INDEX}. ${line}"
done < "$TMPDIR/explicit_uniq.txt"

if [ "$APPROVAL_COUNT" -gt 0 ]; then
  echo ""
  echo "  --- User Approvals (${APPROVAL_COUNT} times) ---"
  sort "$TMPDIR/user_approvals.txt" | uniq -c | sort -rn | head -10 | while read -r count text; do
    echo "  👍 ${text} (×${count})"
  done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = false ]; then
  DD_DIR="${PROJECT_DIR}/dge/decisions"
  mkdir -p "$DD_DIR"
  LAST_DD=$(find "$DD_DIR" -name "DD-*.md" 2>/dev/null | grep -oP 'DD-\d+' | sort -t- -k2 -n | tail -1 | grep -oP '\d+' || echo 0)
  NEXT_DD=$((LAST_DD + 1))
  DD_NUM=$(printf "%03d" $NEXT_DD)
  DD_FILE="${DD_DIR}/DD-${DD_NUM}-discovered.md"

  {
    echo "# DD-${DD_NUM}: Discovered Decisions"
    echo ""
    echo "- **Date**: $(date +%Y-%m-%d)"
    echo "- **Status**: draft"
    echo "- **Source**: discover-decisions.sh"
    echo ""
    echo "## Review each item: Keep / Merge / Reject"
    echo ""
    INDEX=0
    while IFS= read -r line; do
      INDEX=$((INDEX + 1))
      [ $INDEX -gt 30 ] && break
      echo "### ${INDEX}. ${line}"
      echo "- Action: TODO"
      echo ""
    done < "$TMPDIR/explicit_uniq.txt"
  } > "$DD_FILE"
  echo "  Created: ${DD_FILE}"
fi

echo ""
[ "$DRY_RUN" = true ] && echo "  Add --apply to create DD draft."
