#!/usr/bin/env bash
# Local dev launcher (port 8081) for ACI + browser regression testing.
# NOT for production — sources .env (gitignored) instead of .env.production.
set -euo pipefail
cd "$(dirname "$0")"
set -a
[ -f .env ] && source .env
set +a
export PORT="${PORT:-8081}"
export APP_ENV="${APP_ENV:-development}"
exec ./sihat-tcm-local.exe
