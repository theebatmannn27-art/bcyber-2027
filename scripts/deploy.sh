#!/usr/bin/env bash
# One-command deploy. Needs a Vercel token: https://vercel.com/account/tokens
#   ./scripts/deploy.sh <vercel-token>
set -euo pipefail
TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  echo "usage: ./scripts/deploy.sh <vercel-token>"
  echo "create one at https://vercel.com/account/tokens"
  exit 1
fi
npx --yes vercel@latest deploy --prod --yes --token "$TOKEN"
