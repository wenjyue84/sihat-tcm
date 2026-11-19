# Checks (sihat-tcm-go) — rules that fail instead of being read

> Added 2026-11-19 (checks-over-prose rollout). Scope: `sihat-tcm-go/` only. The web (Next.js) and mobile apps were not touched.
> No behaviour change; existing violations are recorded as a baseline and only *new* ones fail (ratchet).

## What exists

| Check | Kind | File | Baseline | Runs in |
|---|---|---|---|---|
| Every `/api/*` route is wrapped in `RequireAuth`, or is on the reviewed `publicAPI` list | boundary | `checks/checks_test.go` `TestRoutesRequireAuthOrAreReviewedPublic` | 35 public routes listed with a reason | `go test ./...` |
| No `http.Client{}` without `Timeout`, no `http.Get/Post/DefaultClient` | ban-new | `TestNoHTTPWithoutTimeout` | 0 (1 grandfathered: `handlers_notifications.go`, has a 10s context) | `go test ./...` |
| `os.Getenv` only in `internal/config` / `main.go` | boundary | `TestEnvReadOnlyInConfig` | 2 grandfathered reads (`handlers_admin.go`, `handlers_media.go`) | `go test ./...` |
| No token-shaped string in `internal/ static/ templates/ deploy/ db/` | boundary | `TestNoTokenShapedStrings` | 0 | `go test ./...` |
| Every table in `db/schema.sql` is registered in `internal/localdb/schema.go` | boundary | `TestSchemaSQLMatchesLocalDB` | 0 missing | `go test ./...` |
| Ignored errors (`_ = call()`) per package | ratchet | `TestIgnoredErrorsRatchet` + `checks/baseline.json` | `.`:3 gemini:1 localdb:12 server:45 | `go test ./...` |
| `staticcheck` findings per code | ratchet | `checks/ratchet.mjs` + `checks/baseline.json` | 8 findings (S1008 1, S1030 1, S1039 2, ST1018 1, SA4000 1, SA4006 1, U1000 1) | `vet` node of `regress/graph.mjs`, and `build.sh` |

`go vet` was already in the gate (`vet` node, `build.sh`) and was clean, so it needs no ratchet.

## Run

```
go test ./checks/ -count=1          # source scans (~2 s)
node checks/ratchet.mjs             # staticcheck ratchet (~1.5 s once built)
node aci.mjs gates --profile=predeploy   # whole gate; the vet node now includes the ratchet
```

Each error message says what to do instead.

## Tighten the ratchet

When a count drops, lock it in: `node checks/ratchet.mjs --update` (staticcheck) or edit `ignored_errors` in
`checks/baseline.json` (the test logs "improved" with the new number). Never raise a baseline without Jay's approval.
A new public API route is added to `publicAPI` in `checks/checks_test.go` *with a reason*.

## Emergency override

`CHECKS_RATCHET=warn` makes `checks/ratchet.mjs` print the failure loudly and exit 0, so a production deploy is never
blocked by it. The Go source scans have no override: fix the violation or add the reviewed allow-list entry.

## Proven to bite (2026-11-19)

A temporary file with an unauthenticated `/api` route, `http.Client{}`, `os.Getenv`, an `AIza…` literal, extra `_ =` calls and an
unused func, plus a table appended to `db/schema.sql`, made all six scans and the staticcheck ratchet fail; both were reverted.

## Proposals not done

- Ban-new for `_ = s.DB.Select(...)` (many of the 45 server ignored errors): needs a small `s.DB.SelectBestEffort` paved road first.
- `go func` without context (3 sites) and `context.Background()` in request paths (2 sites): count is small, review by hand then add to the ratchet.
- Convert the `publicAPI` entries marked "gated inside handler" to an explicit wrapper (e.g. `s.RequireToken`) so the scan can prove the gate.
- `golangci-lint` is installed but not configured; adopting it is a decision for Jay (new rule set, noise).
- Duplicated helpers across `internal/server` were not inventoried (no identical-body merge attempted).
- The web and mobile apps (`sihat-tcm-web`, `sihat-tcm-mobile`) have their own husky/lint-staged gate; not reviewed in this pass.
