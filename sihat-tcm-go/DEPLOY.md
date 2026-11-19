# Sihat TCM Go — Deploy (Hetzner / PM2 / nginx / Cloudflare)

## Production details

| Item | Value |
|------|-------|
| URL | https://tcm.wenjyue.com (Cloudflare → Hetzner VPS 5.223.54.57) |
| SSH | `ssh deploy@5.223.54.57` |
| Dir | `/home/deploy/sihat-tcm-go/` (binary + run.sh + .env.production) |
| Port | 3200 (nginx proxy_pass) |
| PM2 app | `sihat-tcm-go` (PM2 at `~/.nvm/versions/node/v24.15.0/bin/pm2`) |
| nginx | `/etc/nginx/sites-enabled/tcm.wenjyue.com` (certbot TLS, same pattern as senai.wenjyue.com) |
| DNS | Cloudflare zone wenjyue.com, A `tcm` → 5.223.54.57 |

> **PRODUCTION HOST (corrected 2026-10-10):** tcm.wenjyue.com is served from the **Contabo VPS `root@194.163.189.1`** (ssh key `~/.ssh/contabo_ed25519`),
> systemd unit `sihat-tcm-go` (`systemctl restart sihat-tcm-go`), dir `/opt/sihat-tcm-go` (binary, `.env.production`, `data/sihat.db`), nginx → :3200.
> The Hetzner paths/pm2 commands further down are the old (pre-Oct-2026) layout. Production runs **DB_BACKEND=sqlite** (since 2026-10-10, `SEED_DEMO=0`: no demo accounts).
> First admin: sign up normally, then `ssh … 'cd /opt/sihat-tcm-go && sudo -u deploy ./sihat-tcm-go --promote you@example.com --role admin'` (loads .env.production).

> **DEMO environment (2026-10-10):** https://tcm-demo.wenjyue.com — a second, isolated instance on the same Contabo box (systemd `sihat-tcm-demo`, `/opt/sihat-tcm-demo`,
> port 3201, own SQLite, `SEED_DEMO=1` → rich demo data, `noindex`): **8 named doctors** (`dr.lew|tan|lim|nurul|wong|raj|chong|aisyah@sihat.com`, plus the generic `doctor@sihat.com`)
> and **16 patients** (`patient@sihat.com`, `demo-patient-02..16@sihat.com`), all `password123`, plus `admin@` / `developer@sihat.com`. Each patient has 1-3 full zh/en/ms TCM reports over the last ~90 days,
> every doctor has 5 routed consultation requests (pending/reviewed, normal/watch/critical, replies, follow-ups, treatment plans), and notifications plus 7 days of logs, metrics and errors fill the admin/developer
> consoles (`sihat-tcm-go --seed-demo-stats` prints the row counts). It is wiped and reseeded daily at 04:20, so it resets nightly
> (`/usr/local/bin/sihat-demo-reset.sh`, `/etc/cron.d/sihat-demo-reset`). Real patient data never goes there; real users use tcm.wenjyue.com (`SEED_DEMO=0`: no demo accounts, nothing seeded).
> Update it by copying the same binary: `cp /opt/sihat-tcm-go/sihat-tcm-go /opt/sihat-tcm-demo/ && systemctl restart sihat-tcm-demo`. TLS: certbot webroot (`/var/www/acme`).

## Regression gate (mandatory before every deploy)

```bash
node aci.mjs gates --profile=predeploy   # unit -> integration -> e2e API -> e2e browser -> real-model journey; ~25 min; writes the stamp
scripts/deploy.sh                        # verifies the stamp matches THIS tree, builds, asks, uploads, restarts, runs the ACI against prod
scripts/deploy.sh --run-gates --yes      # same, running the gates first and skipping the prompt
```
`build.sh` and `scripts/deploy.sh` refuse to proceed unless `node regress/graph.mjs verify-stamp` is green for the current
working tree (code/config/templates/static; markdown is ignored). `SKIP_REGRESS=1 ./build.sh` bypasses, loudly.
Full description: `regress/README.md`. The manual steps below are what `scripts/deploy.sh` automates.

