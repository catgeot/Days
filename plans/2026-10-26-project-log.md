# 2026-10-26 프로젝트 일지

이전: [`2026-10-22-project-log.md`](./2026-10-22-project-log.md)

## 축제 주변 볼거리 v2

- draft [#569](https://github.com/catgeot/Days/pull/569) `cursor/festival-nearby-v2-c213` tip `f92cf077`. 카드 flag ON 경로는 main `FestivalNearbyCardsSection`으로 복구, non-cards만 5개→더보기 +4 리스트 v2. 거리 계산은 haversine, type12 중 회사·학교·강당류 제외, 모바일 긴 제목은 말줄임으로 거리 배지 같은 줄 유지.
- 검증: `npm run lint:ci` PASS(기존 unused-disable warning 12) · `npm run test:health` PASS(675) · `npm run smoke:korea-festival-nearby` PASS · WebKit 캡처 `3522322` 390/1280, `1399532` 390 + JSON `/opt/cursor/artifacts/festival_nearby_v2_counts_pr569_fix_v2.json`.
- 사람 체크: draft #569에서 인천 구경(차이나타운~백령도)은 계획대로 상단 대표 그룹이고 일반 목록 중복 0인지, 부산고등어축제 긴 제목(송도반도)이 말줄임+거리 같은 줄인지 본다. PR 병합 전까지 코드 `origin/main` push 금지.
