# 2026-07-21 프로젝트 일지

이전: [`2026-07-20-project-log.md`](./2026-07-20-project-log.md)

## 지구본 — 몰입 버튼·포커스 자전 지연

**상태**: ✅ 코드 · 릴리스 노트 · 커밋·푸시 · **줌 8.5(시가지) 추가 조정**

- 카드 오픈은 `flyZoom` 지향만 유지(자동 깊은 확대 없음). 플라이 후 자전 재개 **~2.8초** 지연.
- 써머리 액션「이 지역 보기」↔「넓게 보기」(`immerseZoom` **8.5** · pitch 35). 닫기·장소 전환·투어/시네마 시 몰입 해제.
- 조절바는 도입하지 않음(고정 몰입 줌).

### 몰입·항공 버튼 이슈

**상태**: ✅ 코드 · QA 통과 · 커밋·푸시

- 채팅 닫은 뒤 「이 지역 보기」무반응 — `immerseToPin` **pause 가드 제거** · 잔여 `tourActiveRef` 정리 · `wakeAfterOverlay`
- 줌마다 「항공 경로」준비 중 — **레이어 latch** · 폴링에서 `isStyleLoaded` 제거 · flight label POI 제외

## 홈 검색 — POI 포커스 + 그 지점 숙소

**상태**: ✅ 코드 · 릴리스 노트 반영 · 커밋·푸시

- **증상**: 성산일출봉→제주/서귀포 · 신라호텔→시청 · 대명콘도 숙소→부산
- **조치**: 검색 SSOT 엄격 · 테마 후순위 · uiPlace 풀머지 금지 · 숙박 별칭 geocode · 시청 교정 거부 · 숙소 `비발디파크`+`홍천` cityHints
- **릴리스 노트**: `2026-07-21` 「검색으로 세부 장소까지 찾고, 그곳 숙소도 볼 수 있어요」

## MRT 숙소 — 일부 여행지 빈 결과·미매칭

**상태**: ✅ 클라·Edge 수정 · Edge 재배포 · LIVE QA 통과

- **증상**: 하와이·괌·발리·사이판 등에서 숙소 없음/호출 실패처럼 보임. MRT에는 재고 있음.
- **원인**
  1. `countryMatches` `startsWith` — `인도네시아`↔`인도` 오탐(발리→라자스탄)
  2. gateo 영토 국가(`하와이`) vs MRT head(`미국, 하와이`) 불일치
  3. `북마리아나 제도`↔`북마리아나제도` 공백
  4. 괌 키워드→망길라오(재고 0) · 발리 동명 · 파타고니아 박물관 POI
  5. 일부 지역 `totalCount>0`인데 `productUrl` 없어 items 전부 탈락(레위니옹·바릴로체 등) — Edge 매핑 폴백
- **조치**: `mrtStayQuery.js` 국가 별칭·slug 키워드 오버라이드 · 캐시 `v9` · Edge compact/세그먼트 매칭·startsWith 제거·URL 합성 · `scripts/smoke-mrt-stay-queries.mjs`
- **배포**: `npx supabase functions deploy fetch-mrt-stays --project-ref phdjnbfitvmrguqzverm --no-verify-jwt` ✅ (2026-07-21)
- **LIVE(배포 후)**: 하와이·호놀룰루·괌·발리·사이판·레위니옹·파타고니아(바릴로체)·그린란드 모두 `n>0`

### 에이전트 핸드오프

- **유지**: Summary「숙소 찾기」·펼칠 때만 fetch · `v9` · PC 포털/모바일 전체화면
- **금지**: `VITE_` MRT 키 · TripLink · 호텔 핀/지오코딩 · `travelSpots.js` 전체 스캔
- **다음(선택)**: 빈 결과 CTA
