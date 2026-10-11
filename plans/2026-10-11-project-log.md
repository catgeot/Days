# 2026-10-11 프로젝트 일지

직전: [`2026-10-10-project-log.md`](./2026-10-10-project-log.md)

## 축제 MOONi Edge #1, QA 마찰

- **세션** `축제 MOONi Edge #1, QA 마찰` · branch `cursor/mooni-festival-edge-7c65` · tip `63b3a78d` · draft PR [#420](https://github.com/catgeot/Days/pull/420) · base `main` `c60b2b5b` (#419)
- **조치** Edge 프롬프트와 클라이언트 폴백. 숙소 끝줄은 `[강릉 국수 축제 페이지](url)에서 가는 법을 알아보세요`로 합친다. `10/15~18이예요`는 `10/15~18예요`. 근처 먹을 곳은 상세 주변 맛집만 쓰고 생활문화센터·터널은 뺀다. #419 사실·링크·채움 문장 규칙은 유지.
- **범위** Edge+client. 모델 `gemini-3.1-flash-lite`, Fast off. **에이전트는 gemini-proxy를 배포하지 않음.** prod는 v25 (`05679653`). staging `qeqszwxjvhnbzhkchera` 배포는 box ops.
- **VERIFY** `npm run test:health` 203 pass.
- **Preview** `https://days-git-cursor-mooni-festival-edge-7c65-catgeots-projects.vercel.app/korea?festival=2930716` — 클라이언트 폴백만. Edge 문장은 staging 배포 후.

## 축제 MOONi Edge #1, QA 마찰 후속

- **세션** 같은 브랜치 `cursor/mooni-festival-edge-7c65` · tip `372a848f` · draft PR [#420](https://github.com/catgeot/Days/pull/420)
- **조치** `이에요`/`예요`는 고치지 않고 `이예요`만 끝자리·받침으로 고친다(`10/15~18이에요`). 숙소 권역은 행사장 약 20km(속초 제외, «편안한 휴식을 위해» 삭제)이고 숙소 링크로 끝낸다. 근처 먹을 곳은 시장·지역 식당이 전국 체인보다 앞. 이어지는 답의 날짜만 있는 끝문장은 뺀다. 첫 답 날짜는 유지.
- **범위** Edge 프롬프트 + 클라이언트. **에이전트는 gemini-proxy를 배포하지 않음.** staging `qeqszwxjvhnbzhkchera` → Cos → prod가 다시 필요. prod는 v25 (`05679653`).
- **VERIFY** `npm run test:health` 204 pass.

## 축제 MOONi Edge #1, 먹을 곳 이름

- **세션** 같은 브랜치 `cursor/mooni-festival-edge-7c65` · tip `dde83ecd` · draft PR [#420](https://github.com/catgeot/Days/pull/420)
- **원인** main 클라이언트는 시트 주변 맛집 이름을 `festivalContext`에 넣지 않아 자유 입력과 칩 모두 목록 없이 묻는다.
- **조치** 먹을 곳 질문(자유 입력·칩)은 주변 맛집 이름을 힌트에 넣고, 목록이 늦게 와도 열린 채팅에 복사한다. «다음 행동으로/다음 행동:»를 빼고, 이름이 있으면 «맛집을 찾아보세요»를 빼며, 숙소 링크는 숙소 질문에만 둔다. Edge 프롬프트 파일은 v27 스냅샷 `2c7a3c95`로 되돌렸다. 주차 문구는 다음 PR.
- **VERIFY** `npm run test:health` 204 pass. 로컬 390px에서 prod gemini-proxy로 2930716 «근처 먹을 곳?»이 100년임당방앗간·만동제과·월화엔을 말했다.
- **병합** #420 squash `e3f4e19a`. prod gemini-proxy는 v27 (`2c7a3c95`).

## 축제 MOONi #2, 라이브 마찰

- **세션** `축제 MOONi #2, 라이브 마찰` · branch `cursor/mooni-festival-live-7c65` · client `b8d24a35` · prompt `fb489241` · draft PR [#423](https://github.com/catgeot/Days/pull/423)
- **원인** MOONi를 연 직후 «근처 먹을 곳?»은 주변 맛집 fetch가 끝나기 전에 나가 이름을 빼거나 중앙시장을 만든다.
- **조치** 먹을 곳 질문은 목록을 최대 3초 기다린다. 답은 시트의 3~4곳에 유형이나 도보 거리를 붙인다. 주차는 데이터가 있을 때만 축제 페이지를 가리키고, 없으면 공식 홈페이지·문의처. 링크 없는 다음 행동과 «안내해 드릴까요?»는 뺀다. 첫 답은 근처 이름이 3곳이면 3곳을 말한다.
- **범위** 클라이언트와 Edge 프롬프트를 커밋만 분리. **에이전트는 gemini-proxy를 배포하지 않음.** staging `qeqszwxjvhnbzhkchera`가 필요한 것은 `templates.js`와 서버 프롬프트 번들. 클라이언트 대기·폴백·힌트는 Preview에서 적용. prod는 v27 (`2c7a3c95`).
- **VERIFY** `npm run test:health` 218 pass.
- **Preview** `https://days-git-cursor-mooni-festival-live-7c65-catgeots-projects.vercel.app/korea?festival=2930716`

## 소셜 축제 입구 #1, 클라 pin·프로모·병합

- **세션** `소셜 축제 입구 #1, pin·프로모·병합` · branch `cursor/social-entry-festival-pin-4768` · tip `0289b88a` · draft PR [#422](https://github.com/catgeot/Days/pull/422)
- **③** 상세 닫기 세션 핀 + 딥링크 `pushViewed` · **②** `socialPromoFestivals.json` 상단 카드(638576·637693) · **①** 목록/검색 병합(`국향`→638576)
- **VERIFY** `npm run test:health` 207 pass · e2e 여행자 경로(로컬 `vite preview` HTTPS, TourAPI LIVE)
- **Preview** `https://days-git-cursor-social-entry-festival-946b77-catgeots-projects.vercel.app/korea/` (Vercel SSO — 사람 QA) · `/qa/` 미등록

## 축제 MOONi 축제 페이지 링크, 라이브 무한 스피너 (긴급)

- **세션** `축제 MOONi 축제 페이지 #1, 라이브 스피너` · branch `cursor/mooni-festival-page-link-4768` · tip `95f2d1d1` · draft PR [#424](https://github.com/catgeot/Days/pull/424)
- **원인** MOONi «축제 페이지»가 인앱이 아닌 외부 네비게이션 + 딥링크 fetch generation 취소 시 `loading` 고착; #422 supplemental ID가 `projectFestivalDeepLink` `items`에 없음; **#2** listLoading·`from=theme&area`가 명승 인근 축제 딥링크를 막거나 URL 삭제
- **조치** `FESTIVAL_PAGE_EVENT` · supplemental 병합 · fetch orphan 복구 · 링크 시 전국 칩 복귀 · listLoading 무시·명승 `?festival=` only · 시트 prefetch·fetch gen
- **VERIFY** `npm run test:health` 221 pass · e2e 4경로 @390 본문 10s 이내(국향 MOONi·2930716·서울·가리산→산천어)
- **Preview** `https://days-git-cursor-mooni-festival-page-link-4768-catgeots-projects.vercel.app/korea`

## 카이로 장소 카드 #1, 확인된 사실

- **세션** `카이로 장소 카드 #1, 확인된 사실` · branch `cursor/cairo-place-facts-8e40` · tip `24e72e9d` · draft PR [#428](https://github.com/catgeot/Days/pull/428) · 병합 금지
- **조치** 도시 6칸·명소 7칸을 카드 맨 위에 두고 빈칸은 «확인 안 됨». AI 구간은 «AI 생성 · 출처 없음». 표에 있는 공식 예매·지도만. GEM·술탄 하산 허브 카드. Edge 코드·DB 실행 없음. 영상 허용 목록 JSON만 두 슬러그 추가.
- **VERIFY** `node --test scripts/health/place-verified-facts.test.mjs` · `audit:city-attraction-hubs` 0 · vite build
- **Preview** `https://days-git-cursor-cairo-place-facts-8e40-catgeots-projects.vercel.app/place/cairo` · `/place/cairo/wiki` · `/place/grand-egyptian-museum` · `/place/sultan-hassan-mosque`

## 축제 가는 법 #1, TAGO Edge

- **세션** `축제 가는 법 #1, TAGO Edge` · branch `cursor/transport-proxy-e06e` · tip `44f3f94c` · draft PR [#429](https://github.com/catgeot/Days/pull/429) · **Edge 미배포** · 병합 금지
- **조치** `transport-proxy`가 국향 638576 · 마산 637693 · 강릉 2930716을 contentId로 정규화. 실측 ID만 호출. AREX는 unverified, 수서 출발은 SR 예매(등급명 유지), 23:59 제거, 운임 0은 null. 광주송정→함평역은 조회 환승.
- **VERIFY** `npm run test:health` 233 pass. 라이브 TAGO 없음.
- **배포** 스테이징만. 함수 `transport-proxy`, 마이그레이션 `20261011160000_tago_route_cache.sql`, 시크릿은 기존 `TOUR_API_SERVICE_KEY`. 프로브 `node scripts/staging/transport-probe.mjs`. Cos GO 전 prod 금지.
