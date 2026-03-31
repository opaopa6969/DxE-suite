#!/usr/bin/env bash
set -euo pipefail

# Generate demo GIFs from .cast files
# Requires: agg (cargo install agg)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

AGG_OPTS="--theme dracula --font-size 16 --cols 110 --rows 42 --last-frame-duration 5"

echo "Generating demo GIFs..."

for cast in "${SCRIPT_DIR}"/*.cast; do
  [ -f "${cast}" ] || continue
  name="$(basename "${cast}" .cast)"
  gif="${SCRIPT_DIR}/${name}.gif"
  echo "  ${name}.cast → ${name}.gif"
  agg ${AGG_OPTS} "${cast}" "${gif}"
done

echo ""
echo "Done. GIF files:"
ls -lh "${SCRIPT_DIR}"/*.gif 2>/dev/null

echo ""
echo "Upload to asciinema.org:"
echo "  asciinema upload docs/demo/demo.cast"
echo "  asciinema upload docs/demo/demo-en.cast"
