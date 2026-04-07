#!/usr/bin/env bash
# audit-duplicates.sh — Detect self-implemented features that DxE toolkit already provides
#
# Usage:
#   bash dve/kit/scripts/audit-duplicates.sh [project-dir]
#   dve scan [dir] --audit

set -euo pipefail

PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" 2>/dev/null && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

echo "🔍 Audit: ${PROJECT_NAME}"
echo ""

FINDINGS=0

# ─── Known DxE capabilities vs self-implementations ───

declare -A CAPABILITIES
# pattern → DxE toolkit that provides it
CAPABILITIES=(
  ["*glossary*linker*|*GlossaryLinker*|*auto-link*"]="DDE dde-link (npx dde-link --fix)"
  ["*state-machine*|*state_machine*|*workflow-engine*"]="DRE workflow engine (dre-engine init)"
  ["*gap-extract*|*gap_extract*|*design-review*"]="DGE session (dge-session skill)"
  ["*decision-vis*|*decision_vis*"]="DVE (dve build + dve serve)"
)

for patterns in "${!CAPABILITIES[@]}"; do
  TOOLKIT="${CAPABILITIES[$patterns]}"
  IFS='|' read -ra PATS <<< "$patterns"

  for pat in "${PATS[@]}"; do
    # Search for files matching the pattern (excluding node_modules, .git, dge/, dre/, dve/, dde/)
    FOUND=$(find "$PROJECT_DIR" -path "*/node_modules" -prune -o -path "*/.git" -prune -o \
      -path "*/dge" -prune -o -path "*/dre" -prune -o -path "*/dve" -prune -o -path "*/dde" -prune -o \
      -name "$pat" -print 2>/dev/null | head -3)

    if [ -n "$FOUND" ]; then
      echo "  ⚠️  Self-implementation detected:"
      echo "$FOUND" | while read -r f; do
        echo "     ${f#$PROJECT_DIR/}"
      done
      echo "     → Already available: ${TOOLKIT}"
      echo ""
      FINDINGS=$((FINDINGS + 1))
    fi
  done
done

# ─── Check for outdated toolkit versions ───

check_version() {
  local TOOLKIT_NAME="$1"
  local LOCAL_VERSION_FILE="$2"
  local KIT_VERSION_FILE="$3"

  if [ -f "$LOCAL_VERSION_FILE" ] && [ -f "$KIT_VERSION_FILE" ]; then
    LOCAL_V=$(cat "$LOCAL_VERSION_FILE" 2>/dev/null | tr -d '[:space:]')
    KIT_V=$(cat "$KIT_VERSION_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ "$LOCAL_V" != "$KIT_V" ] && [ -n "$LOCAL_V" ] && [ -n "$KIT_V" ]; then
      echo "  📦 ${TOOLKIT_NAME}: ${LOCAL_V} → ${KIT_V} available"
      echo "     Run: dxe update ${TOOLKIT_NAME,,}"
      echo ""
      FINDINGS=$((FINDINGS + 1))
    fi
  fi
}

# Check known toolkit locations
DXE_HOME="${DXE_HOME:-$HOME/work/AskOS-workspace/DxE-suite}"
check_version "DGE" "$PROJECT_DIR/dge/version.txt" "$DXE_HOME/dge/kit/version.txt"
check_version "DRE" "$PROJECT_DIR/.claude/.dre-version" "$DXE_HOME/dre/kit/version.txt"

# ─── Check for unused DxE features ───

# DDE linker available but not used (no dde-link in recent git log)
if [ -d "$PROJECT_DIR/docs/glossary" ]; then
  DDE_INSTALLED=$(ls "$PROJECT_DIR/node_modules/@unlaxer/dde-toolkit" 2>/dev/null | head -1)
  if [ -n "$DDE_INSTALLED" ]; then
    RECENT_DDE_LINK=$(git -C "$PROJECT_DIR" log --oneline -20 2>/dev/null | grep -c "dde-link" || true)
    if [ "$RECENT_DDE_LINK" -eq 0 ]; then
      echo "  💡 DDE linker is installed but hasn't been used recently"
      echo "     docs/glossary/ exists with $(ls "$PROJECT_DIR/docs/glossary/"*.md 2>/dev/null | wc -l) articles"
      echo "     Run: npx dde-link --check README.md"
      echo ""
      FINDINGS=$((FINDINGS + 1))
    fi
  fi
fi

# ─── Summary ───

if [ "$FINDINGS" -eq 0 ]; then
  echo "  ✅ No duplicates or unused features found."
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ${FINDINGS} finding(s)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
