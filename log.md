# log.md — sihat-tcm

Append-only chronological record. Newest first. Heading format: `## [YYYY-MM-DD] <type> | <title>` where type ∈ build · fix · audit · decision · brief · dispatch · security · structure · event · note.

## [2026-11-19] structure | checks-over-prose rollout (sihat-tcm-go)

Added `sihat-tcm-go/checks/` (6 Go source scans + staticcheck ratchet, baseline in `baseline.json`), wired into graph.mjs `vet` node and `build.sh`. No behaviour change. See `wiki/checks.md`.

## [2026-09-11] build | hub scaffolded by hub_lint.py (HUB-001)

Created missing hub files from `_tools/hub-lint/templates/`.
