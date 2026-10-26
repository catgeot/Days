#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 1 ]]; then
  echo "usage: playwright-ci-install.sh <browser> ..." >&2
  exit 1
fi
if [[ "${PLAYWRIGHT_CACHE_HIT:-false}" == "true" ]]; then
  npx playwright install-deps "$@"
  npx playwright install "$@"
else
  npx playwright install --with-deps "$@"
fi
