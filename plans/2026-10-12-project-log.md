# 2026-10-12 프로젝트 일지

직전: [`2026-10-11-project-log.md`](./2026-10-11-project-log.md)

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
