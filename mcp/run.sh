#!/bin/sh
# DxE Suite MCP server launcher
set -eu
cd "$(dirname "$0")"
exec npx tsx server.ts
