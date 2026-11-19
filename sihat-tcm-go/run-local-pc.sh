#!/usr/bin/env bash
# Local dev launcher wired to sihat-listener (Claude opus/sonnet/haiku on this PC) instead of Gemini.
# DB: whatever .env says (the new project wgxufplbcncsjwdhtuxd; its gateway is 402-restricted as of 2026-10-10) — or pass FAKE_DB=1 for the hermetic fake.
set -euo pipefail
cd "$(dirname "$0")"
powershell -NoProfile -File sihat-listener/start.ps1 >/dev/null
set -a
[ -f .env ] && source .env
set +a
if [ "${FAKE_DB:-0}" = "1" ]; then
  (node regress/fake-supabase.mjs >/dev/null 2>&1 &)
  export SUPABASE_URL=http://127.0.0.1:54329 SUPABASE_ANON_KEY=fake SUPABASE_SERVICE_ROLE_KEY=fake
  sleep 1
fi
export AI_BASE_URL="${AI_BASE_URL:-http://127.0.0.1:8788/v1beta/models}"
export GEMINI_API_KEY=""
export PORT="${PORT:-8081}"
export APP_ENV="${APP_ENV:-development}"
go build -o sihat-tcm-local.exe .
exec ./sihat-tcm-local.exe
