# 2026-11-05 프로젝트 일지

이전: [`2026-10-26-project-log.md`](./2026-10-26-project-log.md)

## 하와이 숙소 #1, 트립닷컴 도시 연결

- 증상: 하와이 숙소 빈 결과의 「트립닷컴에서 숙소 검색」이 아피아(사모아)로 열림. `hawaii`에 Trip `city`가 없어 직전 세션 도시가 남음.
- 수정: `PLANNER_TRIPCOM_HOTEL_CITY_IDS.hawaii` = **`757`**(호놀룰루·HNL). 주 `10279`는 검색창이 비고, `city=10279`는 이탈리아 아풀리아. 브랜치 `cursor/hawaii-tripcom-stay-c4ed` · PR [#662](https://github.com/catgeot/Days/pull/662) · 코드 tip `b5d5d35c`.
- 확인: `kr.trip.com/hotels/list?city=757` + `cityName=Hawaii` + 2026-11-19~22 · 검색 도시 호놀룰루/하와이/미국 · 와이키키 호텔 · 아피아 0.
- 사람 체크: 하와이 숙소 찾기 → 트립닷컴 검색창이 호놀룰루(하와이)이고 사모아 아피아가 아닌지. `cursor/*` Preview는 기본 꺼짐이라 이 브랜치만 `vercel.json`에서 배포를 켰다. Preview `https://days-git-cursor-hawaii-tripcom-stay-c4ed-catgeots-projects.vercel.app/place/hawaii`. 코드 `origin/main` push 금지.
