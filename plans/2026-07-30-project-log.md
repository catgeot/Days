# 2026-07-30 프로젝트 일지

직전: [`2026-07-29-project-log.md`](./2026-07-29-project-log.md)

## MRT 숙소·투어 — 평창 대화리 → 고양/일산 오탐

**상태**: ✅ 로직 수정 · LIVE 스모크 PASS · feature 브랜치

| | |
|--|--|
| 증상 | GPS「평창군 대화면 대화리」현재위치 → 숙소·투어가 고양/일산 대화동 |
| 원인 | OSM `town=대화면`이 stayAdmin.city · 축약「대화」가 MRT 일산 대화와 동명 · `리`는 fineGrain 미포함 |
| 조치 | 국내 읍·면·리 → **시·군 우선** · county 있을 때 면 축약「대화」를 keyword/cityHints 제외 · TNA 평창 인근 SSOT |
| VERIFY | `smoke-mrt-stay` / `smoke-mrt-tna` (+ LIVE) · 숙소 `region=한국, 강원` · 투어 `used=평창` |

**QA**: 지구본 현재위치(대화리) → 숙소찾기·투어찾기 · 고양/일산 목록이 아니어야 함

**파일**: `mrtStayQuery.js` · `mrtTnaQuery.js` · smoke 2종  
**tip**: `41ca94f` · PR [#32](https://github.com/catgeot/Days/pull/32)
