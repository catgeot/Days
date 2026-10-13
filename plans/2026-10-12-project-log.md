# 2026-10-12 프로젝트 일지

직전: [`2026-10-11-project-log.md`](./2026-10-11-project-log.md)

## 국향대전 manual #3, 근처 썸네일·QA r5

- **세션** `국향대전 manual #3, 근처 썸네일·QA r5` · branch `cursor/hampyeong-gukhyang-manual-ff66` · tip `3a7be3b1` · draft PR [#451](https://github.com/catgeot/Days/pull/451)
- **조치** 시트 하단 56px 근처 명소 `NearbyRowThumb` → `FestivalPhotoFrame` + `referrerPolicy=no-referrer` · e2e QA r5(WebKit 390) 이미지 audit·route abort(히어로 플레이스홀더·크레딧 없음).
- **VERIFY** health 301 · gukhyang screenshots 6 pass · audit `promo 1/1` `list 14/14` `hero 1/1` `nearby 17/17` (blocked: hero 0/1, credit 0).
- **다음** Preview QA r5 후 PR #451 병합

## 국향대전 manual #2, 사진·썸네일 COS

- **세션** `국향대전 manual #2, 사진·썸네일 COS` · branch `cursor/hampyeong-gukhyang-manual-ff66` · tip `bcfa5881` · draft PR [#451](https://github.com/catgeot/Days/pull/451)
- **원인** VisitKorea CMS(`4114406_image2_1.JPG`)는 GET 200이지만 WebKit에서 referrer 때문에 `<img>`가 실패해도 `출처: 한국관광공사`가 남아 회색 히어로처럼 보였다. 스크린샷은 decode 전에 찍혀 promo·목록 썸네일이 빈 것처럼 보였다.
- **조치** `FestivalPhotoFrame` 기본 `referrerPolicy=no-referrer` · 히어로 동일 · 크레딧은 `heroPhotoDecoded`일 때만 · `toHttps`가 `//` 지원 · e2e는 `naturalWidth>0` 후 캡처(home→전남→638576→MOONi).
- **VERIFY** `npm run test:health` 301 pass · `playwright.config.gukhyang-screenshots.js` 4 pass · 스크린샷 `/opt/cursor/artifacts/screenshots/gukhyang-manual-638576/`
- **Preview** git `https://days-git-cursor-hampyeong-gukhyang-manual-ff66-catgeots-projects.vercel.app/korea?festival=638576`
- **다음** Preview에서 전남 14·promo 썸네일·국향 히어로+크레딧 확인 후 PR #451 병합

## Vercel 프리뷰 #1, cursor 빌드 생략

- **세션** `Vercel 프리뷰 #1, cursor 빌드 생략` · branch `cursor/vercel-skip-previews-8e40` · tip `14fc605c` · draft PR [#444](https://github.com/catgeot/Days/pull/444) · 병합 금지
- **조치** `git.deploymentEnabled`의 `cursor/*`만 false. 적지 않은 브랜치(main)는 문서 기본값 true. ignoreCommand는 같이 써도 된다는 문서가 없어 스크립트와 함께 제거.
- **VERIFY** `npm run test:health` 270 pass · CI run `38200174915` success.
- **다음** 제시어 없음

## 마산 주변 볼거리 #7, 빈 사진·스피너

- **세션** `마산 주변 볼거리 #7, 빈 사진·스피너` · branch `cursor/nearby-settle-8e40` · tip `e1024118` · draft PR [#442](https://github.com/catgeot/Days/pull/442) · 병합 금지
- **조치** detailImage가 빈 갤러리면 회색을 기다리지 않고 아이콘. searchPhoto가 사진을 찾으면 그 칸에 채운다. 맛집·레포츠·문화·코스 스피너는 `주변 정보를 불러오는 중…` 하나.
- **VERIFY** `npm run test:health` 270 pass · CI run `38199101000` success. WebKit 390 강릉 2930716: searchPhoto를 6초 붙잡은 동안 리고엠이 아이콘. 스피너 1개.
- **Preview** `https://days-git-cursor-nearby-settle-8e40-catgeots-projects.vercel.app/korea?festival=2930716`
- **다음** 제시어 없음

## 카이로 동선 #10, 출처 조각

- **세션** `카이로 동선 #10, 출처 조각` · branch `cursor/cairo-source-tidy-8e40` · tip `05556608` · draft PR [#441](https://github.com/catgeot/Days/pull/441) · #436은 `c8bbf7d7`로 main
- **조치** 기자·이집트박물관 출처 이름은 `관광유물부` / `Ministry of Tourism and Antiquities`. URL의 `giza-plateau`·`egyptian-museum`은 그대로. 카이로·GEM·술탄 하산 영문 시간 범위는 `–`. `A~D`와 한글 본문은 그대로.
- **제안** 해외 영문 제목 아래 `(카이로)`는 비운다. 현지 이름이 아니라 영어 제목의 한글 풀이다. 코드는 안 바꿈.
- **VERIFY** `npm run test:health` 269 pass · CI run `38198811374` success. WebKit 390 GEM `09:00–18:00` 1줄.
- **Preview** `https://days-git-cursor-cairo-source-tidy-8e40-catgeots-projects.vercel.app/place/grand-egyptian-museum?lang=en`
- **다음** 제시어 없음

## 카이로 동선 #9, 한글 출처

- **세션** `카이로 동선 #9, 한글 출처 줄바꿈` · branch `cursor/cairo-facts-en-8e40` · tip `e516f770` · draft PR [#436](https://github.com/catgeot/Days/pull/436) · 병합 금지
- **조치** 사실 블록 출처·링크에 `break-keep`. 공백 없는 URL만 `overflow-wrap: anywhere`. 카이로 «대사관 공지»가 음절 중간에서 끊기지 않는다. 블로그 줄 끝 «(»는 건드리지 않음.
- **VERIFY** `npm run test:health` 264 pass · CI run `38197969167` success. WebKit 390 돈·치안 출처는 `word-break: keep-all`, «공지» 1줄.
- **Preview** `https://days-git-cursor-cairo-facts-en-8e40-catgeots-projects.vercel.app/place/cairo?lang=ko`
- **다음** 제시어 없음

## 마산 주변 볼거리 #6, 사진 채움

- **세션** `마산 주변 볼거리 #6, 피드백 반영` · branch `cursor/masan-nearby-8e40` · tip `bb90379f` · draft PR [#435](https://github.com/catgeot/Days/pull/435) · 병합 금지
- **원인** QA r3는 합본 카드가 8초 뒤에도 기념비 아이콘만 보였다. DB `first_image`가 비면 팔경 그룹만 DB를 다시 보고, TourAPI detailImage는 붙지 않았다. 썸네일 로딩 중에도 같은 아이콘을 썼다.
- **조치** 목록은 그대로 먼저 그린다. 사진이 없는 contentId는 목록 뒤에 DB와 detailImage로 채워 칸(h-14)에 넣는다. 기다리는 동안은 회색 스켈레톤이고, 조회가 끝나도 없을 때만 아이콘이다. 거리순·팔경 소제목·장소 메모는 그대로다.
- **WebKit 390** 목록은 `tourapi_attraction` 응답 뒤 100–140ms. 사진(img.complete·naturalWidth>0): 마산 15/15, 국향 18/18, 강릉 13장과 아이콘 2(리고엠·허균 허난설헌 기념공원). 첫 항목 임항선 그린웨이 290m · 보광사(함평) 1.4km · 강릉 오금집 320m.
- **VERIFY** `npm run test:health` 268 pass · CI run `38196288989` success (lint-and-build, e2e-youtube-session)
- **Preview** `https://days-git-cursor-masan-nearby-8e40-catgeots-projects.vercel.app/korea?festival=637693` · `638576` · `2930716`
- **다음** `마산 주변 볼거리 #7, 피드백 반영`

## 카이로 동선 #8, 줄바꿈

- **세션** `카이로 동선 #8, 줄바꿈` · branch `cursor/cairo-facts-en-8e40` · tip `fb7767d1` · draft PR [#436](https://github.com/catgeot/Days/pull/436) · 병합 금지
- **조치** 사실 값의 시각 범위는 nowrap + word-break normal. 출처·링크의 break-all을 제거했다. 블로그 본문 `/blog/e/cairo-travelogue` GEM 요금 줄에도 같은 nowrap. 한글 break-keep은 유지.
- **VERIFY** `npm run test:health` 264 pass · CI run `38194968204` success. WebKit 390에서 GEM 영문·한글 입장 시간, 공항 출처 «CAI», 블로그 `11:00~13:00`이 각 1줄.
- **대기** `giza-plateau`·`egyptian-museum` 출처 조각은 #436 병합 후 `origin/main` PR. 영문 `~`→`–`, 헤더 «(카이로)»는 하지 않음.
- **다음** 제시어 없음

## 카이로 동선 #7, 영문 문장

- **세션** `카이로 동선 #7, 영문 문장` · branch `cursor/cairo-facts-en-8e40` · tip `3eb6d978` · draft PR [#436](https://github.com/catgeot/Days/pull/436) · 병합 금지
- **조치** 영문만 다듬는다. 술탄 하산은 Al-Rifa'i Mosque가 포함·맞은편이라고 적는다. Uber 안내, leave the country 경보, 코샤리 저녁, GEM «Children under 6 enter free.» 출처 이름은 «관광유물부» / «Ministry of Tourism and Antiquities»이고 주소의 sultan-hasan은 그대로다. 시간 범위는 nowrap.
- **VERIFY** `npm run test:health` 264 pass · CI run `38193826525` success (lint-and-build, e2e-youtube-session). WebKit 390에서 GEM 입장 시간 4줄은 각 1줄.
- **Preview** `https://days-git-cursor-cairo-facts-en-8e40-catgeots-projects.vercel.app/place/sultan-hassan-mosque?lang=en` · GEM `.../place/grand-egyptian-museum?lang=en`
- **QA** Site QA PASS at `8adf8f05`. `cursor/cairo-facts-en-8e40` push 금지(동결).
- **대기** #436 병합 후, 사람이 시키면 `origin/main`에서 작은 PR. 출처 라벨에서 `giza-plateau`·`egyptian-museum` 조각만 제거(영문 «Ministry of Tourism and Antiquities …», 한글 «관광유물부 …»). URL은 그대로. 술탄 하산과 같은 방식. 병합 전에는 시작하지 않는다.
- **다음** 제시어 없음. #435 QA 결과를 기다린다.

## 마산 주변 볼거리 #5, 숙소와 분리

- **세션** `마산 주변 볼거리 #5, 피드백 반영` · branch `cursor/masan-nearby-8e40` · tip `d3449b4b` · draft PR [#435](https://github.com/catgeot/Days/pull/435) · 병합 금지
- **원인** QA r2(tip `21192a6d`)는 제목 이동 0px였으나 합본이 늦었다. 목록이 `heroReady`에 묶여 히어로 이미지가 느린 `fetch-mrt-stays`와 같이 끝난 뒤에야 숙소·음식·레포츠·문화와 한 번에 그려졌다. 클라우드 MRT가 빨라 이전 측정에서는 안 보였다. `tourapi_attraction` 4.75초는 locationBasedList 뒤로 미뤄서가 아니다. 직접 열기에서는 좌표가 생긴 뒤에 요청이 나가고, 그 시각은 main과 같다.
- **조치** DB 주변+팔경이 정해지면 합본을 그린다. 숙소 스트립은 그 다음에 마운트하고, 음식·레포츠·문화는 자리를 유지한 채 따로 채운다. DB 조회는 상세·이미지보다 먼저 보낸다. 거리순·팔경 소제목·장소 메모·마산 연꽃공원 병합은 그대로다.
- **WebKit 390** `fetch-mrt-stays` 10초, `locationBasedList` 6초. 목록 ms PR/main: 마산 직접 5454/5680, 카드 1802/2645. 국향 7224/7639. 강릉 4475/5333. 목록 뒤 3초 제목 이동 −1·0·−1·+2px. 첫 항목 임항선 그린웨이 290m · 보광사(함평) 1.4km · 강릉 오금집 320m. DB 시작은 카드 마산 PR 977 / main 960.
- **VERIFY** `npm run test:health` 267 pass · CI run `38193155520` success (lint-and-build, e2e-youtube-session)
- **Preview** `https://days-git-cursor-masan-nearby-8e40-catgeots-projects.vercel.app/korea?festival=637693` · `638576` · `2930716`
- **다음** `마산 주변 볼거리 #6, 피드백 반영`

## 마산 주변 볼거리 #4, locationBasedList 분리

- **세션** `마산 주변 볼거리 #4, 피드백 반영` · branch `cursor/masan-nearby-8e40` · tip `b8775173` · draft PR [#435](https://github.com/catgeot/Days/pull/435) · 병합 금지
- **원인** 합본은 DB 근처 명소(~0.7–0.9초)면 충분한데, 시트 오픈과 함께 맛집·레포츠·문화 `locationBasedList`가 나간다. Edge 캐시는 함수 인스턴스 메모리 30분(재시작 시 소멸)이고, 클라 `invokeSupabaseFunctionDeduped`는 메모리 7분이라 새로고침에 사라진다.
- **조치** 합본 상태(ok/empty/error) 다음 틱에 맛집·레포츠·문화·코스를 시작한다. 같은 좌표의 `locationBasedList`·`areaBasedList` 성공 응답만 sessionStorage·localStorage에 30분 둔다. 실패는 캐시하지 않는다. 거리순·팔경 소제목은 그대로다.
- **WebKit 390** 같은 런. 합본 ms PR cold/warm · main cold/warm: 마산 4387/2033 · 4992/3548. 국향 6574/1981 · 6070/5034. 강릉 3947/1541 · 4719/4353. PR warm은 locationBasedList 0, DB 재요청 0. 제목 이동 0–1px. 첫 항목은 임항선 그린웨이 · 보광사(함평) · 강릉 오금집. 마산·국향 warm은 1.5초를 넘긴다(시트 1.2초 + 히어로).
- **VERIFY** `npm run test:health` 267 pass · CI run `38190266499` success (lint-and-build, e2e-youtube-session)
- **Preview** `https://days-git-cursor-masan-nearby-8e40-catgeots-projects.vercel.app/korea?festival=637693` · `638576` · `2930716`
- **다음** `마산 주변 볼거리 #5, 피드백 반영`

## 카이로 동선 #6, 영문 단위 확인

- **세션** `카이로 동선 #6, 영문 단위 확인` · branch `cursor/cairo-facts-en-8e40` · 코드 tip `9864e282` · 브랜치 tip `6c572b24` · draft PR [#436](https://github.com/catgeot/Days/pull/436) · 병합 금지 · 한글 `cairo.js` 미변경 · #435 푸시 없음
- **확인** 영문 값은 `USD 25` / `USD 60` / `6 months` / `1 hour` / `6 years`. EGP는 EGP. 건강 검사는 토큰을 `amount:25:USD`처럼 맞추고, 영문 값의 한글은 영어 고유명사 뒤 괄호 안에서만 허용한다. `place-verified-facts.test.mjs` 8 pass. 화면 텍스트에 한글 없음.
- **CI** run `38185463753` (`9864e282`) success · run `38185699479` (`6c572b24`) success. lint-and-build, e2e-youtube-session.
- **Preview** `https://days-git-cursor-cairo-facts-en-8e40-catgeots-projects.vercel.app/place/cairo?lang=en` · GEM `.../place/grand-egyptian-museum?lang=en`
- **다음** 제시어 없음. 초안 PR은 사람이 본다.