**Production AI/DB status (2026-10-10):** the old Supabase project `jvokcruuowmvpthubjqh` is DEAD; production still points at it until
the new project (below) is switched in — see "New Supabase project" — or until the app runs on the SQLite fallback (`DB_BACKEND=sqlite`, section below), which needs no Supabase at all. The regression stack uses a fake Supabase by default (no RLS/JWT/constraints).
Optional: `AI_BASE_URL` points the app at a Gemini-compatible endpoint (see `sihat-listener/README.md`, this PC's Claude models).
New hardening to know when deploying: client IP for rate limits comes from `CF-Connecting-IP` / last `X-Forwarded-For` entry
only when the TCP peer is loopback/private (nginx on the same box) — keep nginx on 127.0.0.1 and do not expose :3200 publicly.

## Deploy steps (from `sihat-tcm-go/` via Git Bash)

```bash
./build.sh   # go vet + static linux/amd64 binary (embeds templates/ + static/)

scp sihat-tcm-go deploy@5.223.54.57:/home/deploy/sihat-tcm-go/sihat-tcm-go.new

ssh deploy@5.223.54.57 'cd /home/deploy/sihat-tcm-go && \
  [ -f sihat-tcm-go ] && cp sihat-tcm-go sihat-tcm-go.bak.$(date +%Y%m%d-%H%M%S); \
  mv sihat-tcm-go.new sihat-tcm-go && chmod +x sihat-tcm-go && \
  bash -lc "pm2 restart sihat-tcm-go"'

curl -s https://tcm.wenjyue.com/healthz   # expect {"status":"ok",...}
```

## Verify after deploy

```bash
node aci.mjs test --base=https://tcm.wenjyue.com    # backend regression (expect ok:true)
E2E_BASE=https://tcm.wenjyue.com python scripts/e2e_browser_test.py   # UI smoke (expect 9/9)
```

## Static assets & Cloudflare caching

Cloudflare edge-caches `/static/*` (JS/CSS) for ~4h, so a plain redeploy would
serve **stale JS with fresh HTML** (buttons present, handlers undefined).

This is handled automatically: `internal/server/server.go` stamps `assetVersion`
(process-start unix time) and the templates reference assets via `{{asset "…"}}`
→ `/static/js/app.js?v=<version>`. Each deploy = new process = new `?v=` → a URL
Cloudflare hasn't cached → fresh fetch. **No manual cache purge is needed.**

⚠️ The Cloudflare API tokens in the `cloudflare-admin` skill do NOT have
Cache-Purge permission on the `wenjyue.com` zone (error 10000), so don't rely on
API purge — the versioning is the mechanism. If you ever must purge manually, do
it from the Cloudflare dashboard.

## First-time setup (already done 2026-07-19)

1. `/home/deploy/sihat-tcm-go/` created; `run.sh` + `.env.production` (chmod 600) shipped
2. nginx conf from `deploy/tcm.wenjyue.com.nginx.conf`, then `certbot --nginx -d tcm.wenjyue.com`
3. Cloudflare A record `tcm` → 5.223.54.57 (via /cloudflare-admin skill)
4. `bash -lc "pm2 start /home/deploy/sihat-tcm-go/run.sh --name sihat-tcm-go && pm2 save"`

## Env (.env.production on server, never in git)

```
PORT=3200
PUBLIC_BASE_URL=https://tcm.wenjyue.com
# DB: either the three SUPABASE_* below, or DB_BACKEND=sqlite + SQLITE_PATH + LOCAL_JWT_SECRET (see "SQLite fallback")
SUPABASE_URL=…
SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
GEMINI_API_KEY=…
TELEGRAM_BOT_TOKEN=…   # optional
```

## Media (video)

The promo video (`/video` page, `/demo` card) is **not embedded in the binary** and not in git (`/media/` is ignored, 25 MB).
It lives in `<app dir>/media/sihat-tcm-demo.mp4` (app dir = the PM2 cwd, `/home/deploy/sihat-tcm-go`). Copy it once, and again whenever it is re-rendered
(no restart needed; a missing file just makes `/video` show "not available on this server" and drops it from `sitemap.xml`):

```bash
ssh deploy@5.223.54.57 'mkdir -p /home/deploy/sihat-tcm-go/media'
scp media/sihat-tcm-demo.mp4 deploy@5.223.54.57:/home/deploy/sihat-tcm-go/media/
curl -sI https://tcm.wenjyue.com/media/sihat-tcm-demo.mp4 | grep -iE '^(HTTP|content-length|accept-ranges)'   # 200, ~25 MB, bytes
```

`MEDIA_DIR` (env, default `./media`) changes the directory. `GET|HEAD /media/{name}` serves it with HTTP Range (seeking, iOS Safari);
only `[A-Za-z0-9._-]+\.(mp4|webm|jpg|png|webp|vtt|srt)` names are served, Cache-Control `public, max-age=86400`.
For efficiency nginx may serve it directly (add inside the `tcm.wenjyue.com` server block; nginx handles Range itself):

```nginx
location /media/ {
    alias /home/deploy/sihat-tcm-go/media/;   # trailing slashes on both
    expires 1d; add_header Cache-Control "public, max-age=86400";
}
```

## Rollback

```bash
ssh deploy@5.223.54.57 'cd /home/deploy/sihat-tcm-go && ls -t sihat-tcm-go.bak.* | head -3'
ssh deploy@5.223.54.57 'cd /home/deploy/sihat-tcm-go && cp <backup> sihat-tcm-go && bash -lc "pm2 restart sihat-tcm-go"'
```

## SQLite fallback (DB_BACKEND=sqlite) — runs the whole app without Supabase

**Why:** the new Supabase project's REST/Auth gateway answers HTTP 402 (`exceed_egress_quota`, free plan) so the app cannot use it. The app can
run fully on a local SQLite file instead and switch back to Supabase **by env only** — no handler code differs between the two.

How it works: `internal/localdb` implements the subset of Supabase the app uses (GoTrue password auth + PostgREST) over HTTP, backed by SQLite
(pure-Go `modernc.org/sqlite`, so the static `CGO_ENABLED=0` linux/amd64 build is unchanged). With `DB_BACKEND=sqlite` the binary starts that
backend on an **internal 127.0.0.1 random-port listener inside the same process** and points the Supabase client at it (any `SUPABASE_*` values
in the environment are ignored and kept for the future). It is not reachable from outside the box.

Real security properties (not a mock): PBKDF2-SHA256 password hashes (per-user salt, 120k iterations, `LOCAL_PBKDF2_ITER` to raise), HS256 JWT access
tokens with enforced expiry (1 h), the `apikey`/`Authorization` checks of the Supabase gateway, the owner-based Row-Level-Security policies and
GRANTs of `db/schema.sql`, and the schema's NOT NULL / CHECK / UNIQUE / FK constraints.

### Production env (`/home/deploy/sihat-tcm-go/.env.production`)

```
DB_BACKEND=sqlite
SQLITE_PATH=/home/deploy/sihat-tcm-go/data/sihat.db   # run.sh cd's into the app dir; deploys replace only the binary, data/ survives
LOCAL_JWT_SECRET=<random, e.g. openssl rand -hex 32>   # signs access tokens; empty = generated once and stored inside the db file
SEED_DEMO=0                                            # no password123 demo accounts in production (APP_ENV=production already defaults this to off)
# optional: LOCAL_ANON_KEY / LOCAL_SERVICE_KEY (default: generated + stored in the db), LOCAL_PBKDF2_ITER=300000
# keep the SUPABASE_* lines: they are ignored while DB_BACKEND=sqlite and are needed the day you switch back
```
First start creates `data/sihat.db` (mode 0600) and seeds the `system_prompts` and the single `admin_settings` row (always) and — only with
`SEED_DEMO=1` — the demo accounts `patient|doctor|admin|developer@sihat.com` / `password123` and the 6 demo doctors. Seeding happens once
(recorded in the db), never on a restart. **First real admin without demo accounts:** sign up normally in the app, then on the server
`SQLITE_PATH=/home/deploy/sihat-tcm-go/data/sihat.db ./sihat-tcm-go --promote you@example.com --role admin` (also `developer`/`doctor`; safe while the app runs; the user
signs in again to get the new role). Never leave the `password123` demo accounts on a public site.

### Backups
SQLite runs in WAL mode (`data/sihat.db`, `-wal`, `-shm`). Pick one:
```bash
/home/deploy/sihat-tcm-go/sihat-tcm-go --backup /home/deploy/backups/sihat-$(date +%F).db   # built in (VACUUM INTO); safe while the app serves; SQLITE_PATH from the env
sqlite3 /home/deploy/sihat-tcm-go/data/sihat.db ".backup '/home/deploy/backups/sihat-$(date +%F).db'"   # same thing with the sqlite3 CLI
sqlite3 data/sihat.db "PRAGMA wal_checkpoint(TRUNCATE);" && cp data/sihat.db backup.db   # plain copy is only safe right after a TRUNCATE checkpoint with the app idle
```
Never copy `sihat.db` alone while the app is writing (the `-wal` file holds committed data). Put the backup dir in the nightly offsite job.
The db file also holds the JWT secret and API keys: treat backups like credentials. Restore = stop the app, replace `data/sihat.db` (delete stale
`-wal`/`-shm`), start.

### Switching back to Supabase
Remove `DB_BACKEND` (or set `DB_BACKEND=supabase`) and make sure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are the new project's,
then `pm2 restart sihat-tcm-go`. **Data is NOT migrated automatically** — accounts (password hashes are PBKDF2 here, bcrypt in GoTrue, so users must
use "forgot password" after a migration) and rows written to SQLite stay in `data/sihat.db`. Sessions/cookies issued by the SQLite backend are
invalid on Supabase (different JWT secret): everyone logs in again.

### Known limits
- **No email delivery:** `POST /auth/v1/recover` writes the reset link to the server log (`pm2 logs sihat-tcm-go | grep "PASSWORD RECOVERY LINK"`; valid 1 h,
  single use, newest request replaces older ones) — an operator has to relay it. Nothing is returned in the HTTP response.
- **Single node only:** one process owns the file (writer mutex + WAL); do not run PM2 cluster mode or two instances on one file.
- No Supabase dashboard / realtime / storage / OAuth / admin API; unsupported PostgREST syntax (`or=`, `and=`, `not.`, embeds, `Range`) answers an explicit 400.
- Durability is `synchronous=NORMAL` on WAL: an app crash loses nothing; a power cut can lose the last few commits but never corrupts the file.
- Test-only switches (`LOCALDB_TEST_HOOKS`, `--localdb-only`) expose `/__fake/*` and schemaless tables; the binary refuses them when `APP_ENV=production`.

Local/regression: `node aci.mjs test --suite=all --db=sqlite --ai=fake` (own temp db per stack), contract: `node regress/localdb-contract.mjs`.

## New Supabase project (wgxufplbcncsjwdhtuxd, "sihat-tcm-2", ap-southeast-1, created 2026-10-10)

URL `https://wgxufplbcncsjwdhtuxd.supabase.co`. Management-API PAT: `3-resources/credentials/supabase-pat.txt`; project keys:
`3-resources/credentials/sihat-tcm-supabase-2.txt` (and `sihat-tcm-go/.env`, gitignored). All helpers are in `db/`:

```bash
node db/apply-schema.mjs          # idempotent: tables, FKs, checks, updated_at triggers, handle_new_user trigger, RLS + policies
node db/configure-auth.mjs        # GoTrue: mailer_autoconfirm=true, site_url=https://tcm.wenjyue.com, redirect allow-list, min password 6
node db/fetch-keys.mjs            # writes SUPABASE_URL/ANON/SERVICE keys into .env + the credentials file (never prints them)
node scripts/seed-all.mjs         # demo accounts + 6 doctors + system_prompts via GoTrue admin API/PostgREST
node scripts/seed-all.mjs --via=sql   # same through the Management API SQL endpoint (works even if the REST/Auth gateway is restricted)
node db/verify.mjs                # tables / RLS / triggers / policies / seed counts (read-only)
node db/sql-contract-check.mjs    # 60+ constraint/FK/RLS/grant checks run as anon/authenticated/service_role over SQL (self-cleaning)
```
Access model: the Go server uses the service-role key for everything except diagnosis_sessions and the four notification tables, which
it reads/writes with the USER's JWT (owner RLS). Every other table has RLS on and no policy (service-role only).

**Gateway restriction (2026-10-10):** the project's REST and Auth endpoints return HTTP 402 `exceed_egress_quota` (the org is on the free plan
and over quota) while the database and Management API work. Nothing app-facing works against it until the org plan is upgraded / the spend cap removed.

