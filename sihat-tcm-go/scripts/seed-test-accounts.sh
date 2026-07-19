#!/usr/bin/env bash
# Seed the 4 demo/test accounts (patient/doctor/admin/developer @sihat.com) into
# Supabase via the GoTrue admin API, and upsert their profiles row (role).
#
# Idempotent: re-running updates the password + confirms email + re-upserts the
# profile. Safe to run against the shared sihat-tcm project (used by both the
# local :8081 server and production tcm.wenjyue.com).
#
# Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment
# (sourced from .env if present). Password for all: password123.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
[ -f .env ] && source .env
set +a

: "${SUPABASE_URL:?SUPABASE_URL required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY required}"
PW="${TEST_ACCOUNT_PASSWORD:-password123}"

AUTH_ADMIN="$SUPABASE_URL/auth/v1/admin/users"
REST_PROFILES="$SUPABASE_URL/rest/v1/profiles"
HDR_KEY="apikey: $SUPABASE_SERVICE_ROLE_KEY"
HDR_AUTH="Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# roles → "email|role|Full Name"
ACCOUNTS=(
  "patient@sihat.com|patient|Test Patient"
  "doctor@sihat.com|doctor|Test Doctor"
  "admin@sihat.com|admin|Test Admin"
  "developer@sihat.com|developer|Test Developer"
)

# find_user_id <email> — returns the GoTrue user id for an email, or "".
find_user_id () {
  local email="$1"
  # GoTrue admin list supports a `filter`/email query on recent versions; fall
  # back to scanning the first page if the filtered query returns nothing.
  curl -s "$AUTH_ADMIN?page=1&per_page=1000" -H "$HDR_KEY" -H "$HDR_AUTH" \
    | python -c "import json,sys
email='$email'.lower()
try:
    d=json.load(sys.stdin)
except Exception:
    print(''); sys.exit()
users=d.get('users', d if isinstance(d,list) else [])
for u in users:
    if (u.get('email') or '').lower()==email:
        print(u.get('id','')); break
else:
    print('')"
}

for row in "${ACCOUNTS[@]}"; do
  IFS='|' read -r email role name <<< "$row"
  echo "==> $email ($role)"

  # 1) Create the user (email_confirm so it can log in immediately).
  body=$(printf '{"email":"%s","password":"%s","email_confirm":true,"user_metadata":{"full_name":"%s","role":"%s"}}' "$email" "$PW" "$name" "$role")
  resp=$(curl -s -w '\n%{http_code}' -X POST "$AUTH_ADMIN" -H "$HDR_KEY" -H "$HDR_AUTH" -H 'Content-Type: application/json' -d "$body")
  code=$(echo "$resp" | tail -1)
  json=$(echo "$resp" | sed '$d')

  uid=""
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    uid=$(echo "$json" | python -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
    echo "    created (id=$uid)"
  else
    echo "    exists/other (HTTP $code) — looking up id + updating password"
    uid=$(find_user_id "$email")
    if [ -n "$uid" ]; then
      # Ensure known password + confirmed email.
      curl -s -o /dev/null -X PUT "$AUTH_ADMIN/$uid" -H "$HDR_KEY" -H "$HDR_AUTH" -H 'Content-Type: application/json' \
        -d "$(printf '{"password":"%s","email_confirm":true}' "$PW")"
      echo "    updated (id=$uid)"
    fi
  fi

  if [ -z "$uid" ]; then
    echo "    !! could not resolve user id for $email — skipping profile"
    continue
  fi

  # 2) Upsert the profile row (role) via PostgREST merge-duplicates.
  prow=$(printf '{"id":"%s","role":"%s","full_name":"%s"}' "$uid" "$role" "$name")
  pcode=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$REST_PROFILES" \
    -H "$HDR_KEY" -H "$HDR_AUTH" -H 'Content-Type: application/json' \
    -H 'Prefer: resolution=merge-duplicates' -d "$prow")
  echo "    profile upsert HTTP $pcode"
done

echo "==> done."
