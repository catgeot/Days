# 2026-07-19 프로젝트 일지

**직전**: [`2026-07-12-project-log.md`](./2026-07-12-project-log.md)

---

## E2E Health 워크플로 실패 원인·수정

**상태**: ✅ 로컬 검증 통과 · 커밋 대기

- **증상**: E2E Health #32~#41 (2026-07-09~18) 매일 실패 · Smoke는 정상
- **원인**: `25569df`에서 위키 탭 UI를 「여행 위키」→「여행 스케치」로 변경했으나 `e2e/place.spec.js`가 옛 라벨을 계속 조회
- **수정**: `e2e/place.spec.js` 기대값을 「여행 스케치」로 갱신
- **검증**: `SMOKE_SITE_URL=https://gateo.kr npx playwright test e2e/place.spec.js` → 1 passed
- **재발 방지 문서**: `site-health-monitoring-plan.md` §2-B-1 · operator next-steps · `.ai-context` 헬스 절

---

## 장소카드 국가명 진입 경로 불일치

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시

- **증상**: 검색 진입 시 국가명 정상 → 동일 마커 재클릭 시 `Global`/`Explore` · 갤러리·플래너 불일치
- **원인**: Mapbox GeoJSON 히트에 `country` 없음 + `uiPlace` 좌표 매칭 시 placeholder 국가 미보강 + resolve 시 `name`이 `slug`보다 우선
- **수정**: `hydrateMarkerFromSpotCatalog` · `mergeCanonicalTravelSpot` placeholder 보강 · slug-first resolve · 탐색 `navigateToPlace` · 재진입 country coalesce
- **후속**: 구세션 잔존 Global — `healPlaceholderCountry` · place cache v2 + v1 purge · temp 핀 국가 자가치유
- **검증**: node 스크립트 ALL PASS · 사용자: 신규 검색 후 마커 국가명 일치 확인

### 다음 세션 — 플래너 지리 검증 / 살타(salta)

**재현**: 살타 검색 → 카드 닫기 → 마커 클릭(한때 Global) → 플래너 실행  
**콘솔**: `place_id는 일치하나 지리 검증 실패 — 레거시 행 폴백` · `빈/불일치 툴킷 무시` · `hasGuide: false` · Edge 갱신 후에도 검증 실패 반복  
**의심**: `essentialGuideMatchesLocation` / `isIataPlausibleForLocation` vs SLA·살타 좌표·허브 반경 · Global 상태에서 생성된 툴킷 IATA 오염 가능
