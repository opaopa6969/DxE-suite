#!/usr/bin/env bash
# DRE workflow engine — PostToolUse hook
# stdin: Claude Code hook payload (JSON)
# 役割: tool_result に state フィールドがあれば .dre/context.json を更新する

set -euo pipefail

CONTEXT_FILE="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.dre/context.json"
INPUT=$(cat)

# tool_result.content が JSON 文字列かオブジェクトかを確認
RESULT_CONTENT=$(echo "$INPUT" | jq -r '.tool_result.content // empty')
[ -z "$RESULT_CONTENT" ] && exit 0

# content が JSON かチェック
if ! echo "$RESULT_CONTENT" | jq -e '.state' > /dev/null 2>&1; then
  exit 0
fi

STATE=$(echo "$RESULT_CONTENT" | jq -r '.state')
STACK=$(echo "$RESULT_CONTENT" | jq -c '.stack // []')
CONTEXT=$(echo "$RESULT_CONTENT" | jq -c '.context // {}')
TRANSITION=$(echo "$RESULT_CONTENT" | jq -c '.transition // {}')

# POP 処理
ON_COMPLETE=$(echo "$TRANSITION" | jq -r '.on_complete // empty')
if [ "$ON_COMPLETE" = "POP" ] && [ -f "$CONTEXT_FILE" ]; then
  # スタックの先頭を pop
  CURRENT_STACK=$(jq -c '.stack // []' "$CONTEXT_FILE")
  NEW_STACK=$(echo "$CURRENT_STACK" | jq -c '.[1:]')
  jq --argjson stack "$NEW_STACK" '.stack = $stack' "$CONTEXT_FILE" > "${CONTEXT_FILE}.tmp" && mv "${CONTEXT_FILE}.tmp" "$CONTEXT_FILE"
  exit 0
fi

# PUSH: context.json を更新
mkdir -p "$(dirname "$CONTEXT_FILE")"

if [ -f "$CONTEXT_FILE" ]; then
  # 既存の frames に現在の state を追加
  jq \
    --arg state "$STATE" \
    --argjson stack "$STACK" \
    --argjson ctx "$CONTEXT" \
    '.stack = $stack | .frames[$state] = $ctx' \
    "$CONTEXT_FILE" > "${CONTEXT_FILE}.tmp" && mv "${CONTEXT_FILE}.tmp" "$CONTEXT_FILE"
else
  # 新規作成
  jq -n \
    --arg state "$STATE" \
    --argjson stack "$STACK" \
    --argjson ctx "$CONTEXT" \
    '{stack: $stack, frames: {($state): $ctx}}' \
    > "$CONTEXT_FILE"
fi
