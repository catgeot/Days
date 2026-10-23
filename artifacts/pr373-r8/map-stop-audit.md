# PR #373 r8 — Tokyo wedge root cause

## Intermittent WebKit wedge (Tokyo 390 home-return)

**Cause (two parts):**

1. **`holdMapRender('pause')`** while `pauseRender` — when the map was `loaded()`, `triggerRepaint` became a no-op during `/place` or `/explore`, so **flyTo frames were dropped** while the globe was only `opacity-0`. Unpause + home fly left a partial globe framebuffer (labels OK, terrain missing on the right).

2. **`goHomeFromPlace`** called **`moveToLocation` before `navigate('/')`**, so the fly often started while **`pauseRender` was still true**.

**Fix:**

- Pause uses **`opacity-0` + `aria-hidden` + `inert`** only — **no** render hold on `pause`.
- **Navigate home first**, then **`moveToLocation` + `wakeAfterOverlay` after 150ms** (same pattern as explore→home effect).

**Verify:** `node scripts/capture-pr373-r8-tokyo10.mjs` — 10/10 WebKit runs, `wedge-metrics.json` / `.md`.
