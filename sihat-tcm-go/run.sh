#!/usr/bin/env bash
# Production launcher for PM2 on the Hetzner VPS.
# PM2: pm2 start /home/deploy/sihat-tcm-go/run.sh --name sihat-tcm-go
set -euo pipefail
cd "$(dirname "$0")"
set -a
[ -f .env.production ] && source .env.production
set +a
export PORT="${PORT:-3200}"
export APP_ENV=production
exec ./sihat-tcm-go
