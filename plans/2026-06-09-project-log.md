# 2026-06-09 project log

이전: [`2026-06-08-project-log.md`](2026-06-08-project-log.md)

## 홈 지구본 — 3D 투어 후 이동 가능 경계선 (Phase 1i)

- **기능**: `TOUR_READY` 직후 Mapbox Isochrone — 도보 20분(초록 점선)·차량 30분(파란 도달 영역)
- **신규**: `globeReachBoundaries.js` · `HomeGlobeMapbox` 범례·로드/클리어 · `easeCameraForReachReveal`
- **수정**: `globeMapboxLabelPolicy` — `gateo-reach-*` 지명 정책 숨김 제외
- **QA**: 다낭 로컬 Pass

## Phase 1i 시각·UX 조정

- 차량 fill 16% · 30분 · 범례 모바일 시네마 표시 · 계획 §1i 갱신

## 클룩 렌터카 홈 검색 안내 (la-reunion)

- `klookRentalHomeSearchLabel` · `audit:airports` none 0

## 홈 지구본 Phase 2~3 — 탐색 내비 · 권역 hull·POI (초안 커밋)

- **Phase 2**: `globeExploreNav.js` · `GlobeExploreNavControls` (+/−/나침반, z-70) · 줌≥3 · flyTo 3.0 · URL 카메라 복원
- **Phase 3**: `globeClusterBoundaries.js` · `getClusterMembersWithCoords` · amber hull + sibling POI · `focusSlug` / `hasPlaceSummary`
- **빌드**: `npm run build` Pass

### Phase 2 QA (미해결 — 다음 세션)

| 환경 | 관찰 |
|------|------|
| 모바일 | **+ 버튼만** 보임 |
| PC | +/−/나침반 OK · **Summary 열리면** 컨트롤 가려짐 |

**다음 세션**: 배치 SSOT · 우상단 공유/GPS/우주와 **통합·역할 분리** 합의 후 구현 — [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md) §Phase 2 · 제시어.

## 다음 (선택)

- Phase 2 UX · Phase 3 hull smoke(patagonia·iceland) · Phase 1g gateo 스모크 · 릴리스 노트 합의
