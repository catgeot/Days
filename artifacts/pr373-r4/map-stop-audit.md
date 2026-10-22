# map.stop() audit — PR #373 r4

Policy: avoid `map.stop()` on routine home/region flights (cancels in-flight tiles → black wedges). Keep only where user/program **must** cut an animation immediately (tour/cinema/pivot/immerse).

## HomeGlobeMapbox.jsx (3)

| Line (approx.) | Site | Keep? | Rationale |
|----------------|------|-------|-----------|
| pivotTourExplore | `map.stop()` before landmark `easeTo` | **Yes** | User pivoted to another pin mid-tour; must snap cancel prior camera easing. |
| immerseToPin | `map.stop()` before `flyTo` | **Yes** | Immersive zoom replaces any in-flight camera; stale motion causes wrong arrival pitch. |
| startTour | `map.stop()` before tour engine | **Yes** | Hands control to tour bootstrap keyframes; prior globe motion must not overlap 3D bootstrap. |

Removed in r3: `handleReturnToSpace`, `flyToRegion`, `flyToCategoryFace`.

## globeTourEngine.js (3)

| Line | Keep? | Rationale |
|------|-------|-----------|
| 157 start bootstrap | **Yes** | Cancel ambient rotation/ease before immediate keyframe + terrain bootstrap. |
| 206 skip finalize | **Yes** | Skip must hard-stop playing keyframes before jumping to last frame. |
| 240 end | **Yes** | End tour tears down 3D; stop before `flyTo` default view. |

## globeFlightCinemaEngine.js (3)

| Line | Keep? | Rationale |
|------|-------|-----------|
| 438 | **Yes** | Cinema segment handoff — abort prior segment animation. |
| 541 | **Yes** | User skip / interrupt path. |
| 708 | **Yes** | Close cinema — stop before restoring globe camera. |

## globeSpaceHitTest.js (2)

| Line | Keep? | Rationale |
|------|-------|-----------|
| 102 | **Yes** | Drag-to-space gesture cancels ongoing ease before space return fly. |
| 123 | **Yes** | Second phase of same gesture — same cancel semantics. |

## globe3dBootstrap.js (1)

| Line | Keep? | Rationale |
|------|-------|-----------|
| 161 | **Yes** | Terrain/style bootstrap requires stable camera; stop in-flight motion first. |

**Total: 12** calls (3 HomeGlobeMapbox + 9 shared engines). r4 extends audit from r3’s HomeGlobe-only list.

## Auto-rotate halt (r4)

- `easeCameraForReachReveal` (reach load): `haltGlobeAutoRotateForCameraFlight` + `scheduleOrientRotateResume(1200)`.
- Share URL `jumpTo` on load + theme-settle `jumpTo` on idle: halt before `jumpTo`.
- `resetPins`: resume rotation via `scheduleOrientRotateResume(1500)` after `easeTo`, not immediate `autoRotateRef=true`.

## 홈으로 이동 / card (r4)

`goHomeFromPlace` matched `dismissPlaceSelectionKeepGlobePin`: clear `selectedLocation`, `skipHomeSummaryRestoreRef`, scout pin + `moveToLocation`, no `pendingGlobeHomeFocusRef` (prevents path effect reopening summary).
