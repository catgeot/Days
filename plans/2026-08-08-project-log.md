# 2026-08-08 프로젝트 일지

직전: [`2026-08-07-project-log.md`](./2026-08-07-project-log.md)

## 테마여행 #72, 분류칩 스크롤 고정

**상태**: feature `cursor/scenic-chip-jump-0e9a` · Preview QA 대기

- **증상**: 명승홈 각 파트 분류칩(예: 수도권→서울) 클릭 시 스크롤이 서울 관광지 리스트 중간으로 튐
- **원인**: 칩 필터로 위 목록 높이가 줄어도 `scrollTop`·스크롤 앵커가 유지되어 아래 관광지 구간이 뷰포트로 올라옴
- **한 일**: 칩 클릭 시 `data-chip-pin`으로 뷰포트 오프셋 저장 → 레이아웃 후 스크롤 보정 · 목록 `overflow-anchor: none`
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-chip`
- **Preview**: `https://days-git-cursor-scenic-chip-jump-0e9a-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「분류칩 클릭 시 스크롤 점프 방지」
- **QA**: 수도권→서울·강원→강릉 등 중분류 칩 · 명소/명승/관광지 각 칩 — 클릭한 칩이 제자리에 남는지

### 테마여행 · 에이전트 핸드오프 → `#73`

| | |
|--|--|
| **세션 표기** | `테마여행 #73, Preview QA 반영` |
| **브랜치** | `cursor/scenic-chip-jump-0e9a` (고정) |
| **읽을 것 3** | ① 본 절 ② ScenicPage chip scroll pin ③ `/qa/scenic-chip` |
| **금지 3** | 축제 지도 리팩터 · UI 임의 리디자인 · releaseNotes 무단 반영 |
| **후보** | Preview QA · main 병합 |
| **공유/Preview** | `https://www.gateo.kr/qa/scenic-chip` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #73, Preview QA 반영
```

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
