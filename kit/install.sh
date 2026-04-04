#!/usr/bin/env bash
set -euo pipefail

# DRE toolkit installer
# Copies rules/ skills/ agents/ commands/ profiles/ to .claude/ in the current project.

TARGET_DIR="."
for arg in "$@"; do
  case "${arg}" in
    -*) ;; # ignore flags
    *)  TARGET_DIR="${arg}" ;;
  esac
done

# Resolve symlinks (npx creates symlink in node_modules/.bin/)
REAL_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
SCRIPT_DIR="$(cd "$(dirname "${REAL_PATH}")" && pwd)"

echo "DRE toolkit — installing to ${TARGET_DIR}"
echo ""

# Resolve source: npm (node_modules) or local
if [ -f "${SCRIPT_DIR}/version.txt" ]; then
  SRC="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/../version.txt" ]; then
  SRC="${SCRIPT_DIR}/.."
else
  echo "Error: Cannot find DRE toolkit files. Run from the kit/ directory or via npx."
  exit 1
fi

SRC_VERSION="$(cat "${SRC}/version.txt" 2>/dev/null || echo "0.1.0")"
CLAUDE_DIR="${TARGET_DIR}/.claude"

# Create .claude/ directory structure
mkdir -p \
  "${CLAUDE_DIR}/rules" \
  "${CLAUDE_DIR}/skills" \
  "${CLAUDE_DIR}/agents" \
  "${CLAUDE_DIR}/commands" \
  "${CLAUDE_DIR}/profiles"

# Copy function: skip existing files, copy new ones
copy_dir() {
  local src_dir="$1"
  local dst_dir="$2"
  local label="$3"

  if [ ! -d "${src_dir}" ]; then
    return
  fi

  local count=0
  local skipped=0

  for f in "${src_dir}/"*; do
    [ -f "${f}" ] || continue
    fname="$(basename "${f}")"
    # Skip .gitkeep
    [ "${fname}" = ".gitkeep" ] && continue

    if [ -f "${dst_dir}/${fname}" ]; then
      skipped=$((skipped + 1))
    else
      cp "${f}" "${dst_dir}/${fname}"
      count=$((count + 1))
    fi
  done

  if [ "${count}" -gt 0 ]; then
    echo "  .claude/${label}/ — ${count} ファイルをコピー"
  fi
  if [ "${skipped}" -gt 0 ]; then
    echo "  .claude/${label}/ — ${skipped} ファイルはスキップ（既存）"
  fi
  if [ "${count}" -eq 0 ] && [ "${skipped}" -eq 0 ]; then
    echo "  .claude/${label}/ — (空)"
  fi
}

copy_dir "${SRC}/rules"    "${CLAUDE_DIR}/rules"    "rules"
copy_dir "${SRC}/skills"   "${CLAUDE_DIR}/skills"   "skills"
copy_dir "${SRC}/agents"   "${CLAUDE_DIR}/agents"   "agents"
copy_dir "${SRC}/commands" "${CLAUDE_DIR}/commands" "commands"
copy_dir "${SRC}/profiles" "${CLAUDE_DIR}/profiles" "profiles"

# Version tracking + manifest
echo "${SRC_VERSION}" > "${CLAUDE_DIR}/.dre-version"

# Generate manifest: record installed files and their hashes
MANIFEST="${CLAUDE_DIR}/.dre-manifest"
echo "# DRE manifest — DO NOT EDIT manually" > "${MANIFEST}"
echo "version=${SRC_VERSION}" >> "${MANIFEST}"
echo "installed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date)" >> "${MANIFEST}"

for dir in rules skills agents commands profiles; do
  src_sub="${SRC}/${dir}"
  [ -d "${src_sub}" ] || continue
  for f in "${src_sub}/"*; do
    [ -f "${f}" ] || continue
    fname="$(basename "${f}")"
    [ "${fname}" = ".gitkeep" ] && continue
    hash=$(sha256sum "${f}" 2>/dev/null | awk '{print $1}' || shasum -a 256 "${f}" 2>/dev/null | awk '{print $1}' || echo "nohash")
    echo "${dir}/${fname}=${hash}" >> "${MANIFEST}"
  done
done

echo ""
echo "Done! DRE toolkit v${SRC_VERSION} installed."
echo ""
echo "  展開先: ${TARGET_DIR}/.claude/"
echo "  アップデート: npx dre-update"
echo ""
echo "MIT License. See LICENSE for details."
