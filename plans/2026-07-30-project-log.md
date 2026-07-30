# 2026-07-30 프로젝트 일지

직전: [`2026-07-29-project-log.md`](./2026-07-29-project-log.md)

## MRT 숙소·투어 — 평창 대화리 → 고양/일산 오탐

**상태**: ✅ `main` 머지·푸시 · 사람 QA OK

| | |
|--|--|
| 증상 | GPS「평창군 대화면 대화리」현재위치 → 숙소·투어가 고양/일산 대화동 |
| 원인 | OSM `town=대화면`이 stayAdmin.city · 축약「대화」가 MRT 일산 대화와 동명 · `리`는 fineGrain 미포함 |
| 조치 | 국내 읍·면·리 → **시·군 우선** · county 있을 때 면 축약「대화」를 keyword/cityHints 제외 · TNA 평창 인근 SSOT |
| VERIFY | `smoke-mrt-stay` / `smoke-mrt-tna` (+ LIVE) · 숙소 `region=한국, 강원` · 투어 `used=평창` |

**QA**: 지구본 현재위치(대화리) → 숙소찾기·투어찾기 · 고양/일산 목록이 아니어야 함 · 사람 확인 OK

**파일**: `mrtStayQuery.js` · `mrtTnaQuery.js` · smoke 2종  
**tip**: `02bc8c6` (merge) · PR [#32](https://github.com/catgeot/Days/pull/32) MERGED

## MRT 읍·면+county 공백 감사 — Phase 0

**상태**: ✅ 스크립트·LIVE 샘플 · tip `d14649c` · PR [#33](https://github.com/catgeot/Days/pull/33)

| | |
|--|--|
| 추가 | `scripts/audit-mrt-stay-admin-gaps.mjs` · `npm run audit:mrt-stay-admin-gaps` |
| LIVE | `MRT_ADMIN_GAP_LIVE=1` · 정착지 읍·면 우선 340 |
| **RISK_TOWNSHIP_NO_COUNTY** | **0** |
| 참고 | township+county OK 87 · city=리+county 123(keyword 리 선두 잔여) · city=시·county∅ 129 |
| 표 | plan §5.1 |

## MRT city=리 keyword 군 선두 — Phase 1 (§5.1 후속)

**상태**: ✅ 로직·smoke · PR 대기

| | |
|--|--|
| 배경 | §5.1 LIVE 123건 — OSM village→`city=○○리`+county인데 keyword가 리 선두 |
| 조치 | `KO_TOWNSHIP_RE`=/[읍면리]$/ · county 있을 때 군 선두(stay+TNA) · audit `kw_ri_leading` |
| VERIFY | smoke stay 22 · tna 12 · 샘플 이평리→`보은군` · 대화리 회귀 |
| 브랜치 | `cursor/mrt-city-ri-keyword-8077` (base: audit Phase 0) |
| 금지 준수 | slug override 남발 없음 · UI 없음 |

**파일**: `mrtStayQuery.js` · `mrtTnaQuery.js` · smoke 2종 · `audit-mrt-stay-admin-gaps.mjs` · plan §5.2

## 다음 세션 — 에이전트 핸드오프

**제시어**: (선택) 미캐시 정착지 LIVE · hub/명소 샘플

| | |
|--|--|
| 계획 | [`mrt-stay-admin-gap-audit-plan.md`](./mrt-stay-admin-gap-audit-plan.md) §5.1–§5.2 |
| 잔여 | 미캐시 정착지 288 · hub/명소 LIVE · GPS 비SSOT(대화리류는 #32+#Phase1) |
| 금지 | UI · 전국 override 추측 · Nominatim 폭주 · `travelSpots.js` 전체 스캔 |
