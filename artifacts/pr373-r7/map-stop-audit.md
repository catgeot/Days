# PR #373 r7 — map.stop, rotation, pixel ratio

See `artifacts/pr373-r4/map-stop-audit.md` for `map.stop()` inventory (12 calls).

## `resetPins` auto-rotate resume

- `easeTo` duration: **1500ms**
- `scheduleOrientRotateResume(map, easeMs, { rotatePauseMs: 0 })` — not `orientRotatePauseMs` (2800) on this path
- Effective resume: **~1500ms** after `resetPins`, not ~4300ms (1500 + 2800)

## Device pixel ratio (r6–r7)

- **No** `window.devicePixelRatio` override (removed — caused WebKit black wedges / rectangles when combined with Mapbox).
- **No** `scopeGlobePixelRatio` wrapper around `map.resize` / `map._render` (removed in r6).
- **SSOT cap**: `resolveGlobePixelRatio()` → `Math.min(window.devicePixelRatio || 1, GLOBE_MAX_PIXEL_RATIO)` with `GLOBE_MAX_PIXEL_RATIO = 2`, passed only as `<Map pixelRatio={resolveGlobePixelRatio()}>`.
- **`pauseRender` visibility**: use `opacity-0` (not Tailwind `invisible` / `visibility:hidden`) so WebKit keeps painting the full WebGL framebuffer while the place card covers the globe.
- **After overlay / `pauseRender` unpause**: `refreshGlobeMapCanvas` — staged `map.resize()`, backing-dimension check, `jumpTo` same camera (full frame resync), `ResizeObserver` on the map container, and `refreshGlobeMapCanvasAfterMotion` after `moveend` / `idle`.
- **QA hook** (`?gateoGlobeQa=1`): `window.__gateoGlobeQaMetrics.canvasBackingMismatch` flags backing-store drift.
