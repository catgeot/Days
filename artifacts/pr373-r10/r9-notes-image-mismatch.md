# r9 Tokyo 390 JPEG vs notes.json mismatch

`branch-tokyo-390-after-home-settled.jpg` was **byte-copied** from `artifacts/pr373-r8/branch-tokyo-390-home-run-04.jpg` (blob `749eeaf4`) during r9 artifact cleanup.

`notes.json` still recorded `centerLat` / `centerLng` from `window.__gateoGlobeQaMetrics`, which updates on **map idle** after a later successful `flyTo`. The copied JPEG was from an **earlier** run where the visible frame was still the default / auto-rotate view (Central Asia) even though metrics later reported Tokyo (~135.86°E).

**r10 rule**: log `atCapture` (metrics read in the same turn, immediately before `page.screenshot`).
