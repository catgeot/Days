# 2026-06-03 프로젝트 일지 — 3D 투어 Phase 1d~1h

**직전**: [`2026-06-02-project-log.md`](2026-06-02-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## 제품 결정

- **3D 투어 버튼**: 유효 좌표면 **전 여행지** 노출 유지.
- **투어 center**: `globeLandmarks.json` SSOT · `travelSpots` 핀 좌표 변경 금지.
- **Standard 랜드마크**: **bright(Standard) + urban `cityOrbit` 투어 중**만 Mapbox 아이콘·3D 랜드마크 — deep(위성)에는 해당 없음.
- **bright 홈 지명**: gateo 마커와 Mapbox 지명 겹침 → **다음 세션**에 deep처럼 `showPlaceLabels` off·gateo-first 정리 예정 (밋밋함은 위성 대비 덜함).

## 구현 (Phase 1d → 1e~1h)

| Phase | 내용 |
|-------|------|
| 1d | `globeTourResolve` · nature 12 slug `globeLandmarks` (`574ac0c`) |
| 1e | +58 slug · **80** landmark · nature/adventure **68/134** · `merge-globe-landmarks-1e.cjs` |
| 1f | `mount-fuji` 7-frame `keyframes` · `tourReady` |
| 1h | `globeStandardBasemap.js` — 유효 `setConfigProperty`만 · urban 투어 시 icons+labels+`show3dLandmarks` |
| — | 파리 center 에펠·센 강 · bright 콘솔 오류 후보 키 제거 (`language`, `showRoadsAndTransit` 등) |

## QA

- **1d Pass**: 칸쿤·사파·흐바르 해변·산맥 포커스.
- **1g 대기**: gateo.kr 스모크 · 2D 복귀 · Skip · 모바일 · 후지산 keyframe 체감 · bright 파리 urban 투어 랜드마크.

## 다음 세션

→ 계획 문서 **「다음 세션 제시어」** — bright gateo-first 지명 · 1g 스모크 · 잔여 ~66 nature landmark.
