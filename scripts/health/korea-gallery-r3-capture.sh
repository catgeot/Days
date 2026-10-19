#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="/opt/cursor/artifacts/korea-gallery-r3"
mkdir -p "$OUT"

run_variant() {
  local variant="$1"
  local port="$2"
  local ref="$3"
  git -C "$ROOT" stash push -u -m "r3-capture-temp" >/dev/null 2>&1 || true
  git -C "$ROOT" checkout "$ref"
  npm -C "$ROOT" ci --omit=optional
  npm -C "$ROOT" run build
  local preview_pid
  npx -C "$ROOT" vite preview --host 127.0.0.1 --port "$port" --strictPort &
  preview_pid=$!
  sleep 3
  GALLERY_CAPTURE_VARIANT="$variant" PLAYWRIGHT_BASE_URL="https://127.0.0.1:${port}" \
    npx playwright test -c playwright.config.korea-gallery-r3.js --project=webkit
  kill "$preview_pid" 2>/dev/null || true
  wait "$preview_pid" 2>/dev/null || true
}

cd "$ROOT"
FEATURE_REF="${FEATURE_REF:-cursor/korea-gallery-stock-relevance-f0f1}"
run_variant r2 4173 "$FEATURE_REF"
run_variant main 4174 main
git -C "$ROOT" checkout "$FEATURE_REF"
git -C "$ROOT" stash pop >/dev/null 2>&1 || true

if command -v magick >/dev/null 2>&1; then
  shopt -s nullglob
  files=("$OUT"/main-*-390-initial.png "$OUT"/r2-*-390-initial.png)
  if ((${#files[@]} > 0)); then
    magick montage -mode concatenate -tile 2x -geometry 390x844+4+4 -background '#0b1018' \
      "${files[@]}" "$OUT/combined-grid.png" || true
  fi
fi

echo "HEAD $(git -C "$ROOT" rev-parse HEAD)"
echo "Artifacts: $OUT"
