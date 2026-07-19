# Sihat TCM — Go ⇄ TypeScript Feature Parity

Status of the Go rewrite (`sihat-tcm-go/`) against the original Next.js app
(`sihat-tcm-web/`). Branch `feat/sihat-tcm-go`, deployed live at
https://tcm.wenjyue.com. Last updated 2026-07-20.

## At parity (verified in production)

| Area | Feature |
|------|---------|
| Diagnosis | 4-examination wizard (info · inquiry · tongue · face · audio · pulse · review · report), guest→user migration, session save/recovery |
| Report | AI report render, report/western/heart chat, **print / save-PDF**, **standalone shareable page** `/patient/report/{id}` |
| Analysis | image / tongue / face / audio / pulse / snore, extract-text, validate-medicine |
| Patient | dashboard (history · health overview · organ clock · profile · doctor directory + detail), dietary Q&A, **consultations with two-way messaging**, cancel |
| Doctor | master inbox (search / status + priority filter), **Patients grouped view**, explicit triage flags, **two-way messaging**, **treatment-plan authoring**, generate-inquiry, per-report print |
| Admin | **read-only ops console** `/admin` (health · DB · prompt coverage · error stats · logs · settings) |
| Platform | full auth (login/signup/forgot/reset), **live EN/ZH/BM localisation across every screen**, SEO (robots/sitemap), notifications API |

## Deliberately deferred (need a human decision or are blocked)

| Item | Why not auto-built |
|------|--------------------|
| True real-time (websocket / presence) | Large new infra for marginal gain — 25s guarded auto-refresh now delivers near-real-time messaging. Low priority. |
| Writable admin (edit prompts / users / practitioners) | Mutating admin operations — needs explicit sign-off on scope before wiring. Read-only console + AI-key diagnostic ship now. |

## Deliberately NOT ported (TS placeholders / would re-introduce bugs)

Analytics & schedule stubs ("Coming Soon"), community feed (no backend), voice
commands, background music, mock patient data, seed-yeak.

**TS bugs avoided:** localStorage-only reports · keyword-based false-positive
`critical` flag · client-side Supabase permission bypass · `ssr:false` no-SEO home
· i18n fighting JS-driven dynamic buttons · pre-gating pages on a JS-readable
token when auth is an HttpOnly cookie.

## Verification

Every change ships behind green gates (per-commit):
- **ACI** `node aci.mjs test --suite=health|auth` — 4/4 + 8/8.
- **Playwright** `scripts/{i18n,report_page,admin}_browser_test.py` — 14 + 4 + 5 assertions.
- **API round-trips** for mutations (two-way reply, treatment plan) incl. ownership/403 checks.

AI-dependent ACI suites (chat/image/consult) were verified green on 2026-07-20
after the daily quota reset: **full `--suite=all` = 28/28**. The Gemini free-tier
limit (~20 req/day/model) re-exhausts within minutes of heavy testing — a runtime
constraint, not a code gap. Sustained AI use needs a billed/paid key.

## Deploy

`bash build.sh` → scp binary to `deploy@5.223.54.57:/home/deploy/sihat-tcm-go/` →
`pm2 restart sihat-tcm-go` (port 3200). Static assets are cache-busted via
`{{asset}}` versioning; no manual Cloudflare purge needed. Branch not yet merged to
`master` — deploy is via scp.
