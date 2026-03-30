#!/usr/bin/env bash
set -euo pipefail

# DGE toolkit updater
# Updates toolkit-managed files in dge/. Never touches sessions/ or custom/.

REAL_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
SCRIPT_DIR="$(cd "$(dirname "${REAL_PATH}")" && pwd)"
TARGET_DIR="${1:-.}"

# Resolve source
if [ -f "${SCRIPT_DIR}/method.md" ]; then
  SRC="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/../method.md" ]; then
  SRC="${SCRIPT_DIR}/.."
else
  echo "Error: Cannot find DGE toolkit files."
  exit 1
fi

DGE_DIR="${TARGET_DIR}/dge"
SKILLS_DIR="${TARGET_DIR}/.claude/skills"

if [ ! -d "${DGE_DIR}" ]; then
  echo "Error: dge/ not found. Run 'npx dge-install' first."
  exit 1
fi

# Get versions
SRC_VERSION="$(cat "${SRC}/version.txt" 2>/dev/null || echo "unknown")"
LOCAL_VERSION="$(cat "${DGE_DIR}/version.txt" 2>/dev/null || echo "unknown")"

echo "DGE toolkit — update"
echo ""
echo "  Local:  ${LOCAL_VERSION}"
echo "  Source: ${SRC_VERSION}"
echo ""

if [ "${SRC_VERSION}" = "${LOCAL_VERSION}" ]; then
  echo "Already up to date."
  exit 0
fi

# Show what will be updated
echo "The following toolkit files will be updated:"
echo ""

UPDATED=0

for f in README.md LICENSE method.md version.txt; do
  if [ -f "${SRC}/${f}" ]; then
    if [ -f "${DGE_DIR}/${f}" ]; then
      if ! diff -q "${SRC}/${f}" "${DGE_DIR}/${f}" > /dev/null 2>&1; then
        echo "  [changed] dge/${f}"
        UPDATED=$((UPDATED + 1))
      fi
    else
      echo "  [new]     dge/${f}"
      UPDATED=$((UPDATED + 1))
    fi
  fi
done

for f in "${SRC}/characters/"*.md; do
  fname="$(basename "${f}")"
  if [ -f "${DGE_DIR}/characters/${fname}" ]; then
    if ! diff -q "${f}" "${DGE_DIR}/characters/${fname}" > /dev/null 2>&1; then
      echo "  [changed] dge/characters/${fname}"
      UPDATED=$((UPDATED + 1))
    fi
  else
    echo "  [new]     dge/characters/${fname}"
    UPDATED=$((UPDATED + 1))
  fi
done

for f in "${SRC}/templates/"*.md; do
  fname="$(basename "${f}")"
  if [ -f "${DGE_DIR}/templates/${fname}" ]; then
    if ! diff -q "${f}" "${DGE_DIR}/templates/${fname}" > /dev/null 2>&1; then
      echo "  [changed] dge/templates/${fname}"
      UPDATED=$((UPDATED + 1))
    fi
  else
    echo "  [new]     dge/templates/${fname}"
    UPDATED=$((UPDATED + 1))
  fi
done

# Check skill
if [ -f "${SRC}/skills/dge-session.md" ] && [ -f "${SKILLS_DIR}/dge-session.md" ]; then
  if ! diff -q "${SRC}/skills/dge-session.md" "${SKILLS_DIR}/dge-session.md" > /dev/null 2>&1; then
    echo "  [changed] .claude/skills/dge-session.md"
    UPDATED=$((UPDATED + 1))
  fi
fi

if [ -f "${SRC}/skills/dge-update.md" ]; then
  if [ ! -f "${SKILLS_DIR}/dge-update.md" ]; then
    echo "  [new]     .claude/skills/dge-update.md"
    UPDATED=$((UPDATED + 1))
  elif ! diff -q "${SRC}/skills/dge-update.md" "${SKILLS_DIR}/dge-update.md" > /dev/null 2>&1; then
    echo "  [changed] .claude/skills/dge-update.md"
    UPDATED=$((UPDATED + 1))
  fi
fi

echo ""
echo "  Will NOT touch: dge/sessions/, dge/custom/, dge/projects/, dge/specs/"
echo ""

if [ "${UPDATED}" -eq 0 ]; then
  echo "No file changes detected (version mismatch only). Updating version.txt."
  echo "${SRC_VERSION}" > "${DGE_DIR}/version.txt"
  exit 0
fi

read -p "Update ${UPDATED} file(s)? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# Perform update — toolkit managed files only
mkdir -p "${DGE_DIR}/characters" "${DGE_DIR}/templates"

for f in README.md LICENSE method.md; do
  [ -f "${SRC}/${f}" ] && cp "${SRC}/${f}" "${DGE_DIR}/${f}"
done

cp "${SRC}/characters/"*.md "${DGE_DIR}/characters/"
cp "${SRC}/templates/"*.md "${DGE_DIR}/templates/"
echo "${SRC_VERSION}" > "${DGE_DIR}/version.txt"

# Update new files (flows, docs, bin)
for f in INTERNALS.md CUSTOMIZING.md dialogue-techniques.md patterns.md integration-guide.md; do
  [ -f "${SRC}/${f}" ] && cp "${SRC}/${f}" "${DGE_DIR}/${f}"
done
if [ -d "${SRC}/flows" ]; then
  mkdir -p "${DGE_DIR}/flows"
  cp "${SRC}/flows/"*.yaml "${DGE_DIR}/flows/" 2>/dev/null || true
fi
if [ -d "${SRC}/bin" ]; then
  mkdir -p "${DGE_DIR}/bin"
  cp "${SRC}/bin/"* "${DGE_DIR}/bin/" 2>/dev/null || true
  chmod +x "${DGE_DIR}/bin/"* 2>/dev/null || true
fi

# Update skills
mkdir -p "${SKILLS_DIR}"
for f in "${SRC}/skills/"*.md; do
  fname="$(basename "${f}")"
  cp "${f}" "${SKILLS_DIR}/${fname}"
done

echo ""
echo "Updated to v${SRC_VERSION}."
echo "  dge/sessions/, dge/custom/, dge/projects/, dge/specs/ were not touched."
