#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export SMOKE_SITE_URL="${SMOKE_SITE_URL:-http://127.0.0.1:4173/}"
unset MOONI_TOURAPI_STUB_ONLY
export CI=
export GITHUB_ACTIONS=
PW=(npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record --grep "button matrix")
for slug in yanggu-1122739 gangneung-2930716 masan-637693; do
  echo "=== PROD QA region: $slug ==="
  PROD_QA_REGION="$slug" "${PW[@]}"
done
npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record --grep "write README"
