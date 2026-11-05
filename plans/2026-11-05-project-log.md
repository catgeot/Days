# 2026-11-05 프로젝트 일지

이전: [`2026-10-26-project-log.md`](./2026-10-26-project-log.md)

## 하와이 숙소 #1, 트립닷컴 도시 연결

- 증상: 하와이 숙소 빈 결과의 「트립닷컴에서 숙소 검색」이 아피아(사모아)로 열림. `hawaii`에 Trip `city`가 없어 직전 세션 도시가 남음.
- 수정: `PLANNER_TRIPCOM_HOTEL_CITY_IDS.hawaii` = **`757`**(호놀룰루·HNL). 주 `10279`는 검색창이 비고, `city=10279`는 이탈리아 아풀리아. 브랜치 `cursor/hawaii-tripcom-stay-c4ed` · PR [#662](https://github.com/catgeot/Days/pull/662) · 코드 tip `b5d5d35c`.
- 확인: `kr.trip.com/hotels/list?city=757` + `cityName=Hawaii` + 2026-11-19~22 · 검색 도시 호놀룰루/하와이/미국 · 와이키키 호텔 · 아피아 0.
- 사람 체크: 하와이 숙소 찾기 → 트립닷컴 검색창이 호놀룰루(하와이)이고 사모아 아피아가 아닌지. `cursor/*` Preview는 기본 꺼짐이라 이 브랜치만 `vercel.json`에서 배포를 켰다. Preview `https://days-git-cursor-hawaii-tripcom-stay-c4ed-catgeots-projects.vercel.app/place/hawaii`. 코드 `origin/main` push 금지.

## 하와이 숙소 #1, 목록 하단 트립닷컴

- 요청: 마이리얼트립 목록이 뜨면 트립닷컴 링크가 사라진다. 목록 맨 아래 「마이리얼트립에서 더 보기」 아래에 「트립닷컴에서 숙소 검색」을 둔다.
- 수정: `StayMrtMoreFooter`가 `tripcomHref`를 받는다. 추적 `trip_sub1` = `숙소찾기 목록하단`. 예약 가능 숙소가 5곳 이하인 저재고는 기존 트립닷컴 박스만 쓰고, 더 보기 링크는 그대로 숨긴다.
- 확인: `node scripts/smoke-mrt-stay-queries.mjs` 33건 PASS. Playwright `playwright.config.stay-list-tripcom.js` — 홈 하와이 숙소 찾기, 더 보기가 위·트립닷컴이 아래, `city=757`, `trip_sub1=숙소찾기 목록하단`. tip `29813009`.
- 사람 체크: Preview에서 하와이 숙소 목록을 끝까지 내려 더 보기 아래 트립닷컴 링크가 호놀룰루로 열리는지. 빈 결과·오류의 기존 버튼도 그대로인지.
