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
- 사람 체크: Preview에서 하와이 숙소 목록을 끝까지 내려 더 보기 아래 트립닷컴 링크가 호놀룰루로 열리는지. 빈 결과·오류의 기존 버튼도 그대로인지. 사람 확인 완료. 메인 반영은 PR [#662](https://github.com/catgeot/Days/pull/662).

## 트립닷컴 숙소 #2, 미연결 여행지 점검 준비

- 목록 하단 링크는 city ID가 없으면 하와이처럼 직전 세션 도시가 남는다. 숙소 가능 여행지 중 미연결은 해외 약 220, 한국은 서울·제주·서귀포.
- 다음 세션 범위는 배치 1(제도·섬·권역 24곳)만. 절차·금지·플래너 부작용은 [`tripcom-stay-city-audit.md`](./tripcom-stay-city-audit.md). 현황은 `node scripts/audit-tripcom-stay-cities.mjs` (Trip.com 호출 없음).
- city ID를 넣으면 `[@지역@]`이 없는 플래너 숙소 버튼이 트립닷컴으로 바뀐다. 일괄 추가 금지. 라이브로 도시가 맞은 뒤에만 추가한다. 호놀룰루 slug는 `757`로 묶지 않는다.

## 트립닷컴 숙소 #2, 미연결 여행지 점검

- 오케스트레이터로 배치 1만 처리. 워커 2 × 라운드 2. 목록 `destinationInputValue`가 그 여행지인 곳만 ID를 넣었다. 주 ID·키워드 첫 행·`city=10279`는 쓰지 않았다.
- 연결 23: 괌 753, 몰디브 말레 1207, 세이셸 빅토리아 20672, 팔라완 푸에르토프린세사 7515, 카나리아 라스팔마스 3174, 갈라파고스 푸에르토 아요라 59342, 모리셔스 포트루이스 76783, 잔지바르시티 316972, 누메아 4086, 사이판 4081, 오키나와 나하 92573, 홋카이도 삿포로 641, 푸켓 725, 보라카이 1391, 세부 35831, 크레타 헤라크리온 6890, 시칠리아 팔레르모 3640, 마데이라 푼샬 3298, 바하마 나소 3330, 카보베르데 프라이아 5720, 레위니옹 생드니 5797, 우유니 71478, 코모도 라부한바조 7291.
- 보류: 라자 암팟. 와이사이 87669는 서파푸아. 호놀룰루 slug는 757로 묶지 않음. sparse 9곳은 큐에서 제외.
- 플래너: 이 23곳은 `[@지역@]`이 없으면 숙소 버튼이 트립닷컴으로 바뀐다.
- 코드 `73d6fa75` `a6439a7d` · 브랜치 `cursor/tripcom-stay-cities-de61` · PR [#664](https://github.com/catgeot/Days/pull/664). audit: mapped 74 · 배치 1 열림 1 · 미연결 200. `cursor/*` Preview는 꺼져 있다.
- 다음: 큐 R03–R04(대도시 10 + 다음 12). 한 세션 2라운드. 큐 [`tripcom-stay-city-queue.md`](./tripcom-stay-city-queue.md).

## 트립닷컴 숙소 #3, 대도시 연결

- 오케스트레이터 2라운드 · 워커 2. 목록 `destinationInputValue`가 그 여행지인 IntlCity만 넣었다. 주 ID·키워드 첫 행·`city=10279`·다른 나라 동명은 쓰지 않았다.
- R03 10: 도쿄 228, 오사카 219, 싱가포르 73, 방콕 359, 파리 192, 뉴욕 633, 시드니 501, 서울 274, 제주 제주시 737, 서귀포 35796.
- R04 12: 아부심벨 6605, 아콩카과 멘도사 3397, 알래스카 앵커리지 752, 앨리스스프링스 3404, 아마존 마나우스 1256, 암스테르담 176, 안다만 포트 블레어 7050, 앙코르 톰 309747, 앙코르 와트 시엠립 1369, 안나푸르나 포카라 3332, 아레키파 3718, 아테네 710.
- 플래너: 이 22곳은 `[@지역@]`이 없으면 숙소 버튼이 트립닷컴으로 바뀐다.
- 코드 `4577d03d` `634894f1` · 브랜치 `cursor/tripcom-stay-cities-de61` · PR [#665](https://github.com/catgeot/Days/pull/665). audit: mapped 96 · 미연결 178 · 한국 0 · 배치 1 열림은 라자 암팟. `cursor/*` Preview는 꺼져 있다.
- 다음: 큐 R05–R06. 한 세션 2라운드.

## 마이리얼트립 API, gzip 응답 복구

- 증상: 숙소·투어 Edge가 200이지만 지역·상품이 0건. 릴레이 본문이 `Content-Encoding` 없는 gzip이라 JSON 파싱이 실패하고 빈 목록으로 처리됐다.
- 수정: `mrtFetch`가 gzip 매직 바이트를 푼다. Edge `fetch-mrt-stays`·`fetch-mrt-tnas`·`mrt-link-generator` 배포함. 코드는 `cursor/mrt-api-0b3f` · PR [#666](https://github.com/catgeot/Days/pull/666). `main` 재배포 전에 머지해야 수정이 유지된다.
- 확인: 제주 숙소(제주시), 종로 숙소(신라스테이 광화문), 제주 투어(제주투어패스) 반환. Deno `mrtFetch_test.ts` 6건 PASS.
- 사람 체크: [www.gateo.kr](https://www.gateo.kr) 제주·종로 숙소 찾기와 제주 투어에 카드가 보이는지.
