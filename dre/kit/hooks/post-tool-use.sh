#!/usr/bin/env bash
# DRE post-tool-use hook — update .dre/context.json from tool results
# Reads stdin (tool result JSON), extracts state transitions

set -euo pipefail

CTX_FILE=".dre/context.json"
[ -f "$CTX_FILE" ] || exit 0

INPUT=$(cat)

# Extract state from tool result if present
STATE=$(echo "$INPUT" | jq -r '.tool_result.content // empty' 2>/dev/null | jq -r '.state // empty' 2>/dev/null)
[ -z "$STATE" ] && exit 0

STACK=$(echo "$INPUT" | jq -r '.tool_result.content.stack // []' 2>/dev/null)
TRANSITION=$(echo "$INPUT" | jq -r '.tool_result.content.transition.on_complete // empty' 2>/dev/null)

# Read current context
CURRENT=$(cat "$CTX_FILE")

# Update context with new state
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ "$TRANSITION" = "POP" ]; then
  # Pop stack
  NEW_CTX=$(echo "$CURRENT" | jq --arg ts "$TIMESTAMP" --arg state "$STATE" '
    .stack = (.stack[:-1] // []),
    .current_phase = (.stack[-2] // .current_phase),
    .history += [{ phase: $state, timestamp: $ts, action: "pop" }]
  ')
else
  # Normal transition
  NEW_CTX=$(echo "$CURRENT" | jq --arg ts "$TIMESTAMP" --arg state "$STATE" '
    .current_phase = $state,
    .stack[-1] = $state,
    .history += [{ phase: $state, timestamp: $ts, action: "tool-transition" }]
  ')
fi

echo "$NEW_CTX" > "$CTX_FILE"
