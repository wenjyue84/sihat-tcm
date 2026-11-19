# Sihat TCM Go — regression system (ACI v2 + regression graph)

**Start here:** `node aci.mjs describe`. Everything is JSON on stdout, ✓/✗ on stderr, exit 0/1/2/3.

## What runs, and where

| Layer | What | Command |
|---|---|---|
| Unit | Go tests per package: gemini client/stream, config, supabase client, auth/rate-limit/middleware, handlers helpers, AI + analysis + summaries handlers (fake Gemini via `httptest`), pages/static (embedded FS) | `go test ./... -count=1` |
| Integration | ACI suites against the **real Go binary** on a hermetic stack: `health auth chat image consult pages security ratelimit listener fakedb datacontract roles demo video` | `node aci.mjs test --suite=quick` |
| E2E (API) | `journey`: the MAIN workflow ×N cycles in en/zh/ms — unregistered patient asks (inquiry chat) → report (retry until a valid report) → guest save → **register** → login → migration → registered consult → report-chat → **connect with a registered doctor** → doctor inbox/flag/reply/treatment-plan → patient sees + replies → profile → cancel; then **admin / developer / stranger** interfaces and the role fences | `ACI_CYCLES=5 node aci.mjs test --suite=journey` |
| E2E (browser) | Playwright scripts `scripts/*_browser_test.py` incl. `ui_roles_browser_test.py` (every role's UI, mobile viewport, a11y basics) | graph node `e2e-ui` |
| E2E (real models) | the same `journey`, but AI = **this PC's opus/sonnet/haiku** through `sihat-listener` | `node aci.mjs test --suite=journey --ai=pc` |
| Graph | all of the above as one dependency graph with checkpoint + stamp | `node aci.mjs gates --profile=quick\|full\|predeploy` |

## The /demo tour
`GET /demo` is a public, noindex, bilingual (zh default / en toggle) guided tour of every role's journey plus the product's
advantages (`templates/demo.html`, `internal/server/demo_content.go`, `static/{css/demo.css,js/demo.js,demo/}`).
`?autoplay=1` auto-advances with captions + progress bar (recorder hooks documented at the top of `demo.js`), `?act=N` /
`?step=N-M` jump. Its screenshots come from the REAL app: `scripts/capture_demo_assets.py` (boots nothing; `E2E_BASE=…`,
use `ACI_PORT_OFFSET=2100 node regress/serve.mjs --ai=pc`) writes `static/demo/*.webp` + `manifest.json` (mirrored to
`scripts/capture_manifest.json`). `suite demo` pins routes/ids/assets/links/i18n/offline-safety and that page numbers never
exceed `regress/.state/stamp.json`. Re-capture whenever the UI of a pictured page changes.

## Database backends: `--db=fake | sqlite | real`

| `--db` | What | Use |
|---|---|---|
| `fake` (default) | `regress/fake-supabase.mjs` in-memory stand-in: no RLS, no JWT signing, no constraints | fast default for the browser scripts and the pc journey |
| `sqlite` | the app's own **SQLite fallback** (`DB_BACKEND=sqlite`, `internal/localdb`): fresh temp file per stack, PBKDF2 passwords, HS256 JWTs, db/schema.sql constraints + owner RLS. Its internal API is pinned to the stack's db port (`54329+ACI_PORT_OFFSET`) with `/__fake/*` hooks so `t.dbInsert`/`t.dbTable` work | anything that depends on constraints / RLS / real tokens: `ACI_PORT_OFFSET=2600 node aci.mjs test --suite=all --db=sqlite --ai=fake` (graph node `e2e-sqlite` runs journey+roles+security+datacontract this way) |
| `real` | `.env`'s Supabase project (blocked while its gateway answers 402) | final proof once Supabase is usable again |

`suite fakedb` is the DB **contract**: by default it tests the JS fake; with `FAKEDB_BASE=<url>` it runs the same checks (plus Postgres-faithful ones the fake
had to skip: duplicate-PK 409, `NULLS FIRST` on desc, `limit=0`, `PATCH` without `Prefer` = 204, apikey, RLS over the wire) against the Go backend.
`node regress/localdb-contract.mjs` builds the app, boots `sihat-tcm-go --localdb-only --port N` (hooks + scratch tables, throw-away keys/db) and does that
(graph node `contract-localdb`). Differences found when the sqlite backend was introduced (all were suite or app-vs-real-DB mismatches the fake hid): seeds
and fixtures now carry the NOT NULL columns of db/schema.sql (`primary_diagnosis`, `full_report`), `patients.user_id` is unique, a non-UUID `doctorId` is a 500 on a
typed uuid column (finding, recorded as a skip in `suite security`).

## Hermetic stack (`regress/stack.mjs`)

`fake-supabase` (GoTrue + PostgREST subset, in-memory, seeded demo accounts) :54329 · `sihat-listener` :18788
(`FAKE=1` canned replies, or real PC models with `--ai=pc`) · the freshly built Go binary :18081.
`ACI_PORT_OFFSET=N` shifts all three so stacks run in parallel. Only the PIDs it started are ever killed.
**Why a fake DB (default):** fast, hermetic, free, deterministic. The old real project (`jvokcruuowmvpthubjqh`) is dead; the current one is
`wgxufplbcncsjwdhtuxd` (see DEPLOY.md "New Supabase project"). **Real DB:** `ACI_PORT_OFFSET=2400 node aci.mjs test --suite=health,auth,roles,security,ratelimit,pages,datacontract,demo,journey --db=real --ai=fake`
boots the Go binary against `.env`'s Supabase, preflights the gateway (a 402/5xx aborts with `BLOCKED: …`), seeds nothing itself (run `node scripts/seed-all.mjs` once), and afterwards runs
`regress/cleanup-real-db.mjs` (deletes only `@example.com` test users + their rows, anonymous guest rows / system_* rows written since the run started; the `@sihat.com` seed is untouched).
Suites seed/inspect through `t.dbInsert` / `t.dbTable` (fake REST, the sqlite backend's hook API with its service key, or the real service key). **As of 2026-10-10 the real project's REST/Auth gateway returns HTTP 402 (exceed_egress_quota), so `--db=real` cannot run;**
`node db/sql-contract-check.mjs` covers constraints/RLS over SQL in the meantime.
**Blind spots of the fake:** no Row-Level-Security, no real JWT signing, no constraints/FKs. `suite fakedb` guards that the
app never starts using a PostgREST feature the fake lacks.

## The graph (`regress/graph.mjs`)

```
vet ─┐
unit ─┼─► integration ─┬─► e2e-api ─┬─► e2e-ui  (browser)
build-linux ─┤          │            └─► e2e-pc  (model leaf)
wiring ─┘               ├─► e2e-sqlite       (journey+roles+security+datacontract, --db=sqlite)
                        └─► contract-localdb (suite fakedb vs the Go SQLite backend)
```
Nodes are code except `e2e-pc` (model-backed leaf). Failed node → dependents `blocked`; independent branches still run.
`--resume` reuses a node's PASS when the tree hash is unchanged. A fully green `predeploy` run writes
`regress/.state/stamp.json` = the tree hash; **`build.sh` and `scripts/deploy.sh` refuse to build/ship without a stamp
that matches the current tree** (`node regress/graph.mjs verify-stamp`). `SKIP_REGRESS=1 ./build.sh` bypasses, loudly.

## Before each deployment

```
node aci.mjs gates --profile=predeploy        # ~10-30 min with real models; or:  scripts/deploy.sh --run-gates
scripts/deploy.sh                             # verifies stamp → build → asks → upload → restart → post-deploy ACI on prod
```

## Adding a suite
Create `regress/suites/<name>.mjs` exporting `{name, doc, needs, mutating, costly, run(t)}` (contract in `regress/harness.mjs`).
It is picked up by `aci.mjs`, `describe` and the `integration` node automatically (add its name to the list in `graph.mjs`).
A suite that runs zero checks fails. Real bugs found by a suite stay red until fixed — never weaken the check.
