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

**상태**: ✅ tip `72be1f5` · PR [#34](https://github.com/catgeot/Days/pull/34)

| | |
|--|--|
| 배경 | §5.1 LIVE 123건 — OSM village→`city=○○리`+county인데 keyword가 리 선두 |
| 조치 | `KO_TOWNSHIP_RE`=/[읍면리]$/ · county 있을 때 군 선두(stay+TNA) · audit `kw_ri_leading` |
| VERIFY | smoke stay 22 · tna 12 · 샘플 이평리→`보은군` · 대화리 회귀 |
| 브랜치 | `cursor/mrt-city-ri-keyword-8077` (base: audit Phase 0 / #33) |
| 금지 준수 | slug override 남발 없음 · UI 없음 |

**파일**: `mrtStayQuery.js` · `mrtTnaQuery.js` · smoke 2종 · `audit-mrt-stay-admin-gaps.mjs` · plan §5.2

## 검색「대화리」→ 천안 숙소 오탐

**상태**: ✅ tip · PR [#35](https://github.com/catgeot/Days/pull/35) · **제품상 임시**(다음=다후보)

| | |
|--|--|
| 증상 | 검색「대화리」진입 → 숙소가 **천안** 목록 |
| 원인 | Nominatim/Mapbox가 **천안시 대화리**를 1순위 · `originalQuery=대화리`가 keyword 선두 |
| 조치(임시) | 군·면 스코어·별칭으로 평창 쪽 완화 · stay `originalQuery` 세밀명→군 래더 뒤 |
| GPS | 현재위치 대화리 → **평창** 정상 (단일 좌표라 OK) |

**사람 결정 (다음 세션)**: 평창·천안 **어느 쪽도 자동 우선 금지**. 검색 시 **지역 명시 다후보**  
예: `대화리 · 평창군` / `대화리 · 천안시` (천안은 **시**).  
계획: [`ko-homonym-ri-search-disambiguation-plan.md`](./ko-homonym-ri-search-disambiguation-plan.md)

**파일**: `geocoding.js` · `mrtStayQuery.js` · smoke stay  
**브랜치**: `cursor/fix-daehwa-ri-search-cheonan-8077`

## 동명 리 검색 — 지역 명시 다후보

**상태**: ✅ tip `9ee46a4` · PR [#36](https://github.com/catgeot/Days/pull/36) · 사람 Preview QA 대기

| | |
|--|--|
| 제품 | 「대화리」→ `대화리 · 평창군` / `대화리 · 천안시`(+충주·김제) 선택 카드 · **단독 자동 진입 금지** |
| 구현 | `koHomonymRiSearch.js` · `useHomeHandlers` early disambiguation |
| #35 정리 | 평창 강제 별칭·군 스코어 가산 **제거** · stay `originalQuery` 세밀명→군 뒤 **유지** |
| VERIFY | `smoke:ko-homonym-ri-search` (+ LIVE) · `smoke:mrt-stay` · `smoke:mrt-tna` |
| 계획 | [`ko-homonym-ri-search-disambiguation-plan.md`](./ko-homonym-ri-search-disambiguation-plan.md) |

**QA**: Preview 검색「대화리」Enter → 지역 라벨 카드 ≥2 · 평창/천안 각각 선택 후 숙소 · GPS 대화리→평창 회귀

**브랜치**: `cursor/ko-homonym-ri-disambiguation-1ed8` · tip `9ee46a4`

## 동명 검색 확장 — Phase 0 표 · `동` 연결

**상태**: ✅ tip `de88f69` · PR 대기 · Preview QA

| | |
|--|--|
| audit | `audit:ko-homonym-expand` · LIVE LIMIT=40 · `search_dictionary` 53 (Secrets OK) |
| 후보 풀 | ~899 (SSOT+시드+dict) · NEED_DISAMBIG 18/40 |
| **결정** | **확장 O = `동`** · bare는 hub exact 우선·비허브 NEED만 후속 화이트리스트 |
| 구현 | `isKoHomonymPlaceSearchQuery`(+동) · `collectKoHomonymPlaceCandidates` · hub exact 뒤 |
| #36 회귀 | 대화리 LIVE 평창·천안 유지 · `isKoHomonymRiSearchQuery` 읍면리만 |
| VERIFY | `smoke:ko-homonym-ri-search` (+ LIVE 대화리·대화동) · `smoke:mrt-stay` · `smoke:mrt-tna` |
| 계획 | [`ko-homonym-search-expand-plan.md`](./ko-homonym-search-expand-plan.md) |

**QA**: Preview 「대화동」→ `대화동 · 대전광역시` / `대화동 · 고양시` · 「대화리」회귀 · 「제주」등 bare는 hub 경로 유지

**브랜치**: `cursor/ko-homonym-search-expand-d255` · tip `de88f69`

## 동명 bare 화이트리스트 — 남양·신촌

**상태**: ✅ tip `e9f5e7d` · PR [#37](https://github.com/catgeot/Days/pull/37) · Preview QA 대기

| | |
|--|--|
| 시드 | `KO_HOMONYM_BARE_WHITELIST` = **남양** · **신촌** (비허브 NEED만) |
| 제외 | 고성·광주·강북·강서·강진 등 **hub exact** · 전 bare 개방 금지 |
| 제품 | hub/정착지 exact **뒤** · `남양 · 사천시`/`홍성군`… · `신촌 · 서울특별시`/`영광군` |
| VERIFY | smoke (+ LIVE 남양·신촌·고성 place empty) · mrt stay/tna |
| 수정 | Enter `requireChoice`가 prefix「남양→남양주」보다 **지역 다후보 우선** (`useHomeHandlers`) |
| 계획 | [`ko-homonym-search-expand-plan.md`](./ko-homonym-search-expand-plan.md) §4 |

**QA**: Preview 「남양」✅ 지역 카드(사천·홍성·고흥·울릉+시설) · 잔여 Preview는 아래 VERIFY 절

**사람 결정**: Nominatim 시설 후보(초등학교·하행 등)도 **유지** — 사용자가 시설을 고를 수 있음 · 트리지 않으면 필터 불필요

**브랜치**: `cursor/ko-homonym-search-expand-d255` · tip `3b345d8`

## 동명 잔여 QA — 에이전트 VERIFY

**상태**: ✅ 에이전트 VERIFY · ⏳ 사람 Preview 잔여 · **머지 보류**(사람 OK 전)

| 케이스 | 에이전트 | 기대 |
|--------|----------|------|
| 신촌 | LIVE smoke ≥2 · `신촌 · 서울특별시`/`영광군` | Preview Enter 지역 카드 |
| 대화리 | LIVE ≥4 · 평창·천안 포함 | Preview Enter 다후보 |
| 대화동 | LIVE · 대전·고양 | Preview Enter 다후보 |
| 제주/고성 | hub exact · place path **false** · curated Enter hub 카드 | Preview hub「도시와 명소」 |
| GPS 대화리→평창 | `smoke:mrt-stay`/`tna` `pyeongchang-daehwa-ri` · kw=평창군 | Preview 숙소·투어 일산 아님 |
| 남양·시설 | 사람 ✅ · 시설 유지 | — |

**VERIFY**: `KO_HOMONYM_RI_LIVE=1 npm run smoke:ko-homonym-ri-search` · `smoke:mrt-stay` · `smoke:mrt-tna`  
**Preview**: https://days-git-cursor-ko-homonym-search-expand-d255-catgeots-projects.vercel.app (Vercel SSO · 에이전트 브라우저 불가)  
**PR**: [#37](https://github.com/catgeot/Days/pull/37) draft · tip `4391a41` · #36 tip 포함

### Preview 콘솔 403 (2026-07-30)

사람 보고: Mapbox satellite/streets **403** · Summarizer/tp/ads 노이즈.

| | |
|--|--|
| 원인 | `VITE_MAPBOX_TOKEN` **URL 제한** — `www.gateo.kr`·**브랜치 alias**(`days-git-…-d255-….vercel.app`) = 200 · 배포 해시(`days-<hash>-catgeots-projects.vercel.app`) = **403** |
| 비관련 | Summarizer 언어 · PerformanceObserver · doubleclick 400 · `[tp] emerald` `get` — 제3자/브라우저 |
| 조치(사람) | Preview는 **git 브랜치 URL**로 진입 · 또는 Mapbox 토큰에 `https://*.vercel.app` / `https://days-*-catgeots-projects.vercel.app` 허용 추가 |
| 코드 | 동명검색 tip과 무관 · PR 수정 불필요 |

## 다음 세션 — 에이전트 핸드오프

**제시어**: `동명검색-잔여QA-머지-이어하기` (사람 Preview OK 후 = 머지)

| | |
|--|--|
| 목표 | 사람 Preview 잔여 OK → PR [#37](https://github.com/catgeot/Days/pull/37) draft 해제·**main 병합** |
| 사람 QA | Preview: 신촌 · 대화리 · 대화동 · 제주/고성 hub · (선택) GPS 대화리→평창 |
| 완료분 | 남양 ✅ · 시설 유지 · **에이전트 LIVE/smoke VERIFY ✅** |
| 금지 | UI 리디자인 · 단독 우선 · 전 bare 패턴 · 시설 후보 필터 · 사람 OK 전 머지 |

**Cloud 붙여넣기** (사람「잔여 OK / 머지」후)

```text
동명검색-잔여QA-머지-이어하기

@.ai-context.md
@plans/ko-homonym-search-expand-plan.md
@plans/2026-07-30-project-log.md

PR #37 잔여 Preview 사람 OK. draft 해제·main 병합.
전 bare 개방·시설 필터 금지. tip VERIFY 유지.
```