**Repointing production (NOT done — needs an explicit go-ahead, and only after the gateway answers 200):** set the three `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` values in `/home/deploy/sihat-tcm-go/.env.production` (chmod 600) to the new project's,
then `ssh deploy@5.223.54.57 'bash -lc "pm2 restart sihat-tcm-go"'` and check `/healthz` + `node aci.mjs test --base=https://tcm.wenjyue.com`.

## Wearable / phone health data (Web Bluetooth, Google Health, Apple Health, Shortcut ingest)

Code: `internal/server/health_*.go`, `static/js/health-connect.js`, `static/js/devices.js`. Tests: `go test ./internal/server -run 'Health|Apple'`,
`node --test regress/health-connect.test.mjs`, `node aci.mjs test --suite=health`, `scripts/devices_browser_test.py`.

**1. Database (NOT applied by the code - apply once, before the deploy).** SQLite fallback: nothing to do (`internal/localdb/schema.go` creates the
tables). Supabase: run `node db/apply-schema.mjs` (idempotent) or paste the block headed "Wearable / phone health data" of `db/schema.sql` into the SQL
editor: tables `health_readings` (owner-only RLS + grant to authenticated), `health_connections` and `health_ingest_tokens` (RLS on, no policy = service
role only), the unique key `(user_id, metric, measured_at, source)` and the per-metric CHECK. The app needs `SUPABASE_SERVICE_ROLE_KEY` for the token and
connection tables (the ingest and Google routes answer 503 without it).

