# PR #373 r5 — map.stop & rotation notes

See r4 audit for `map.stop()` inventory (12 calls).

## `resetPins` auto-rotate resume

- `easeTo` duration: **1500ms**
- `scheduleOrientRotateResume(map, easeMs, { rotatePauseMs: 0 })` — **no** `orientRotatePauseMs` (2800) on this path
- Effective resume: **~1500ms** after `resetPins`, not ~4300ms (1500 + 2800)

## DPR cap (r5)

- **Removed** mount-level `window.devicePixelRatio` override (WebKit black-rectangle regression).
- **Kept**: `pixelRatio={resolveGlobePixelRatio()}` on `<Map>` + `scopeGlobePixelRatio` wrapping `map.resize` / `map._render` only during those calls.
- `wakeAfterOverlay` / pauseRender unpause: `syncGlobeCanvasToPixelRatioCap` + marker/label resync.
