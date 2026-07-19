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
SUPABASE_URL=…
SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
GEMINI_API_KEY=…
TELEGRAM_BOT_TOKEN=…   # optional
```

## Rollback

```bash
ssh deploy@5.223.54.57 'cd /home/deploy/sihat-tcm-go && ls -t sihat-tcm-go.bak.* | head -3'
ssh deploy@5.223.54.57 'cd /home/deploy/sihat-tcm-go && cp <backup> sihat-tcm-go && bash -lc "pm2 restart sihat-tcm-go"'
```
