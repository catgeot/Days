# 2026-09-12 프로젝트 일지

직전: [`2026-09-11-project-log.md`](./2026-09-11-project-log.md)

## 팔경 활용 #17 — 한천팔경 공식명·지구본 검색 (Cloud)

- **세션** `팔경 활용 #16, 사람 Preview QA` 피드백 → **#17**
- **브랜치** `cursor/palgyeong-use-e744` · tip `61c72ba3` · PR [#217](https://github.com/catgeot/Days/pull/217)
- **완료**:
  1. 영동은 한천팔경·양산팔경이 같이 있어 그룹명이 「영동 팔경」으로 겹침. 같은 시군에 같은 종류가 둘이면 공식 title(한천팔경·양산팔경)을 씀. 「영동 팔경」은 공식 명칭이 아님.
  2. 지구본 홈 「한천」검색이 영동 도시만 나오던 문제 — `resolveLocalScenicListFromSearchQuery`로 includes 매칭을 검색에 연결해 한천팔경 8행이 먼저 나오게 함.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=yeongdong`
- **다음** 사람 Preview QA — 명승 「한천」그룹명 한천팔경 · 지구본 검색 한천팔경 · 영동 허브 두 팔경 분리

```
팔경 활용 #18, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #217 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 명승 검색 「한천」그룹명이 한천팔경인지 · 지구본 홈 「한천」에 한천팔경 행이 있는지 · ?hub=yeongdong 한천·양산이 따로 묶이는지
```
