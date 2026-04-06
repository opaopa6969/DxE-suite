#!/usr/bin/env bash
# recover-dialogues.sh — Extract DGE dialogues from Claude Code logs
# and merge them into existing session files that lack dialogue content.
#
# Usage:
#   bash dve/kit/scripts/recover-dialogues.sh [project-dir]
#   bash dve/kit/scripts/recover-dialogues.sh /path/to/volta-platform
#
# What it does:
#   1. Find Claude Code logs for the project
#   2. Extract assistant text blocks containing DGE dialogue markers
#   3. Match with existing session files by theme/date
#   4. Create enriched session files with dialogue included
#
# Dry run (default): shows what would be done. Add --apply to write files.

set -euo pipefail

PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
DRY_RUN=true

for arg in "$@"; do
  [ "$arg" = "--apply" ] && DRY_RUN=false
done

SESSIONS_DIR="${PROJECT_DIR}/dge/sessions"
CLAUDE_LOGS_DIR="$HOME/.claude/projects"

if [ ! -d "$SESSIONS_DIR" ]; then
  echo "Error: $SESSIONS_DIR not found."
  exit 1
fi

echo "🔍 Recovering DGE dialogues for: ${PROJECT_NAME}"
echo "   Sessions: ${SESSIONS_DIR}"
echo "   Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "APPLY")"
echo ""

# Find Claude Code log directory for this project
# Claude Code uses the path with dashes, e.g. -home-opa-work-AskOS-workspace-volta-platform
PROJECT_PATH_ENCODED=$(echo "$PROJECT_DIR" | sed 's|/|-|g')
LOG_DIR=""
for d in "$CLAUDE_LOGS_DIR"/*; do
  [ -d "$d" ] || continue
  DIRNAME="$(basename "$d")"
  if [ "$DIRNAME" = "$PROJECT_PATH_ENCODED" ]; then
    LOG_DIR="$d"
    break
  fi
done

if [ -z "$LOG_DIR" ]; then
  echo "  No Claude Code logs found for ${PROJECT_NAME}"
  echo "  Expected: ${CLAUDE_LOGS_DIR}/${PROJECT_PATH_ENCODED}"
  exit 0
fi

LOG_COUNT=$(find "$LOG_DIR" -maxdepth 1 -name "*.jsonl" | wc -l)
echo "  Found ${LOG_COUNT} log files in ${LOG_DIR}"
echo ""

# Extract all DGE dialogue blocks from logs
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "  Extracting DGE dialogues from logs..."

for LOGFILE in "$LOG_DIR"/*.jsonl; do
  [ -f "$LOGFILE" ] || continue
  BASENAME=$(basename "$LOGFILE" .jsonl)

  # Extract assistant text blocks that contain DGE markers
  grep '"type":"assistant"' "$LOGFILE" 2>/dev/null | \
    jq -r '.message.content[] | select(.type=="text") | .text' 2>/dev/null | \
    awk '
      /^#.*DGE Session|^##.*Scene [0-9]|^##.*Scene [０-９]/ { found=1 }
      found { print }
      /^---$/ && found && length > 100 { }
    ' > "$TMPDIR/${BASENAME}.txt" 2>/dev/null || true

  # Also try: look for blocks with Gap markers + character dialogue
  grep '"type":"assistant"' "$LOGFILE" 2>/dev/null | \
    jq -r '.message.content[] | select(.type=="text") | .text' 2>/dev/null | \
    awk '
      /→.*Gap 発見|Gap 発見:/ { gap++ }
      /先輩.*ナレーション|☕|👤|🎩|😰|⚔|🎨|📊|🏥|😈/ { char++ }
      { lines[NR] = $0 }
      END {
        if (gap > 0 && char > 0) {
          for (i=1; i<=NR; i++) print lines[i]
        }
      }
    ' >> "$TMPDIR/${BASENAME}.txt" 2>/dev/null || true
done

# Count extracted content
EXTRACTED=$(find "$TMPDIR" -name "*.txt" -size +100c | wc -l)
echo "  Extracted dialogue from ${EXTRACTED} log files"
echo ""

# Match with session files
RECOVERED=0
SKIPPED=0

for SESSION_FILE in "$SESSIONS_DIR"/*.md; do
  [ -f "$SESSION_FILE" ] || continue
  FNAME="$(basename "$SESSION_FILE")"

  # Check if session already has dialogue
  HAS_DIALOGUE=$(grep -cE "Scene|先輩|ナレーション|☕|👤|🎩" "$SESSION_FILE" 2>/dev/null || true)
  if [ "$HAS_DIALOGUE" -gt 2 ]; then
    continue  # Already has dialogue
  fi

  # Extract theme from session file
  THEME=$(grep -m1 "テーマ\|theme\|Theme" "$SESSION_FILE" 2>/dev/null | sed 's/.*[:：] *//' | head -1)
  DATE=$(echo "$FNAME" | grep -oP '^\d{4}-\d{2}-\d{2}' || true)

  if [ -z "$THEME" ] && [ -z "$DATE" ]; then
    continue
  fi

  # Search extracted dialogues for matching content
  BEST_MATCH=""
  BEST_SCORE=0

  for EXTRACTED_FILE in "$TMPDIR"/*.txt; do
    [ -s "$EXTRACTED_FILE" ] || continue
    SCORE=0

    # Match by theme keywords
    if [ -n "$THEME" ]; then
      KEYWORDS=$(echo "$THEME" | tr ' 　/・' '\n' | head -5)
      for KW in $KEYWORDS; do
        [ ${#KW} -lt 2 ] && continue
        KW_COUNT=$(grep -ci "$KW" "$EXTRACTED_FILE" 2>/dev/null || true)
        SCORE=$((SCORE + KW_COUNT))
      done
    fi

    # Match by date
    if [ -n "$DATE" ] && grep -q "$DATE" "$EXTRACTED_FILE" 2>/dev/null; then
      SCORE=$((SCORE + 10))
    fi

    if [ "$SCORE" -gt "$BEST_SCORE" ]; then
      BEST_SCORE=$SCORE
      BEST_MATCH="$EXTRACTED_FILE"
    fi
  done

  if [ "$BEST_SCORE" -gt 3 ] && [ -n "$BEST_MATCH" ]; then
    DIALOGUE_LINES=$(wc -l < "$BEST_MATCH")
    echo "  ✅ ${FNAME}"
    echo "     Theme: ${THEME:-N/A} | Score: ${BEST_SCORE} | Lines: ${DIALOGUE_LINES}"

    if [ "$DRY_RUN" = false ]; then
      # Backup original
      cp "$SESSION_FILE" "${SESSION_FILE}.bak"

      # Append dialogue section
      {
        echo ""
        echo "---"
        echo ""
        echo "## 会話劇（ログから復元）"
        echo ""
        cat "$BEST_MATCH"
      } >> "$SESSION_FILE"

      echo "     → Appended to ${SESSION_FILE}"
    fi
    RECOVERED=$((RECOVERED + 1))
  else
    SKIPPED=$((SKIPPED + 1))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Recovered: ${RECOVERED}"
echo "  Skipped:   ${SKIPPED} (no matching dialogue found)"
if [ "$DRY_RUN" = true ] && [ "$RECOVERED" -gt 0 ]; then
  echo ""
  echo "  Dry run complete. Add --apply to write files:"
  echo "  bash dve/kit/scripts/recover-dialogues.sh ${PROJECT_DIR} --apply"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
