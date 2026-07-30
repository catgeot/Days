# 국내 MRT 숙소·투어 — 읍·면 + county 공백 감사

**상태**: ⏳ Phase 0 대기 (다음 Cloud 세션)  
**제시어**: `MRT-읍면-county감사-이어하기`  
**일지**: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)  
**선행**: PR [#32](https://github.com/catgeot/Days/pull/32) — 평창 대화리→일산 대화 오탐 · **county 있을 때** 시·군 우선 ✅

---

## 0. 배경

GPS·역지오 `stayAdmin`에서 OSM `town=○○면`이 `city`로 들어오고 `county`가 비면, 면 축약(예: 대화면→「대화」)이 MRT 대도시 동명과 충돌할 수 있다.  
[#32](https://github.com/catgeot/Days/pull/32)는 **county가 있을 때**만 면 축약을 제외한다. **읍·면 + county 공백** 핀은 아직 잔여 리스크.

---

## 1. 목표 (이번 이어하기)

1. **감사 스크립트**로 국내 SSOT 좌표를 역지오(또는 기존 stayAdmin 빌드)해  
   `isKoTownship(city) && !county` 목록을 뽑는다.
2. 결과에 대해 (선택) `resolveMrtStayQuery` / `resolveMrtTnaQuery` 1차 keyword가 면·축약인지 표시.
3. 사람/다음 턴이 보강(state→군 추론·힌트 SSOT·로직)할 **후보 표**만 남긴다.  
   **이번 세션 기본 = 감사만**. 대규모 로직 수정은 표 확인 후.

---

## 2. 스캔 대상 (국내만)

우선순위 위에서부터. 전수 Nominatim은 rate limit 주의(순차·딜레이).

| 소스 | 경로 | 비고 |
|------|------|------|
| 정착지 | `src/pages/Home/data/mapboxSettlementPlaces.json` | place/city/locality · KR |
| 도시 hub | `src/pages/Home/data/cityAttractionHubs.json` | 국내 hub |
| 명소 tip | cityAttraction attractions (국내) | 샘플·배치 상한 OK |
| 여행지 list | `travelSpots-list.json` 국내 | 보조 |

**금지**: `travelSpots.js` 전체 스캔 · spots JSON 직접 수정.

---

## 3. 위험 판정 (스크립트)

`buildStayAdminFromOsmAddress` / 역지오 결과 기준:

| 플래그 | 조건 |
|--------|------|
| `RISK_TOWNSHIP_NO_COUNTY` | `city` 또는 town이 `/[읍면]$/` 이고 `county` 공백 |
| `RISK_FINE_NO_CITY` | name/neighbourhood가 `/[동읍면리]$/` 이고 city·county 둘 다 약함 |
| `kw_township` | `resolveMrtStayQuery` 1차가 읍·면·짧은 축약 |

출력: CSV/JSON + 콘솔 요약(건수·샘플 20).

---

## 4. 구현 위치 (제안)

| 항목 | 제안 |
|------|------|
| 스크립트 | `scripts/audit-mrt-stay-admin-gaps.mjs` |
| npm | `audit:mrt-stay-admin-gaps` (`package.json`) |
| 의존 | `geocoding`의 `buildStayAdminFromOsmAddress`는 브라우저 import 이슈 가능 → **로직 복제 최소** 또는 Nominatim address만으로 동일 규칙 인라인 |
| User-Agent | 기존 Nominatim과 동일 (`ProjectDays/1.0 …`) |
| LIVE | 기본 오프라인(캐시/픽스처) 가능하면 · LIVE는 `MRT_ADMIN_GAP_LIVE=1` |

기존 참고: `scripts/smoke-mrt-stay-queries.mjs` · `src/utils/mrtStayQuery.js` (읍·면·리 fineGrain).

---

## 5. 완료 조건 (Phase 0)

- [ ] `npm run audit:mrt-stay-admin-gaps` (또는 문서화된 node 명령) 실행 가능
- [ ] `RISK_TOWNSHIP_NO_COUNTY` 건수·샘플이 일지/stdout에 남음
- [ ] 후속 보강은 **별도** — 사람 확인 전 대규모 keyword override 남발 금지
- [ ] 한글 커밋 · Cloud면 push·PR(또는 main 직행은 짧은 스크립트면 OK)

---

## 6. 하지 말 것

- UI 변경 · 릴리스 노트
- county 공백을 추측으로 전국 override 대량 삽입
- Nominatim 병렬 폭주
- `travelSpotAirports.json` spots 직접 수정과 무관한 범위 확장

---

## 7. Cloud 붙여넣기 제시어

```text
MRT-읍면-county감사-이어하기

@.ai-context.md
@plans/mrt-stay-admin-gap-audit-plan.md
@plans/2026-07-30-project-log.md

Phase 0: 국내 SSOT 좌표 대상 «읍·면 + county 공백» 감사 스크립트 추가.
plan §1~§5 따르고, 감사 결과 표만 남긴 뒤 보강 로직은 결과 보고 후.
VERIFY: npm run audit:mrt-stay-admin-gaps (또는 문서 명령) PASS·요약.
커밋·push(필요 시 PR).
```
