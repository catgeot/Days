# 2026-10-26 프로젝트 일지

이전: [`2026-10-22-project-log.md`](./2026-10-22-project-log.md)

## 축제 주변 볼거리 v2

- draft [#569](https://github.com/catgeot/Days/pull/569) `cursor/festival-nearby-v2-c213` tip `86d750fc`. 축제 상세 «주변 볼거리»를 리스트 스타일로 고정하고 5개→더보기마다 +4 인시트 확장, 대표 경관 그룹은 상단 별도 유지, 나머지는 축제 좌표 기준 거리순·5km 밴드로 정리. type12만 유지(14/38 제외), 72px 썸네일, cat3 타입 라벨.
- 검증: `npm run lint:ci` PASS(기존 unused-disable warning 12) · `npm run test:health` PASS(675) · `npm run smoke:korea-festival-nearby` PASS · WebKit 390 캡처 `3522322`/`1399532` + JSON `/opt/cursor/artifacts/festival_nearby_v2_counts_v2c.json`.
- 사람 체크: draft #569에서 오슬로 빈티지 마켓(인천 구경 중복 0)과 부산고등어축제(5→9→25 리스트) 더보기 탭 때 URL·스크롤이 유지되는지 본다. PR 병합 전까지 코드 `origin/main` push 금지.