**2. Environment** (all optional; without them Google shows "not configured on this server" and the other channels still work):
```
HEALTH_TOKEN_KEY=<random string, 16+ chars (use 32 bytes of hex)>   # seals Google refresh tokens + the OAuth state cookie; losing it = users must reconnect
GOOGLE_HEALTH_CLIENT_ID=...                                         # OAuth 2.0 *web application* client
GOOGLE_HEALTH_CLIENT_SECRET=...
GOOGLE_HEALTH_REDIRECT_URL=https://tcm.wenjyue.com/api/health/google/callback   # default: PUBLIC_BASE_URL + that path
```
Google Cloud: enable the Google Health API on the project, add the redirect URI above to the OAuth client, add the scopes
`googlehealth.health_metrics_and_measurements.readonly` and `googlehealth.activity_and_fitness.readonly` to the consent screen (testing mode + test users is
enough for personal use; public use needs Google's verification of those sensitive scopes). `GOOGLE_HEALTH_AUTH_URL/TOKEN_URL/REVOKE_URL/API_BASE` exist
for tests only and are ignored when `APP_ENV=production`.

**3. nginx / Cloudflare.** Apple export.zip uploads are up to 95 MB (Cloudflare's free plan stops requests at 100 MB): `deploy/tcm.wenjyue.com.nginx.conf`
has a `location = /api/health/apple/import` block with `client_max_body_size 100m`; copy it to the server with the rest of the conf and reload nginx.
The app sends `Permissions-Policy: bluetooth=(self)`; no CSP change is needed.
