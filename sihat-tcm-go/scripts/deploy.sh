#!/usr/bin/env bash
# Guarded production deploy for sihat-tcm-go (Hetzner / PM2 / nginx / Cloudflare — see DEPLOY.md).
#
#   scripts/deploy.sh [--run-gates] [--yes]
#
# Refuses to ship unless the regression graph is GREEN for exactly this working tree:
#   node regress/graph.mjs verify-stamp     (stamp written only by a fully green `--profile=predeploy` run)
# --run-gates  run the whole graph first (unit → integration → e2e api → e2e ui → real-model journey)
# --yes        skip the interactive "ship to production?" confirmation (outward-facing step)
set -euo pipefail
cd "$(dirname "$0")/.."

RUN_GATES=0; YES=0
for a in "$@"; do case "$a" in --run-gates) RUN_GATES=1;; --yes) YES=1;; *) echo "unknown arg $a"; exit 2;; esac; done

# Production moved to the Contabo VPS (systemd unit sihat-tcm-go, /opt/sihat-tcm-go) — verified 2026-10-10 via Cloudflare DNS (tcm -> 194.163.189.1).
SSH_KEY="${SSH_KEY:-$HOME/.ssh/contabo_ed25519}"
HOST="root@194.163.189.1"
DIR="/opt/sihat-tcm-go"
URL="https://tcm.wenjyue.com"

if [ "$RUN_GATES" = 1 ]; then
  echo "==> regression graph (predeploy profile)"
  node aci.mjs gates --profile=predeploy >/dev/null || { echo "❌ regression graph RED — not deploying"; exit 1; }
fi

echo "==> verifying regression stamp for this exact tree"
if ! node regress/graph.mjs verify-stamp; then
  echo "❌ no green regression stamp for the current tree."
  echo "   run:  node aci.mjs gates --profile=predeploy     (or: scripts/deploy.sh --run-gates)"
  exit 1
fi

echo "==> build"
SKIP_REGRESS=1 ./build.sh   # stamp was just verified above

if [ "$YES" != 1 ]; then
  read -r -p "Ship sihat-tcm-go to PRODUCTION ($URL)? [y/N] " ans
  [ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "aborted"; exit 1; }
fi

echo "==> upload + restart (previous binary kept as sihat-tcm-go.bak.<ts>)"
scp -i "$SSH_KEY" -o BatchMode=yes sihat-tcm-go "$HOST:$DIR/sihat-tcm-go.new"
ssh -i "$SSH_KEY" -o BatchMode=yes "$HOST" "set -e; cd $DIR; cp sihat-tcm-go sihat-tcm-go.bak.\$(date +%Y%m%d-%H%M%S); chown deploy:deploy sihat-tcm-go.new; chmod +x sihat-tcm-go.new; mv sihat-tcm-go.new sihat-tcm-go; systemctl restart sihat-tcm-go; sleep 3; systemctl is-active sihat-tcm-go"

echo "==> post-deploy verification (read-only suites against $URL)"
sleep 3
# prod runs SEED_DEMO=0 (no public demo accounts), so the auth suite (demo logins) is not used here
node aci.mjs test --base="$URL" --suite=health,consult || {
  echo "❌ post-deploy verification FAILED — roll back:"
  echo "   ssh -i $SSH_KEY $HOST 'cd $DIR \&\& ls -t sihat-tcm-go.bak.* | head -3'"
  exit 1
}
node aci.mjs snapshot --base="$URL" --json --out "regress/.state/prod-snapshot.json" >/dev/null && echo "snapshot → regress/.state/prod-snapshot.json"
echo "✅ deployed + verified: $URL"
