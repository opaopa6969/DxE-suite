#!/usr/bin/env bash
set -euo pipefail

# DVE toolkit updater
# Updates kit, rebuilds, syncs skills

REAL_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
SCRIPT_DIR="$(cd "$(dirname "${REAL_PATH}")" && pwd)"
TARGET_DIR="${1:-.}"

SRC="${SCRIPT_DIR}"
SRC_VERSION="$(cat "${SRC}/version.txt" 2>/dev/null || echo "unknown")"
LOCAL_VERSION="$(cat "${TARGET_DIR}/dve/kit/version.txt" 2>/dev/null || echo "unknown")"

echo "DVE toolkit — update"
echo ""
echo "  Local:  ${LOCAL_VERSION}"
echo "  Source: ${SRC_VERSION}"
echo ""

if [ "${SRC_VERSION}" = "${LOCAL_VERSION}" ]; then
  echo "Already up to date."
  exit 0
fi

UPDATED=0

# Check skills
SKILLS_DIR="${TARGET_DIR}/.claude/skills"
if [ -d "${SRC}/skills" ]; then
  for SKILL in "${SRC}/skills/"*.md; do
    [ -f "${SKILL}" ] || continue
    FNAME="$(basename "${SKILL}")"
    if [ ! -f "${SKILLS_DIR}/${FNAME}" ]; then
      echo "  [new]     .claude/skills/${FNAME}"
      UPDATED=$((UPDATED + 1))
    elif ! diff -q "${SKILL}" "${SKILLS_DIR}/${FNAME}" > /dev/null 2>&1; then
      echo "  [skip]    .claude/skills/${FNAME}  ← customized"
    fi
  done
fi

if [ "${UPDATED}" -eq 0 ]; then
  echo "No new files. Rebuilding kit..."
fi

# Recompile
if [ -f "${SRC}/tsconfig.json" ]; then
  echo "  Compiling kit..."
  (cd "${SRC}" && npx tsc 2>/dev/null || true)
fi

# Copy new skills
if [ -d "${SRC}/skills" ]; then
  mkdir -p "${SKILLS_DIR}"
  for SKILL in "${SRC}/skills/"*.md; do
    [ -f "${SKILL}" ] || continue
    FNAME="$(basename "${SKILL}")"
    if [ ! -f "${SKILLS_DIR}/${FNAME}" ]; then
      cp "${SKILL}" "${SKILLS_DIR}/${FNAME}"
      echo "  Added: .claude/skills/${FNAME}"
    fi
  done
fi

# Rebuild graph
if [ -f "${SRC}/dist/cli/dve-tool.js" ]; then
  echo "  Rebuilding graph.json..."
  (cd "${TARGET_DIR}" && node "${SRC}/dist/cli/dve-tool.js" build 2>/dev/null || true)
fi

echo ""
echo "Updated to v${SRC_VERSION}."
