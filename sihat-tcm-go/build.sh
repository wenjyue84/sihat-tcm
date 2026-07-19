#!/usr/bin/env bash
# Build a static linux/amd64 binary for the Hetzner VPS (mirrors pelangi go-site).
set -euo pipefail
cd "$(dirname "$0")"

echo "==> go vet"
go vet ./...

echo "==> building sihat-tcm-go (linux/amd64, static)"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o sihat-tcm-go .

echo "==> done: $(ls -lh sihat-tcm-go | awk '{print $5}')"
