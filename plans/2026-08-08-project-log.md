# 2026-08-08 프로젝트 일지

직전: [`2026-08-07-project-log.md`](./2026-08-07-project-log.md)

## 테마여행 #77, 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#73](https://github.com/catgeot/Days/pull/73) · Preview 사람 QA 대기

- **증상**: 양양 명승 홈 GATEO 선정 명소 0건 → 탐색 끊김 (hub attractions는 있으나 curated SSOT 미등재 · 낙산사는 속초 hub)
- **한 일**: 낙산사 hub/선정을 양양으로 이전 · 서피·하조대·낙산·설악 해수욕장 선정 추가(101) · Tour 썸네일 · `/qa/scenic-yangyang`
- **이어서**: 선정 **수량 상한 해제** · 빈 hub 리포트/`draft`/`smoke:korea-scenic-hub-fill` · 큐 [`korea-scenic-hub-fill-queue.md`](./korea-scenic-hub-fill-queue.md) 15라운드(빈 121)
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-yangyang`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=yangyang`
- **작업 로그**: 「양양 GATEO 선정 명소 5곳」·「선정 상한 해제·권역 보강 큐」
- **남은 일**: 큐 R01(평창·남해)부터 배치 보강 · 사람 Preview QA
- **다음 채팅명**:

```
테마여행 #78, 빈 hub 명소 보강
```

## 테마여행 #76, 상세 가로 스크롤

