# log.md — sihat-tcm

Append-only chronological record. Newest first. Heading format: `## [YYYY-MM-DD] <type> | <title>` where type ∈ build · fix · audit · decision · brief · dispatch · security · structure · event · note.

## [2026-11-19] build | deployed to production (tcm.wenjyue.com)

Jay approved deploy. Predeploy gate first red on e2e-ui (logout fetch aborted by navigation, ERR_ABORTED); fixed by reading the response body before navigating (templates/_partials.html x2, static/js/dashboard.js). Full gate green, then scripts/deploy.sh --yes. Server sha256 0f8c36f0... = local build; rollback sihat-tcm-go.bak.20261119-065105.

## [2026-11-19] structure | checks-over-prose rollout (sihat-tcm-go)

Added `sihat-tcm-go/checks/` (6 Go source scans + staticcheck ratchet, baseline in `baseline.json`), wired into graph.mjs `vet` node and `build.sh`. No behaviour change. See `wiki/checks.md`.

## [2026-09-11] build | hub scaffolded by hub_lint.py (HUB-001)

Created missing hub files from `_tools/hub-lint/templates/`.
