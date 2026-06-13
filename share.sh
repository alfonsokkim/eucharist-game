#!/usr/bin/env bash
# Start the game and expose it on a free public link (no account needed).
# Usage:  npm run share        (or:  bash share.sh)
# The link lives only while this command is running — Ctrl+C to stop.
set -euo pipefail
PORT="${PORT:-3000}"

node server/server.js &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
sleep 1

echo ""
echo "  Opening a public link… (share the address it prints below)"
echo "  Host screen = that address + /host   ·   Players = that address"
echo ""

if command -v cloudflared >/dev/null 2>&1; then
  cloudflared tunnel --url "http://localhost:${PORT}"
else
  # localhost.run — free, no account, no install (uses ssh)
  ssh -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 \
      -o ExitOnForwardFailure=yes -R 80:localhost:"${PORT}" nokey@localhost.run
fi
