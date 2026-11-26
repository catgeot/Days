# 2026-11-26 프로젝트 일지

이전: [`2026-11-13-project-log.md`](./2026-11-13-project-log.md)

## 홈 바로가기 리뷰 창고 (플래그 기본 OFF)

- 코드 `678d33c36` · 브랜치 `cursor/quicklink-review-tab-31b5` · PR [#928](https://github.com/catgeot/Days/pull/928).
- `?quicklink_review_tab=1`일 때만 네 번째 바로가기가 «리뷰 창고»(`/blog#review-hub`). 접힌 칩도 «축제 · 행사 · 명승 · 리뷰»(영어 Fest · Events · Scenic · Reviews). 끄면 «축제 · 행사 · 명승 · 추천». 항목은 4개.
- 동행 답변 링크 문구는 «취향에 맞는 여행지 더 찾기 → AI 큐레이션». 영어는 “Find more destinations for your taste → AI curation”.
- 작업 로그·모바일 위젯 로그는 `www.gateo.kr`에서 항상 숨김. `*.vercel.app` Preview는 URL에 `?devlog=1`이 있을 때만 보임. localhost와 Vite dev는 그대로 보임.
- 장소가 없는 홈 MOONi는 디스커버리 칩만 보인다. L1/L2 «동행별 추천»은 장소가 묶인 뒤에만 나오고, 그때 답변 끝에 큐레이션 링크가 붙는다.
- «리뷰 창고»는 `/blog#review-hub`로 간다. 그 앵커가 현재 «GATEO 리뷰어 리뷰» 섹션이다. 큰 사진 2열 카드와 전체·국내·해외 칩은 같은 섹션에서 `VITE_GATEO_LOGBOOK_REVIEW_FILTER`가 켜질 때만 그려지고, 필터가 꺼지면 작은 썸네일 목록이 나온다. 프로덕션은 HUB와 FILTER가 둘 다 `"1"`이라 라이브 `/blog`가 카드다. 이 Preview에는 두 env가 없다. `?logbook_review_hub=1`만 붙이면 허브의 옛 목록이 보인다. 같은 디자인을 Preview에서 보려면 `?logbook_review_hub=1&logbook_filter=1#review-hub`. 링크 href는 그대로 두었다. 로그인은 카드 레이아웃을 바꾸지 않는다. 브랜치는 main보다 뒤처져 있으나, 그 커밋은 허브 카드를 바꾸지 않아 rebase하지 않았다.
- 1280에서 펼친 메뉴가 좌측 «휴양» 레일과 겹치는 것은 `www.gateo.kr`에도 있어서 이 PR에서 고치지 않았다.
- `quicklink_click`은 플래그와 상관없이 4개 타일 클릭마다 나간다. OFF의 네 번째는 `curation`, ON은 `review_hub`. `mooni_curation_link_click`은 동행 답변 링크가 있을 때(플래그 ON) 나간다. QA·webdriver·`?crawler=1`은 이벤트를 막지 않고 `traffic_type:'internal'`만 붙인다.

## 가는 방법 출발 기본값

- `/place/khao-lak` «가는 방법»이 위치가 카오락이어도 `서울 (ICN)`을 출발로 두던 문제를 고쳤다. 알고 있는 좌표·저장된 위치가 있으면 그 공항을 쓰고, 구간은 숨기지 않는다.
- 코드 `dcac4366d` · 브랜치 `cursor/access-origin-default-2dbb` · PR [#920](https://github.com/catgeot/Days/pull/920).
- 단위 `scripts/health/access-origin-default.test.mjs`는 main 해석기에서 FAIL(ICN), 수정 후 PASS. WebKit E2E `e2e/access-origin-default.spec.js`는 카오락·도쿄·제주를 390·1280에서 PASS.
- 사람 확인: Preview에서 카오락 위치를 둔 뒤 «가는 방법» 칩이 `푸켓 (HKT)`인지, 제주에 있으면 `제주 (CJU)`인지 본다.

## 홈 테마 월간 모바일 (#923) — main 병합·MOONi QA 후속

- 브랜치 `cursor/home-theme-monthly-mobile-716c` · head `7ab737d8d` (merge `1af78d0d0` + E2E 보강).
- `origin/main` 병합: #924 MOONi 스냅·#925 인트로/health SSOT 반영; #923 96px 전폭·지구본 메뉴 yield 유지; 중복 `mooniFabBottomClearOfWatchCard` 제거.
- EN 월간 타일 지명: `buildHomeWatchMonthlyDestinations(..., i18n.language)`.
- E2E: `home-monthly-mooni-fab-overlap` 코너 매트릭스 · `home-theme-monthly-mobile` EN·코너 캡처.
- 로컬: overlap 6/6 (chromium+webkit 390), theme monthly mobile PASS, EN destinations PASS; `npm run build` PASS.
