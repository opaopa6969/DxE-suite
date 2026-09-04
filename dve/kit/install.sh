#!/usr/bin/env bash
set -euo pipefail

# DVE toolkit installer
# Sets up dve/ directories, builds kit, installs app dependencies

REAL_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
SCRIPT_DIR="$(cd "$(dirname "${REAL_PATH}")" && pwd)"
TARGET_DIR="${1:-.}"

# Resolve source
SRC="${SCRIPT_DIR}"
if [ ! -f "${SRC}/version.txt" ]; then
  echo "Error: Cannot find DVE toolkit files."
  exit 1
fi

SRC_VERSION="$(cat "${SRC}/version.txt" 2>/dev/null || echo "unknown")"

echo "DVE toolkit — install v${SRC_VERSION}"
echo ""

# Create directories
mkdir -p "${TARGET_DIR}/dve/annotations"
mkdir -p "${TARGET_DIR}/dve/contexts"
mkdir -p "${TARGET_DIR}/dve/dist"

# Initialize .dre/ state machine if not exists
if [ ! -f "${TARGET_DIR}/.dre/state-machine.yaml" ]; then
  if [ -f "${SCRIPT_DIR}/../../../dre/kit/engine/engine.js" ]; then
    echo "  Initializing DRE workflow engine..."
    node "${SCRIPT_DIR}/../../../dre/kit/engine/engine.js" init 2>/dev/null || true
  fi
fi

# A directory alone is not evidence of a complete build.
CLI_ENTRY="${SRC}/dist/cli/dve-tool.js"
if [ ! -f "${CLI_ENTRY}" ]; then
  echo "  Compiling DVE kit..."
  (cd "${SRC}" && npm run build)
fi
if [ ! -f "${CLI_ENTRY}" ]; then
  echo "Error: DVE CLI build did not produce ${CLI_ENTRY}." >&2
  exit 1
fi

# Install app dependencies if needed
APP_DIR="${SCRIPT_DIR}/../app"
if [ -d "${APP_DIR}" ] && [ ! -d "${APP_DIR}/node_modules" ]; then
  echo "  Installing DVE app dependencies..."
  (cd "${APP_DIR}" && npm install 2>/dev/null || true)
fi

# Install skills
SKILLS_DIR="${TARGET_DIR}/.claude/skills"
mkdir -p "${SKILLS_DIR}"

if [ -d "${SRC}/skills" ]; then
  for SKILL in "${SRC}/skills/"*.md; do
    [ -f "${SKILL}" ] || continue
    FNAME="$(basename "${SKILL}")"
    if [ ! -f "${SKILLS_DIR}/${FNAME}" ]; then
      cp "${SKILL}" "${SKILLS_DIR}/${FNAME}"
      echo "  [new] .claude/skills/${FNAME}"
    fi
  done
fi

# Build graph.json
echo ""
echo "  Building graph.json..."
(cd "${TARGET_DIR}" && node "${CLI_ENTRY}" build)

echo ""
echo "DVE toolkit v${SRC_VERSION} installed."
echo ""
echo "  Usage:"
echo "    node dve/kit/dist/cli/dve-tool.js build     Build graph"
echo "    node dve/kit/dist/cli/dve-tool.js serve      Start Web UI"
echo "    node dve/kit/dist/cli/dve-tool.js status     Show project state"
echo ""
