# 2026-06-03 프로젝트 일지 — 3D 투어 Phase 1d~1h + bright gateo-first

**직전**: [`2026-06-02-project-log.md`](2026-06-02-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md) · **커밋**: `ef0736b` · `305475b` (Mapbox 지명 SSOT·눈 버튼·우주 뷰)

---

## 제품 결정

- **3D 투어 버튼**: 유효 좌표면 **전 여행지** 노출 유지.
- **투어 center**: `globeLandmarks.json` SSOT · `travelSpots` 핀 좌표 변경 금지.
- **Standard 랜드마크**: **bright(Standard) + urban `cityOrbit` 투어 중**만 Mapbox 아이콘·3D 랜드마크 — deep(위성)에는 해당 없음.
- **Mapbox 지명 정책 (확정)**: 줌 **≥2** + 눈 버튼 ON일 때만 Mapbox 지명·행정 구분선. **우주 뷰(줌&lt;2)**·**눈 OFF** = Mapbox 전부 숨김 (Standard **랜드마크**·`showLandmarkIconLabels` 포함).
- **눈 버튼**: gateo 마커 + Mapbox 지명·구분선 (`isPinVisible` → `globeMapboxLabelPolicy.js`).
- **테마 전략**: **deep 메인** · bright = Standard `setConfigProperty` + landmark 레이어 강제 숨김(홈). urban `cityOrbit` 투어 중만 랜드마크 ON.

## 구현 (Phase 1d → 1e~1h)

| Phase | 내용 |
|-------|------|
| 1d | `globeTourResolve` · nature 12 slug `globeLandmarks` (`574ac0c`) |
| 1e | +58 slug · **80** landmark · nature/adventure **68/134** · `merge-globe-landmarks-1e.cjs` |
| 1f | `mount-fuji` 7-frame `keyframes` · `tourReady` |
| 1h | `globeStandardBasemap.js` — 유효 `setConfigProperty`만 · urban 투어 시 icons+labels+`show3dLandmarks` |
| — | 파리 center 에펠·센 강 · bright invalid config 키 제거 (`language`, `showRoadsAndTransit` 등) |
| **gateo-first** (`ef0736b`) | bright 홈 Mapbox 지명 off 시험 — 이후 복원·정책 통합으로 대체 |
| **지명 SSOT** | [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) — `STANDARD_HOME_*` · satellite 레이어 줌 범위 · `globeTourUi` 투어 종료 시 HOME_CONFIG 재적용 제거 |

## 콘솔 (테마 전환)

| 메시지 | 판단 |
|--------|------|
| `Unable to perform style diff: Unimplemented: setStyle/setSprite…` | satellite ↔ Standard 전환 시 **정상 경고** — 무시 가능 |
| `Cutoff is currently disabled on terrain` | Mapbox 3D 지형 **내부 로그** — 무시 가능 |
| `Style is not done loading` (Uncaught) | `ef0736b` 가드로 완화 — 로컬 QA **이상 없음** 확인 |

## QA

- **1d Pass**: 칸쿤·사파·흐바르 해변·산맥 포커스.
- **bright gateo-first**: 로컬 — 지명·행정 정리 · gateo 마커 정상 · deep 전환 OK (`ef0736b` 푸시).
- **지명 QA**: 우주 뷰 Mapbox 지명·Standard 랜드마크 잔존 → `forceHideMapboxLayer`(줌 22–24) + 투어 UI 수정. 눈 OFF 시 줌 3+에서도 Mapbox 숨김 확인.
- **1g 대기**: gateo.kr 스모크 · 2D 복귀 · Skip · 모바일 · 후지산 keyframe · bright 파리 urban 투어 랜드마크.

## 다음 세션

→ **1g gateo.kr 스모크** → Pass 시 Phase 1 완료 · 후순위 nature/adventure 잔여 ~66 slug `globeLandmarks`.
