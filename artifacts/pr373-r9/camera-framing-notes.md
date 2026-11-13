# r9 — Tokyo 390 shots framed on Central Asia (r8)

## What you saw in r8 `branch-tokyo-390-home-run-*.jpg`

The globe often showed **Central Asia / Mongolia** with **Tokyo off-screen**, while the run still passed wedge checks.

## Intended behavior?

**No.** After Tokyo → 홈, the product should **fly the globe to the Tokyo pin** (`moveToLocation` / home fly SSOT), not leave the default auto-rotate longitude.

## Why r8 looked like Central Asia

1. **`goHomeFromPlace` used fixed `setTimeout(150ms)`** before `moveToLocation`, while **`pauseRender` was still true** on `/place` until React re-rendered after `navigate('/')`. The fly often **never started** (or started too late); captures waited only for generic `idleAt`, so the camera stayed near the **idle auto-rotate** view (~central Asia at zoom ~1.25).

2. **Not** the default “home face” category jump — that runs on other paths; this flow should pin-focus Tokyo.

## r9 fix

- **`pendingHomeGlobeUnpauseRef` + `useEffect(shouldPauseGlobe)`** — run `moveToLocation` only after **`pauseRender` is actually false**.
- Captures wait for **`centerLat`/`centerLng` in Tokyo band** (see `scripts/capture-pr373-r8-tokyo10.mjs`, `capture-pr373-r9.mjs`).

Compare **branch vs main** JPEG pairs in `artifacts/pr373-r9/` after capture (same settle rules on main via summary dismiss).
