#!/usr/bin/env bash
# DRE Stop Enforcement — check workflow obligations before stopping
# Returns JSON: {"ok": true} or {"ok": false, "reason": "..."}

set -euo pipefail

CTX_FILE=".dre/context.json"

if [ ! -f "$CTX_FILE" ]; then
  echo '{"ok": true}'
  exit 0
fi

CURRENT_PHASE=$(jq -r '.current_phase // empty' "$CTX_FILE" 2>/dev/null)
SUB_STATE=$(jq -r '.sub_state // empty' "$CTX_FILE" 2>/dev/null)
REASONS=""

# ─── DGE: gap_extraction phase ───
if [ "$CURRENT_PHASE" = "gap_extraction" ]; then
  TODAY=$(date +%Y-%m-%d)
  RECENT=$(find dge/sessions/ -name "${TODAY}*.md" -newer "$CTX_FILE" 2>/dev/null | wc -l || echo 0)

  if [ "$RECENT" -eq 0 ]; then
    REASONS="${REASONS}DGE gap_extraction phase active but no session saved today. MUST save dialogue. "
  else
    LATEST=$(find dge/sessions/ -name "${TODAY}*.md" -newer "$CTX_FILE" 2>/dev/null | sort | tail -1)
    if [ -n "$LATEST" ]; then
      HAS_DIALOGUE=$(grep -cE "Scene|先輩|ナレーション" "$LATEST" 2>/dev/null || echo 0)
      if [ "$HAS_DIALOGUE" -eq 0 ]; then
        REASONS="${REASONS}Session ${LATEST} has no dialogue. Save full dialogue text. "
      fi
    fi
  fi
fi

# ─── Stack: pending items ───
STACK_LEN=$(jq '.stack | length' "$CTX_FILE" 2>/dev/null || echo 0)
if [ "$STACK_LEN" -gt 1 ]; then
  STACK_TOP=$(jq -r '.stack[-1]' "$CTX_FILE" 2>/dev/null)
  REASONS="${REASONS}Workflow stack depth=${STACK_LEN} (top: ${STACK_TOP}). Pop or complete before stopping. "
fi

# ─── DVE: build needed check ───
if [ -f "dve/dist/graph.json" ]; then
  GRAPH_TIME=$(stat -c %Y dve/dist/graph.json 2>/dev/null || echo 0)
  NEWEST_SESSION=$(find dge/sessions/ -name "*.md" -newer dve/dist/graph.json 2>/dev/null | wc -l || echo 0)
  NEWEST_DD=$(find dge/decisions/ -name "DD-*.md" -newer dve/dist/graph.json 2>/dev/null | wc -l || echo 0)
  if [ "$NEWEST_SESSION" -gt 0 ] || [ "$NEWEST_DD" -gt 0 ]; then
    REASONS="${REASONS}[info] DVE graph.json is stale (${NEWEST_SESSION} new sessions, ${NEWEST_DD} new DDs). Consider: dve build. "
  fi
fi

# ─── Return ───
if [ -n "$REASONS" ]; then
  ESCAPED=$(echo "$REASONS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"ok\": false, \"reason\": \"${ESCAPED}\"}"
else
  echo '{"ok": true}'
fi
