#!/usr/bin/env bash
# Seed the 4 demo/test accounts (patient/doctor/admin/developer @sihat.com, password123) — idempotent.
# Wrapper: the logic lives in scripts/seed-all.mjs (GoTrue admin API + PostgREST, SUPABASE_* from .env).
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/seed-all.mjs --only=accounts
