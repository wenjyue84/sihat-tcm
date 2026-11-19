#!/usr/bin/env bash
# Build a static linux/amd64 binary for the Hetzner VPS (mirrors pelangi go-site).
# GUARD: the deploy artifact is only built for a tree the regression graph has passed
# (stamp from `node aci.mjs gates --profile=predeploy`). SKIP_REGRESS=1 bypasses — loudly.
set -euo pipefail
cd "$(dirname "$0")"

if [ "${SKIP_REGRESS:-0}" != "1" ]; then
  if ! node regress/graph.mjs verify-stamp; then
    echo "❌ refusing to build a deploy artifact: no green regression stamp for this tree."
    echo "   run: node aci.mjs gates --profile=predeploy   (or SKIP_REGRESS=1 ./build.sh to bypass at your own risk)"
    exit 1
  fi
else
  echo "⚠️  SKIP_REGRESS=1 — building WITHOUT a regression stamp check"
fi

echo "==> go vet"
go vet ./...

echo "==> checks (staticcheck ratchet + boundary scans; override: CHECKS_RATCHET=warn)"
node checks/ratchet.mjs
go test ./checks/ -count=1

echo "==> building sihat-tcm-go (linux/amd64, static)"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o sihat-tcm-go .

echo "==> done: $(ls -lh sihat-tcm-go | awk '{print $5}')"
