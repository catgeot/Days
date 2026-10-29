# r12 — Jeju 1280 pin/label missing (r11)

**Symptom:** r11 `branch-jeju-1280` had correct `getCenter()` but scout pin + city label were invisible (r9 showed them).

**Cause:** On home-fly `arrived`, `releaseHomeGlobeFlySession` cleared the 8s suppress window immediately and did not run marker/label reveal (`tryRevealGlobeOverlays`, `updateGateoMarkerSource`, forced label policy). Auto-rotate could also resume before settle, drifting lng west while layers stayed stale.

**Fix:** Keep rotate suppressed for `HOME_GLOBE_SETTLE_MS` (15s) after arrived; on arrived force-sync gateo marker source + visibility and `applyPlaceLabelVisibility({ force: true })`.
