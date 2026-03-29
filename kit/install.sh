#!/usr/bin/env bash
set -euo pipefail

# DGE toolkit installer
# Copies dge/ and .claude/skills/ to the current project directory.

# Resolve symlinks (npx creates symlink in node_modules/.bin/)
REAL_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
SCRIPT_DIR="$(cd "$(dirname "${REAL_PATH}")" && pwd)"
TARGET_DIR="${1:-.}"

echo "DGE toolkit — installing to ${TARGET_DIR}"
echo ""

# Resolve source: npm (node_modules) or local
if [ -f "${SCRIPT_DIR}/method.md" ]; then
  SRC="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/../method.md" ]; then
  SRC="${SCRIPT_DIR}/.."
else
  echo "Error: Cannot find DGE toolkit files. Run from the kit/ directory or via npx."
  exit 1
fi

# Copy dge/ folder
DGE_DIR="${TARGET_DIR}/dge"
if [ -d "${DGE_DIR}" ]; then
  echo "  dge/ already exists — skipping (won't overwrite your files)"
else
  mkdir -p "${DGE_DIR}/characters" "${DGE_DIR}/templates" "${DGE_DIR}/sessions" "${DGE_DIR}/custom" "${DGE_DIR}/projects" "${DGE_DIR}/specs"
  cp "${SRC}/README.md" "${DGE_DIR}/"
  cp "${SRC}/LICENSE" "${DGE_DIR}/"
  cp "${SRC}/method.md" "${DGE_DIR}/"
  cp "${SRC}/characters/catalog.md" "${DGE_DIR}/characters/"
  cp "${SRC}/templates/"*.md "${DGE_DIR}/templates/"
  [ -f "${SRC}/integration-guide.md" ] && cp "${SRC}/integration-guide.md" "${DGE_DIR}/"
  [ -f "${SRC}/patterns.md" ] && cp "${SRC}/patterns.md" "${DGE_DIR}/"
  # Version tracking for updates
  SRC_VERSION="$(cat "${SRC}/version.txt" 2>/dev/null || echo "1.0.0")"
  echo "${SRC_VERSION}" > "${DGE_DIR}/version.txt"
  echo "  dge/ created (v${SRC_VERSION})"
fi

# Copy skill to .claude/skills/
SKILLS_DIR="${TARGET_DIR}/.claude/skills"
mkdir -p "${SKILLS_DIR}"
for SKILL in dge-session.md dge-update.md; do
  if [ -f "${SRC}/skills/${SKILL}" ]; then
    if [ -f "${SKILLS_DIR}/${SKILL}" ]; then
      echo "  .claude/skills/${SKILL} already exists — skipping"
    else
      cp "${SRC}/skills/${SKILL}" "${SKILLS_DIR}/${SKILL}"
      echo "  .claude/skills/${SKILL} created"
    fi
  fi
done

echo ""
echo "Done! DGE toolkit is ready."
echo ""
echo '  Claude Code で「DGE して」と言えば起動します。'
echo ""
echo "MIT License. See dge/LICENSE for details."
