# 2026-07-27 프로젝트 일지

직전: [`2026-07-26-project-log.md`](./2026-07-26-project-log.md)

## 국내축제 — S5 B 테마·지역 색인 (`국내축제-S5-Cloud`)

**상태**: ✅ 코드·커밋·푸시 `bab6937` · audit/smoke PASS · 사람 QA 대기 · 브랜치 `cursor/korea-festival-proxy`

| 산출 | |
|------|--|
| 지역 | `festivalRegionTags.js` — addr1 시도(≥2) → 시/군 칩 · corridor 미사용 |
| 테마 | `festivalTasteTags` — 빙어·썸머·도자기·술 등 확장 · 결과 title ≥2 |
| UI | `/korea` 헤더 칩 · 필터→지도·색인 리스트 · X=전국+칩 해제 |

**VERIFY**: `npm run audit:korea-area-codes` · `npm run smoke:korea-area-codes`

**에이전트 B QA** (`http://127.0.0.1:5174/korea` · 지금 탭): 시도칩→색인 리스트 · 경기→수원시≥2 · 테마(문화) 축소 · X=전국+칩 해제 · corridor 없음. **픽스**: `서울특별시`/`○광역시` 시·군 칩 오탐 스킵.

**B+**: 리스트 제목=선택 칩명 · PC 좌측/모바일 상단 연관 플랩(하위 city · 인근 sido∩결과 · 테마 형제). 시·군 좌표 인근·플랩 애니 = 문서만.

**벨트·축제로드 (문서만)**: 「지금」 서울 역C·동해안→내륙 C자 등 **형상 패턴 목록+점선 지도**. 헤더 corridor 칩 아님 · C 이후/D 후보. 계획서 S5 「벨트 · 축제로드」.

**다음**: 사람 B/B+ QA 확정 → C 즐겨찾기. releaseNotes·hub 신설·corridor 부활 금지.

**제시어 (사람 QA 후 C)**

```
국내축제-S5-C
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-27-project-log.md 「국내축제 — S5 B」절만
브랜치 cursor/korea-festival-proxy. C 즐겨찾기·본 항목. A·B 회귀 금지. releaseNotes 금지.
```

## 국내축제 — S5 B UI 조율 (헤더 대분류·리스트·뒤로)

**상태**: ✅ 사람 Preview QA OK · tip `714e948` · Draft PR #29 · `cursor/korea-festival-proxy` · **세션 종료**

| 변경 | 내용 |
|------|------|
| 헤더·여백·뒤로·가림 | `c1cbb7b`~`23b7714` |
| 리스트 레이아웃 | 개방형 스크림 + 헤더 아래 모달 (풀스크린 불투명 복구 `b2a43e4`) |
| 라이트 톤 | 헤더·칩·리스트·**상세 시트** 화이트 · 사람 OK (`549cf19`→`714e948`) |
| Cloud 규칙 | `AGENTS.md` — feature Cloud는 오류 없으면 Vercel Preview용 커밋·push |

**세션 종료**: working tree clean · PR https://github.com/catgeot/Days/pull/29  
**다음**: S5-C 즐겨찾기·본 항목. A·B 회귀 금지. releaseNotes·hub 신설·corridor 부활 금지.

**제시어 (다음 = S5-C)** → 아래 「S5 C」절.

## 국내축제 — S5 C 즐겨찾기·본 항목·검색 (`국내축제-S5-C`)

**상태**: ✅ 코드·VERIFY · Preview 조율 일부 OK · tip `70973fa` · Draft PR #29 · **세션 종료**

| 산출 | |
|------|--|
| 저장 | `festivalPersonalStore.js` — favorites/viewed localStorage |
| 검색 | `festivalSearch.js` — title·addr1 · 헤더 돋보기 |
| UI | ★ 토글 · 내 목록·시도 그룹 · 검색/내주변 **닫기** |
| 픽스 | 검색 닫기(`17a4022`) · 내주변 닫기+반경문구 리스트 부제(`70973fa`) |
| smoke | `npm run smoke:korea-festival-personal` |

**VERIFY**: `smoke:korea-festival-personal` · `audit:korea-area-codes` · `smoke:korea-area-codes`

**사람 확인**: 검색·내주변 닫기·반경 안내 가림 수정 확인. **추가 테스트·수정은 다음 세션**.

## 국내축제 — S5 C Preview QA (지역 칩·그룹)

**상태**: ✅ 코드·VERIFY · tip `077f374` · Draft PR #29 · **사람 Preview QA 대기**

| 변경 | 내용 |
|------|------|
| 헤더 | **이전 대분류 체계 유지**(지금/전체/테마 접기) — 헤더 변경 철회 |
| 지도 선택 | 「지금」+클러스터 모달 리스트에 **지역** 칩(선택 시도+인근) · 교차 탐색 |
| 모달 리스트 | 색인·지도 선택도 `groupFestivalsBySido` **지역별 구분** 나열 |
| 헬퍼 | `buildMapFocusRegionChips` · smoke 보강 |
| 상세 시트 | `nearbyHubsForFestival` — 좌표·addr1 기준 인근 hub · **고정 defaultHub 추천 제거** |
| 초기 안내 | 헤더+지도만일 때 「오늘 축제 지역입니다」·지역 선택·내 주변 CTA |

**VERIFY**: `smoke:korea-festival-personal` · `audit:korea-area-codes` · `smoke:korea-area-codes`

**QA**: `/korea` → 축제 상세 → 「인근 여행지」가 해당 축제 지역/좌표 기준인지 · 모달 리스트 시도 구분 · 지도 선택 지역칩.

**다음**: 사람 Preview QA OK → S5-D. releaseNotes·hub 신설·corridor 부활 금지.

**제시어 (이어하기)**

```
국내축제-S5-C-이어하기
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-27-project-log.md 「국내축제 — S5 C Preview QA」절만
브랜치 cursor/korea-festival-proxy · PR #29.
C Preview 테스트·수정 이어가기. A·B 회귀 금지. D는 C QA OK 후. releaseNotes 금지.
```