**상태**: feature `cursor/scenic-detail-overflow-3f84` · PR [#72](https://github.com/catgeot/Days/pull/72) · Preview 사람 QA 대기

- **증상**: 관광지「낙산도립공원」본문 아래 세로 스크롤 시 좌우 롤링(가로 넘침)
- **원인**: TourAPI `입산통제 구간` 등에 긴 URL·공백 없는 토큰 → `break-keep`만으로는 줄바꿈 불가 · 스크롤 영역 `overflow-x` 미차단
- **유사**: 도립/국립공원 info의 URL·긴 등산로명(예: 덕유산 종주코스 문자열) · 코스 모달 overview도 동일 패턴
- **한 일**: `ThemeSpotDetailModal` DetailRow·스크롤에 `break-words`+`overflow-x-hidden` · `CourseDetailModal` 동일 · QA `/qa/scenic-detail-overflow`
- **VERIFY**: `npm run smoke:theme-detail-text-overflow` · `npm run build` · 로컬 Preview 낙산도립공원 입산통제 URL 줄바꿈·가로 스크롤 없음
- **공유**: `https://www.gateo.kr/qa/scenic-detail-overflow`
- **Preview**: `https://days-git-cursor-scenic-detail-overflow-3f84-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「관광지 상세 가로 롤링 방지」
- **QA(사람)**: 명승홈→검색/관광지「낙산도립공원」→본문 아래(입산통제) 세로 스크롤 · 좌우 롤링 없음

## 테마여행 #75, 빈 hub 선정 칩 숨김

**상태**: main 반영 완료 · PR [#70](https://github.com/catgeot/Days/pull/70) · [#71](https://github.com/catgeot/Days/pull/71)

- **증상**: 비와야 폭포→인근「양양 명승지」진입 시 GATEO 선정 명소가 0건인데도 수도권·강원·강릉 등 분류칩+수량이 표시되어 혼란
- **원인**: `showCuratedFilterChips`가 비검색 시 항상 true → hub 빈 목록에도 권역·타 여행지 칩 노출
- **한 일**: hub 선정 명소 0건·비검색이면 선정 분류칩 숨김 · 빈 목록 시 「골랐습니다」 소개 숨김 · 안내 문구 정리 · 명소·명승·관광지 제목 아이콘(Landmark/Mountain/MapPin)으로 구분
- **VERIFY**: `npm run smoke:korea-scenic-search` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-empty-chips` → PROD
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 「분류칩 숨김」·「문구 정리」·「제목 아이콘」·「main 반영」
- **QA(사람)**: PROD 명승홈·양양 hub → GATEO 칩·「골랐습니다」 없음 · 세 제목 아이콘 구분

## 테마여행 #74, 인근여행지 검색 잔존

**상태**: feature `cursor/scenic-search-clear-f5a5` · PR [#69](https://github.com/catgeot/Days/pull/69) · Preview 사람 QA 대기

- **증상**: 명승홈 검색(비와야)→본문→인근「양양 명승지」클릭 시 검색 모달에 「비와야」잔존·빈 결과로 탐색 끊김
- **원인**: `ScenicPage` 검색 state가 마운트 유지된 채 hub URL만 바뀜 → 검색 모달+hub 필터로 Tour/선정 0건
- **한 일**: 인근 hub 이동 시 `clearScenicSearch` navigate state → 명승 홈에서 검색 필터·모달 해제
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-search-clear`
- **Preview**: `https://days-git-cursor-scenic-search-clear-f5a5-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「인근 여행지→검색 모달 잔존 해제」
- **QA(사람)**: 명승홈→검색 비와야→비와야 폭포→인근 양양 명승지 → 양양 목록(검색 모달 없음)

## 테마여행 #73, 인근여행지 홈 스크롤

**상태**: feature `cursor/scenic-home-scroll-8482` · PR [#68](https://github.com/catgeot/Days/pull/68) · 로컬 QA OK · Preview 사람 QA 대기

- **증상**: 관광지 본문 「인근 여행지」(비와야 폭포→양양 명승지) 클릭 시 양양 명승 홈 상단이 아니라 관광지 리스트 중간으로 착지
- **원인**: 같은 `ScenicPage`가 마운트 유지된 채 hub URL만 바뀌어 `mainScrollRef.scrollTop`이 이전 목록 위치로 남음
- **한 일**: hub·region·area 변경 시(분류칩 pin 없을 때만) 본문 스크롤 0으로 리셋
- **VERIFY**: `npm run build` · 로컬 북한산 백련사→인근 서울 hub 상단 착지 · 서울 칩 스크롤 핀 회귀 OK
- **공유**: `https://www.gateo.kr/qa/scenic-home-scroll`
- **Preview**: `https://days-git-cursor-scenic-home-scroll-8482-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「인근 여행지→명승 홈 상단 착지」
- **QA(사람)**: 명승홈→관광지(비와야 폭포)→인근 양양 명승지 → 홈 상단 · 분류칩 고정 회귀 없음

## 테마여행 #72, 분류칩 스크롤 고정

**상태**: main 반영 완료 · PR [#66](https://github.com/catgeot/Days/pull/66) · [#67](https://github.com/catgeot/Days/pull/67) · merge `2132ee3c`

- **증상**: 명승홈 각 파트 분류칩(예: 수도권→서울) 클릭 시 스크롤이 서울 관광지 리스트 중간으로 튐 · 관광지 칩은 결과 1~2건일 때 하단으로 붙음
- **원인**: 위 목록 축소 시 scrollTop/앵커 유지 · 관광지 짧은 목록은 maxScroll 부족으로 칩을 중간/상단에 둘 여백이 없음
- **한 일**: `data-chip-pin` 스크롤 보정 · 목록 `overflow-anchor: none` · 관광지 ≤3건/empty 시 본문 `pb-[max(8rem,60vh)]` · 사람 QA 후 main 병합 · `/qa/scenic-chip`→PROD
- **VERIFY**: `npm run build` · 사람 Preview QA OK
- **공유**: `https://www.gateo.kr/qa/scenic-chip` → PROD `/korea/theme/scenic`
- **작업 로그**: 「분류칩 스크롤 수정 main 반영」

## 테마여행 #71, 내주변 분류칩

**상태**: feature `cursor/scenic-nearby-a8ec` · PR [#65](https://github.com/catgeot/Days/pull/65) · main 병합(`cca98d89`)

- **증상**: 명승홈 「내 주변」에 분류칩이 없어 긴 목록만 노출 → 탐색 제한
- **원인**: `show*FilterChips`가 `!nearActive`로 칩 숨김 · hub/경관 칩 클릭 시 `clearNear()`
- **한 일**: 내 주변 풀 기준 선정=여행지 칩 · 명승=경관 칩 · 관광지=종목(대·중·소) 칩 · 칩 클릭 시 near 유지 · Tour 풀 선조회 후 클라이언트 필터
- **VERIFY**: `npm run smoke:korea-scenic-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-nearby`
- **Preview**: `https://days-git-cursor-scenic-nearby-a8ec-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「내 주변 — 분류칩으로 목록 분할」
- **QA**: 내 주변 → 세 목록 위 칩 표시 · 칩으로 목록이 짧아짐 · 닫기 후 권역 칩 복귀
