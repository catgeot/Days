# 국내 MRT 숙소·투어 — 읍·면 + county 공백 감사

**상태**: ✅ Phase 0 완료 · ✅ Phase 1 city=리 keyword 군 선두  
**제시어**: `MRT-읍면-county감사-이어하기` · `plan §5.1 보고 city=리 keyword 보강`  
**일지**: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)  
**선행**: PR [#32](https://github.com/catgeot/Days/pull/32) — 평창 대화리→일산 대화 오탐 · **county 있을 때** 시·군 우선 ✅  
**VERIFY**: `npm run audit:mrt-stay-admin-gaps` · `node scripts/smoke-mrt-stay-queries.mjs` · `node scripts/smoke-mrt-tna-queries.mjs`  
**LIVE(선택)**: `MRT_ADMIN_GAP_LIVE=1 MRT_ADMIN_GAP_SOURCES=settlements MRT_ADMIN_GAP_LIMIT=340`

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

- [x] `npm run audit:mrt-stay-admin-gaps` (또는 문서화된 node 명령) 실행 가능
- [x] `RISK_TOWNSHIP_NO_COUNTY` 건수·샘플이 일지/stdout에 남음
- [x] 후속 보강은 **별도** — 사람 확인 전 대규모 keyword override 남발 금지
- [x] 한글 커밋 · Cloud면 push·PR(또는 main 직행은 짧은 스크립트면 OK)

### 5.1 Phase 0 LIVE 결과 표 (정착지 · 읍·면 우선 340건 캐시)

| 플래그/버킷 | 건수 | 비고 |
|-------------|------|------|
| **RISK_TOWNSHIP_NO_COUNTY** | **0** | city=`/[읍면]$/` · county 공백 — **해당 없음** |
| RISK_FINE_NO_CITY | 0 | fine 동읍면리 · city·county 약함 |
| kw_township | 0 | 1차 keyword가 읍·면/축약 — township+county 시 **군 선두** |
| township+county OK | 87 | #32 경로 (예: 봉화읍→keyword `봉화군`) |
| city=리 + county | 123 | OSM village→city · county 있음 · **보강 전** keyword 리 선두 |
| city=시 · county 공백 | 129 | 시 단위 · 면은 display만 |
| city=광역시/특별시 | 22 | |
| SSOT 읍·면 이름 후보 | 335 | 정착지 `^[가-힣]{2,}[읍면]$` |
| 미캐시 정착지 | 288 | 비읍·면·동 등 · 필요 시 LIVE 이어가기 |

**해석 (보강 전)**: SSOT 읍·면 정착지 좌표를 Nominatim reverse하면 **읍·면이 city일 때 county가 비는 케이스(본 RISK)는 0**. 잔여 관심은 (1) GPS/비SSOT 핀(대화리류) (2) **city=리 + county**인데 keyword가 리인 사다리.

### 5.2 Phase 1 — city=리 keyword 군 선두

| | |
|--|--|
| 대상 | §5.1 `city=리 + county` (예: 보은읍 좌표 → city=`이평리` · county=`보은군`) |
| 조치 | `KO_TOWNSHIP_RE`에 **리** 포함 — county 있을 때 **군 선두**(읍·면과 동일 경로) · stay+TNA |
| 금지 | slug별 keyword override 대량 삽입 · UI |
| VERIFY | smoke: `boeun-ipyeong-ri-city` · `boseong-beolgyo-ri-city` · 대화리 회귀 · audit `kw_ri_leading` |
| 파일 | `mrtStayQuery.js` · `mrtTnaQuery.js` · smoke 2종 · audit `kw_ri_leading` |

**기대**: `kw_ri_leading=0` (캐시 재분석 시) · 1차 keyword=`○○군`.

---

## 6. 하지 말 것

- UI 변경 · 릴리스 노트
- county 공백을 추측으로 전국 override 대량 삽입
- Nominatim 병렬 폭주
- `travelSpotAirports.json` spots 직접 수정과 무관한 범위 확장

---

## 7. Cloud 붙여넣기 제시어

```text
plan §5.1 보고 city=리 keyword 보강

@.ai-context.md
@plans/mrt-stay-admin-gap-audit-plan.md
@plans/2026-07-30-project-log.md

Phase 1: city=리+county → keyword 군 선두 (#32 읍·면과 동일).
전국 override 금지 · smoke+audit VERIFY 후 커밋·push.
```
