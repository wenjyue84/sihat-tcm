#!/usr/bin/env bash
# Seed the 6 realistic demo TCM doctors (approved, full profiles; password123) — idempotent.
# Wrapper: the logic lives in scripts/seed-all.mjs. Use `node scripts/seed-all.mjs` to also seed system_prompts.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/seed-all.mjs --only=doctors
