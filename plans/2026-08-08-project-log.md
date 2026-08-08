# 2026-08-08 프로젝트 일지

직전: [`2026-08-07-project-log.md`](./2026-08-07-project-log.md)

## 테마여행 #73, 인근여행지 홈 스크롤

**상태**: feature `cursor/scenic-home-scroll-8482` · Preview QA 대기

- **증상**: 관광지 본문 「인근 여행지」(비와야 폭포→양양 명승지) 클릭 시 양양 명승 홈 상단이 아니라 관광지 리스트 중간으로 착지
- **원인**: 같은 `ScenicPage`가 마운트 유지된 채 hub URL만 바뀌어 `mainScrollRef.scrollTop`이 이전 목록 위치로 남음
- **한 일**: hub·region·area 변경 시(분류칩 pin 없을 때만) 본문 스크롤 0으로 리셋
- **공유**: `https://www.gateo.kr/qa/scenic-home-scroll`
- **Preview**: `https://days-git-cursor-scenic-home-scroll-8482-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「인근 여행지→명승 홈 상단 착지」
- **QA**: 명승홈→관광지(비와야 폭포)→인근 양양 명승지 → 홈 상단(헤더·선정 명소)인지 확인 · 분류칩 클릭 스크롤 고정은 회귀 없음

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
