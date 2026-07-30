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

## 다음 세션 — 에이전트 핸드오프

**제시어**: `MRT-읍면-county감사-이어하기`

| | |
|--|--|
| 계획 | [`mrt-stay-admin-gap-audit-plan.md`](./mrt-stay-admin-gap-audit-plan.md) |
| 목표 | 국내 SSOT에 대해 **읍·면 + county 공백** 감사 스크립트 (Phase 0 = 감사만) |
| 선행 | #32 county 있을 때 시·군 우선 ✅ · 잔여 = county 빈 핀 |
| 읽을 것 | `.ai-context` 1·3·4 · 본 일지 · plan §1~§5 · `mrtStayQuery.js` fineGrain/township |
| 금지 | UI · 전국 override 추측 삽입 · Nominatim 폭주 · `travelSpots.js` 전체 스캔 |

**Cloud 붙여넣기**

```text
MRT-읍면-county감사-이어하기

@.ai-context.md
@plans/mrt-stay-admin-gap-audit-plan.md
@plans/2026-07-30-project-log.md

Phase 0: 국내 SSOT «읍·면 + county 공백» 감사 스크립트.
plan §1~§5 · 감사 결과 표만 · 보강은 보고 후.
VERIFY 후 커밋·push.
```
