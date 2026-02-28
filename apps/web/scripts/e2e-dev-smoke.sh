#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${PLAYWRIGHT_BASE_URL:-https://riannahs-plants-develop.pages.dev}}"

cd "$(dirname "$0")/.."

echo "Running deployed E2E smoke against: $BASE_URL"
PLAYWRIGHT_BASE_URL="$BASE_URL" npx playwright test tests/e2e/login-deployed.spec.js \
  --reporter=line \
  --trace=on-first-retry
