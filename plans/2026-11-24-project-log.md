# 2026-11-24 프로젝트 일지

이전: [`2026-11-13-project-log.md`](./2026-11-13-project-log.md)

## 해외 내 위치 가는 법

- 축제 MOONi 「가는 법」의 내 위치가 한반도 밖 좌표를 가장 가까운 시·군에 붙여, 태국 카오락이 `서귀포 · 제주 (내 위치)`로 나왔다. 한국 밖은 역지오코딩한 도시·국가와 가까운 국제공항에서 김해(PUS) 또는 인천(ICN)으로 안내한다. 국내 좌표와 김포→인천 관문은 그대로다.
- `/place` 「가는 법」도 한국 밖 GPS를 한국 출발 공항으로 고르지 않고, 같은 도시·국가와 공항 경유 문장을 보낸다. 해외 축제는 같은 출발 도크를 쓰고 목적지 좌표로 도착 공항을 고른다.
- 코드 `29d627a9` · 브랜치 `cursor/overseas-origin-2051` · Draft PR [#903](https://github.com/catgeot/Days/pull/903).
- 검증: `scripts/health/overseas-my-location-origin.test.mjs` · `korea-origin-city-match` · `mooni-festival-first-answer` · `smoke-flight-origin-gateway` 5/5 · origin-input Chromium 390·1280 13 passed.
- 사람 확인: 해운대 빛축제 가는 법에서 카오락이면 `카오락 · 태국 (내 위치)`와 HKT→PUS. 서울 좌표면 기존 `서울에서 이 축제장까지 대중교통과 차로`.
