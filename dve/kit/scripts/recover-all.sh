#!/usr/bin/env bash
# recover-all.sh — Recover ALL DxE artifacts from Claude Code logs
# Extracts Write tool calls for: sessions, decisions, specs, annotations
#
# Usage:
#   bash dve/kit/scripts/recover-all.sh [project-dir]        # dry run
#   bash dve/kit/scripts/recover-all.sh [project-dir] --apply # write files
#   bash dve/kit/scripts/recover-all.sh --scan-all            # all projects

set -euo pipefail

CLAUDE_LOGS_DIR="$HOME/.claude/projects"
DRY_RUN=true
SCAN_ALL=false

for arg in "$@"; do
  [ "$arg" = "--apply" ] && DRY_RUN=false
  [ "$arg" = "--scan-all" ] && SCAN_ALL=true
done

PROJECT_DIR="${1:-.}"
[ "$PROJECT_DIR" = "--scan-all" ] && PROJECT_DIR="."
[ "$PROJECT_DIR" = "--apply" ] && PROJECT_DIR="."
PROJECT_DIR="$(cd "$PROJECT_DIR" 2>/dev/null && pwd || echo "$PROJECT_DIR")"

echo "🔧 DxE Artifact Recovery"
echo "   Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "APPLY")"
echo ""

recover_project() {
  local PROJ_DIR="$1"
  local PROJ_NAME="$(basename "$PROJ_DIR")"

  local PATH_ENCODED=$(echo "$PROJ_DIR" | sed 's|/|-|g')
  local LOG_DIR=""
  for d in "$CLAUDE_LOGS_DIR"/*/; do
    [ -d "$d" ] || continue
    [ "$(basename "$d")" = "$PATH_ENCODED" ] && LOG_DIR="$d" && break
  done
  [ -z "$LOG_DIR" ] && return 0

  local LOG_COUNT=$(find "$LOG_DIR" -maxdepth 1 -name "*.jsonl" 2>/dev/null | wc -l)
  [ "$LOG_COUNT" -eq 0 ] && return 0

  echo "┌─ ${PROJ_NAME} (${LOG_COUNT} logs)"

  local TMPDIR=$(mktemp -d)

  # Step 1: Extract all Write tool calls to temp files
  for LOGFILE in "$LOG_DIR"/*.jsonl; do
    [ -f "$LOGFILE" ] || continue
    grep '"type":"assistant"' "$LOGFILE" 2>/dev/null | \
      jq -c '.message.content[]? | select(.type=="tool_use" and .name=="Write") | {path: .input.file_path, content: .input.content}' 2>/dev/null \
      >> "$TMPDIR/writes.jsonl" || true
  done

  [ ! -f "$TMPDIR/writes.jsonl" ] && echo "│  No Write calls found" && echo "└──────────────────────────────" && rm -rf "$TMPDIR" && return 0

  local TOTAL=$(wc -l < "$TMPDIR/writes.jsonl")
  local RECOVERED=0
  local UPDATED=0
  local SKIPPED=0

  # Step 2: Process each write
  while IFS= read -r line; do
    local FILE_PATH=$(echo "$line" | jq -r '.path // empty' 2>/dev/null)
    [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ] && continue

    # Only DxE files
    case "$FILE_PATH" in
      *dge/sessions/*|*dge/decisions/*|*dge/specs/*|*dve/annotations/*|*dve/contexts/*) ;;
      *) continue ;;
    esac

    # Get relative path
    local REL_PATH=""
    if [[ "$FILE_PATH" == "$PROJ_DIR"* ]]; then
      REL_PATH="${FILE_PATH#$PROJ_DIR/}"
    else
      REL_PATH=$(echo "$FILE_PATH" | grep -oP "(dge|dve)/.*" || true)
      [ -z "$REL_PATH" ] && continue
    fi

    local TARGET="${PROJ_DIR}/${REL_PATH}"

    # Extract content to temp file (avoid shell variable size limits)
    echo "$line" | jq -r '.content // empty' 2>/dev/null > "$TMPDIR/content.tmp"
    local LOG_LINES=$(wc -l < "$TMPDIR/content.tmp")
    [ "$LOG_LINES" -lt 3 ] && continue

    local LOG_HAS_DIALOGUE=$(grep -cE "Scene|先輩|ナレーション|☕|👤|🎩|😰|⚔|🎨|📊" "$TMPDIR/content.tmp" 2>/dev/null || true)

    if [ ! -f "$TARGET" ]; then
      echo "│  ✅ [NEW] ${REL_PATH} (${LOG_LINES} lines)"
      if [ "$DRY_RUN" = false ]; then
        mkdir -p "$(dirname "$TARGET")"
        cp "$TMPDIR/content.tmp" "$TARGET"
      fi
      RECOVERED=$((RECOVERED + 1))
    else
      local EXISTING_LINES=$(wc -l < "$TARGET")
      local HAS_DIALOGUE=$(grep -cE "Scene|先輩|ナレーション|☕|👤|🎩|😰|⚔|🎨|📊" "$TARGET" 2>/dev/null || true)

      # Update if log version is significantly larger and has more dialogue
      if [ "$LOG_LINES" -gt "$((EXISTING_LINES + 20))" ] && [ "$LOG_HAS_DIALOGUE" -gt "$HAS_DIALOGUE" ]; then
        echo "│  🔄 [UPDATE] ${REL_PATH} (${EXISTING_LINES}→${LOG_LINES} lines, dialogue: ${HAS_DIALOGUE}→${LOG_HAS_DIALOGUE})"
        if [ "$DRY_RUN" = false ]; then
          cp "$TARGET" "${TARGET}.bak"
          cp "$TMPDIR/content.tmp" "$TARGET"
        fi
        UPDATED=$((UPDATED + 1))
      else
        SKIPPED=$((SKIPPED + 1))
      fi
    fi
  done < "$TMPDIR/writes.jsonl"

  echo "│  Total writes: ${TOTAL} | Recovered: ${RECOVERED} | Updated: ${UPDATED} | Skipped: ${SKIPPED}"
  echo "└──────────────────────────────"

  rm -rf "$TMPDIR"
}

if [ "$SCAN_ALL" = true ]; then
  # Discover project paths from Write tool calls in logs
  DISCOVERED_PATHS=$(mktemp)
  for LOG_DIR in "$CLAUDE_LOGS_DIR"/*/; do
    [ -d "$LOG_DIR" ] || continue
    for f in "$LOG_DIR"*.jsonl; do
      [ -f "$f" ] || continue
      grep '"type":"assistant"' "$f" 2>/dev/null | \
        jq -r '.message.content[]? | select(.type=="tool_use" and .name=="Write") | .input.file_path // empty' 2>/dev/null | \
        grep -E "dge/|dve/" | \
        sed 's|/dge/.*||; s|/dve/.*||' | \
        sort -u >> "$DISCOVERED_PATHS" 2>/dev/null || true
    done
  done
  sort -u "$DISCOVERED_PATHS" | while IFS= read -r PROJ_PATH; do
    [ -z "$PROJ_PATH" ] && continue
    [ -d "$PROJ_PATH" ] && recover_project "$PROJ_PATH" || true
  done
  rm -f "$DISCOVERED_PATHS"
else
  recover_project "$PROJECT_DIR"
fi

echo ""
if [ "$DRY_RUN" = true ]; then
  echo "Dry run complete. Add --apply to write files."
fi
