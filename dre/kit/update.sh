#!/usr/bin/env bash
set -euo pipefail

# DRE toolkit updater
# Updates toolkit-managed files in .claude/. Skips files modified by user.

REAL_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
SCRIPT_DIR="$(cd "$(dirname "${REAL_PATH}")" && pwd)"
TARGET_DIR="${1:-.}"

# Resolve source
if [ -f "${SCRIPT_DIR}/version.txt" ]; then
  SRC="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/../version.txt" ]; then
  SRC="${SCRIPT_DIR}/.."
else
  echo "Error: Cannot find DRE toolkit files."
  exit 1
fi

CLAUDE_DIR="${TARGET_DIR}/.claude"

if [ ! -d "${CLAUDE_DIR}" ]; then
  echo "Error: .claude/ not found. Run 'npx dre-install' first."
  exit 1
fi

# Get versions
SRC_VERSION="$(cat "${SRC}/version.txt" 2>/dev/null || echo "unknown")"
LOCAL_VERSION="$(cat "${CLAUDE_DIR}/.dre-version" 2>/dev/null || echo "unknown")"

echo "DRE toolkit — update"
echo ""
echo "  Local:  ${LOCAL_VERSION}"
echo "  Source: ${SRC_VERSION}"
echo ""

if [ "${SRC_VERSION}" = "${LOCAL_VERSION}" ]; then
  echo "Already up to date."
  exit 0
fi

# Check what will be updated
UPDATED=0
SKIPPED=0

check_dir() {
  local src_dir="$1"
  local dst_dir="$2"
  local label="$3"

  if [ ! -d "${src_dir}" ]; then
    return
  fi

  for f in "${src_dir}/"*; do
    [ -f "${f}" ] || continue
    fname="$(basename "${f}")"
    [ "${fname}" = ".gitkeep" ] && continue

    if [ -f "${dst_dir}/${fname}" ]; then
      if ! diff -q "${f}" "${dst_dir}/${fname}" > /dev/null 2>&1; then
        # File differs — check if user modified (compare with kit hash stored at install time)
        # Simple heuristic: if it differs from source, assume user customized → skip
        echo "  [skip]    .claude/${label}/${fname}  ← カスタマイズ済みのためスキップ"
        SKIPPED=$((SKIPPED + 1))
      fi
    else
      echo "  [new]     .claude/${label}/${fname}"
      UPDATED=$((UPDATED + 1))
    fi
  done
}

echo "変更内容:"
echo ""
check_dir "${SRC}/rules"    "${CLAUDE_DIR}/rules"    "rules"
check_dir "${SRC}/skills"   "${CLAUDE_DIR}/skills"   "skills"
check_dir "${SRC}/agents"   "${CLAUDE_DIR}/agents"   "agents"
check_dir "${SRC}/commands" "${CLAUDE_DIR}/commands" "commands"
check_dir "${SRC}/profiles" "${CLAUDE_DIR}/profiles" "profiles"

# Version bump always counts
echo "  [changed] .claude/.dre-version  ${LOCAL_VERSION} → ${SRC_VERSION}"
UPDATED=$((UPDATED + 1))

echo ""

if [ "${SKIPPED}" -gt 0 ]; then
  echo "  ${SKIPPED} ファイルはカスタマイズ済みのためスキップします。"
  echo "  強制上書きには --force オプションを使用してください。"
  echo ""
fi

read -p "更新しますか？ [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "キャンセルしました。"
  exit 0
fi

# Perform update — new files only (skip customized)
do_update_dir() {
  local src_dir="$1"
  local dst_dir="$2"

  if [ ! -d "${src_dir}" ]; then
    return
  fi

  mkdir -p "${dst_dir}"

  for f in "${src_dir}/"*; do
    [ -f "${f}" ] || continue
    fname="$(basename "${f}")"
    [ "${fname}" = ".gitkeep" ] && continue

    if [ ! -f "${dst_dir}/${fname}" ]; then
      # New file — copy
      cp "${f}" "${dst_dir}/${fname}"
      echo "  追加: .claude/$(basename "${dst_dir}")/${fname}"
    elif diff -q "${f}" "${dst_dir}/${fname}" > /dev/null 2>&1; then
      : # identical — nothing to do
    else
      : # customized — skip (already reported above)
    fi
  done
}

do_update_dir "${SRC}/rules"    "${CLAUDE_DIR}/rules"
do_update_dir "${SRC}/skills"   "${CLAUDE_DIR}/skills"
do_update_dir "${SRC}/agents"   "${CLAUDE_DIR}/agents"
do_update_dir "${SRC}/commands" "${CLAUDE_DIR}/commands"
do_update_dir "${SRC}/profiles" "${CLAUDE_DIR}/profiles"

# Also update disabled/ skills so they're up-to-date when re-activated
if [ -d "${CLAUDE_DIR}/skills/disabled" ]; then
  for f in "${SRC}/skills/"*; do
    [ -f "${f}" ] || continue
    fname="$(basename "${f}")"
    [ "${fname}" = ".gitkeep" ] && continue
    if [ -f "${CLAUDE_DIR}/skills/disabled/${fname}" ]; then
      if ! diff -q "${f}" "${CLAUDE_DIR}/skills/disabled/${fname}" > /dev/null 2>&1; then
        cp "${f}" "${CLAUDE_DIR}/skills/disabled/${fname}"
        echo "  更新 (disabled): .claude/skills/disabled/${fname}"
      fi
    fi
  done
fi

# Deploy hooks + settings
HOOKS_SRC="${SRC}/hooks"
if [ -d "${HOOKS_SRC}" ]; then
  DRE_DIR="${TARGET_DIR}/.dre"
  mkdir -p "${DRE_DIR}/hooks"
  for f in "${HOOKS_SRC}/"*.sh; do
    [ -f "${f}" ] || continue
    cp "${f}" "${DRE_DIR}/hooks/"
    chmod +x "${DRE_DIR}/hooks/$(basename "${f}")"
  done
  # Deploy settings.json (only if not customized)
  if [ -f "${HOOKS_SRC}/settings.json" ]; then
    if [ ! -f "${CLAUDE_DIR}/settings.json" ] || diff -q "${HOOKS_SRC}/settings.json" "${CLAUDE_DIR}/settings.json" > /dev/null 2>&1; then
      cp "${HOOKS_SRC}/settings.json" "${CLAUDE_DIR}/settings.json"
      echo "  更新: .claude/settings.json"
    else
      echo "  [skip] .claude/settings.json ← カスタマイズ済み"
    fi
  fi
  # Deploy dre-config.json
  if [ -f "${HOOKS_SRC}/dre-config.json" ] && [ ! -f "${DRE_DIR}/dre-config.json" ]; then
    cp "${HOOKS_SRC}/dre-config.json" "${DRE_DIR}/dre-config.json"
    echo "  追加: .dre/dre-config.json"
  fi
  echo "  hooks デプロイ完了"
fi

echo "${SRC_VERSION}" > "${CLAUDE_DIR}/.dre-version"

# Tag DxE version in project repo
if command -v git &>/dev/null && [ -d "${TARGET_DIR}/.git" ]; then
  git -C "${TARGET_DIR}" tag "dxe-v${SRC_VERSION}" 2>/dev/null && \
    echo "  タグ: dxe-v${SRC_VERSION}" || true
fi

echo ""
echo "v${SRC_VERSION} に更新しました。"
echo "カスタマイズ済みファイルは変更されていません。"
