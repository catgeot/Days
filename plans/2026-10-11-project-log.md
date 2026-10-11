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
- **이어서** `1d88a15a`. main `#427` `48a3efc2` · `#430` `d28d7c4f`를 머지한 뒤, 첫 답에 «강릉 국수 축제 페이지» 링크가 두 번 나오면 마지막 «자세한 내용은 … 페이지에서 볼 수 있어요»만 남긴다. 숙소 앵커는 유지. `npm run test:health` 236 pass.
- **이어서** `6626601b` (client `9b68a7b6`). staging v22 주차 답이 `공식 홈페이지()`로 비었다. 공식 홈페이지와 같은 날 URL은 `[공식 홈페이지](url)`로 바꾸고, 다른 URL은 괄호까지 지운다. 숙소가 한 곳이면 «다양한 숙소가 자리하고 있어요», «매력을 느끼며»를 뺀다. Edge 파일은 프롬프트 커밋에서 바뀜(`templates.js`, 서버 번들). 주차 수정은 클라이언트라 gemini-proxy 재배포 없이 Preview에 있다. 배포·머지 안 함.
- **이어서** tip `6a1954d4` (client `9e2eadc8`). 주차 데이터가 없으면 «주차 안내는 [공식 홈페이지](url)에 있어요. 문의 전화번호»만 남기고 축제 페이지 문장을 뺀다. 숙소는 카드의 이름·거리 2~3곳과 `[숙소 카드]` 한 번, 목록이 없으면 20km 권역. 맛집은 거리 없는 곳을 빼고 거리 있는 다음 곳을 넣는다. `mooni_chat`은 v27과 이 브랜치 모두 기본 FAST `gemini-3.1-flash-lite`. Edge는 `templates.js`와 서버 `mooniPromptBundleData.js`. `npm run test:health` 243 pass. 배포·머지 안 함.
- **이어서** `축제 MOONi #3, 칩 말풍선` · tip `b13bc4f9` (client `5975fb91`). main `#431` `daf8eca4`와 같이 둔다. 칩 말풍선은 «볼거리·분위기 알려 줘»(영문 `Tell me the sights and atmosphere`)이고 지시문은 서버·복원 스레드의 프롬프트로만 남는다. 영어 첫 답은 English (한글), 종료와 다음 회가 근처보다 앞, 출처 없는 분위기 문장은 뺀다. 이번 Edge 파일은 `templates.js`. 주차·숙소·맛집 수정은 유지. `npm run test:health` 249 pass. 배포·머지 안 함.

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

## 카이로 장소 카드 #2, QA 수정

- **세션** `카이로 장소 카드 #2, QA 수정` · branch `cursor/cairo-place-facts-8e40` · tip `635e9dde` · draft PR [#428](https://github.com/catgeot/Days/pull/428) · 병합 금지
- **조치** 출처에서 저장소 경로를 빼고 «GATEO 로그북 (2026-10-03)» (공개 글 URL 없음). 빈 칸은 «확인 안 된 항목» 한 줄. 공항 교통 페이지는 접속 불가라 링크만 제거. 지도 출처·링크는 Google 지도, GEM 예매 문구는 사이트 이름. 헤더 제목은 두 줄. GEM·술탄 하산 표시 이름을 줄임.
- **VERIFY** `node --test scripts/health/place-verified-facts.test.mjs` 6 pass · `audit:city-attraction-hubs` 0 · `check:place-video-catalog` · eslint.ci
- **Preview** 같은 git Preview · `/place/cairo` · `/place/grand-egyptian-museum` · `/place/sultan-hassan-mosque` · `/place/egyptian-museum-cairo` · `/place/cairo/wiki` · `/explore`에서 카이로
- **다음** `카이로 장소 카드 #3, Preview OK면 PR 병합`

## 카이로 장소 카드 #3, 제목 줄바꿈

- **세션** `카이로 장소 카드 #3, 제목 줄바꿈` · branch `cursor/cairo-place-facts-8e40` · tip `3d7a4792` · draft PR [#428](https://github.com/catgeot/Days/pull/428) · 병합 금지
- **조치** 장소 헤더 제목에 `word-break: keep-all`, 긴 한 토큰만 `overflow-wrap: anywhere`.
- **VERIFY** `node --test scripts/health/place-verified-facts.test.mjs` 6 pass
- **다음** `카이로 장소 카드 #4, Preview OK면 PR 병합`

## 카이로 장소 카드 #4, 문장 다듬기

- **세션** `카이로 장소 카드 #4, 문장 다듬기` · branch `cursor/cairo-place-facts-8e40` · tip `1c0bee5e` · draft PR [#428](https://github.com/catgeot/Days/pull/428) · 병합 금지
- **조치** 사실 숫자·시간·출처는 유지하고 해요체와 줄바꿈만. 공항 출처에서 «접속 불가»를 뺌. 동선 «(위 칸)»은 «공항→시내 참고».
- **VERIFY** `node --test scripts/health/place-verified-facts.test.mjs` 6 pass
- **다음** `카이로 장소 카드 #5, Preview OK면 PR 병합`

## 카이로 장소 카드 #5, 제목 칸

- **세션** `카이로 장소 카드 #5, 제목 칸` · branch `cursor/cairo-place-facts-8e40` · tip `2dc2ddf4` · draft PR [#428](https://github.com/catgeot/Days/pull/428) · 병합 금지
- **조치** 표시 이름 «대이집트 박물관»과 헤더 `clamp`. 360·390에서 단어 중간 줄바꿈 없음. D1 문장, CAI 첫 줄 제거. 파일럿 단수 25$·복수 60$는 25달러·60달러. GEM 성인 1,590 EGP 유지.
- **VERIFY** facts health 6 pass · hub audit 0 · 360/390 제목 측정
- **다음** `카이로 장소 카드 #6, Preview OK면 PR 병합`

## 축제 가는 법 #1, TAGO Edge

- **세션** `축제 가는 법 #1, TAGO Edge` · branch `cursor/transport-proxy-e06e` · tip `44f3f94c` · draft PR [#429](https://github.com/catgeot/Days/pull/429) · **Edge 미배포** · 병합 금지
- **조치** `transport-proxy`가 국향 638576 · 마산 637693 · 강릉 2930716을 contentId로 정규화. 실측 ID만 호출. AREX는 unverified, 수서 출발은 SR 예매(등급명 유지), 23:59 제거, 운임 0은 null. 광주송정→함평역은 조회 환승.
- **VERIFY** `npm run test:health` 233 pass. 라이브 TAGO 없음.
- **배포** 스테이징만. 함수 `transport-proxy`, 마이그레이션 `20261011160000_tago_route_cache.sql`, 시크릿은 기존 `TOUR_API_SERVICE_KEY`. 프로브 `node scripts/staging/transport-probe.mjs`. Cos GO 전 prod 금지.

## 축제 가는 법 #2, 프로브 수정

- **세션** `축제 가는 법 #2, 프로브 수정` · branch `cursor/transport-proxy-e06e` · tip `9e9abaa0` · draft PR [#429](https://github.com/catgeot/Days/pull/429) · **Edge 미배포** · 병합 금지
- **프로브** `430827b1` 스테이징은 수치·캐시·SR·운임 0·국향 환승 8회는 PASS. 강릉 인천은 시외 직결 9회라 AREX가 비는 것이 맞는데 프로브가 AREX를 항상 요구했다.
- **조치** AREX 확인은 직결이 없을 때만. `checkedAt`는 KST 조회일, `serviceDate`는 운행일. 옵션 0건 출발지와 0회 환승 다리는 제거. 서울경부처럼 그 출발에서 확인되지 않은 단독 환승 힌트는 내지 않음. 캐시는 키 일괄 SELECT, 미스는 동시 8.
- **추정** warm 200–400ms(이전 2.5–3.5s, 건별 SELECT). cold 4–6s(이전 6–9s, 동시 4→8, TAGO가 하한). 스테이징 재실측 전.
- **VERIFY** `npm run test:health` 235 pass. 라이브 TAGO 없음.
- **다음** 사람이 `transport-proxy`만 재배포 후 프로브. 마이그레이션 변경 없음.

## 축제 가는 법 #3, warm 카드 캐시

- **세션** `축제 가는 법 #3, warm 카드 캐시` · branch `cursor/transport-proxy-e06e` · tip `26f09934` · draft PR [#429](https://github.com/catgeot/Days/pull/429) · **Edge 미배포** · 병합 금지
- **프로브** r2 `eeb544c8`는 기능·cold 4.7–6.0s PASS. warm 1.3–2.1s. 잘못된 contentId 400은 약 0.19s라 나머지 1.1–1.9s는 함수 안.
- **조치** 레이트 리밋 두 RPC와 카드 캐시 SELECT를 병렬. 조립 카드는 `tago_card_cache` (contentId + KST 날짜 + 열차일), KST 자정에 무효, 없으면 노선 캐시. `Server-Timing`: rl, cache, upstream, build. warm 히트는 upstream 0·build 0·cacheHits는 노선 수.
- **VERIFY** `npm run test:health` 237 pass. 라이브 TAGO 없음.
- **배포** 마이그레이션 `20261011180000_tago_card_cache.sql` 후 함수만 재배포. 테이블이 없으면 노선 캐시로 동작한다.

## Safari MOONi 축제 칩 긴급 (#431)

- **세션** LIVE Safari only: 축제 MOONi 첫 답변 후 칩 탭 시 답이 잠깐 보이고 첫 화면으로 복귀 (K-Drone · `2989642`).
- **원인** `ChatModal.jsx` ~L688 `savedTrips`/`chatDraft` 동기화 effect가 칩 턴 중 stale `messages`·빈 festival cache로 로컬 thread 덮어씀 (WebKit 타이밍). #425 이후 `fetchData` 갱신과 겹침. #426 칩 UI는 부차.
- **조치** branch `cursor/safari-mooni-chip-reset-4768` tip `523dd3be` · draft PR [#431](https://github.com/catgeot/Days/pull/431) · 병합 금지
- **VERIFY** `node --test scripts/health/festival-mooni-chat-sync*.test.mjs` · e2e `(a)` logged-in mock: main `8f6c730e` WebKit+Chromium **FAIL**, fix WebKit **PASS** (`korea-mooni-festival-chip-race.spec.js` gate stale refresh in-flight)
- **(b)** tail fingerprint + draft-cache fallback when trip row missing; e2e locale/reopen — Preview/CI에서 재확인
- **QA** Cos conditional PASS `f7778b1c` logged-out WebKit · gate **(a)** merge 전 필수

## 축제 상세 #1, 주변 볼거리 QA 수정

- **세션** `축제 상세 #1, 주변 볼거리 합치기` QA 후속 · branch `cursor/festival-nearby-9654` · tip `1780fc9d` · draft PR [#430](https://github.com/catgeot/Days/pull/430) · 기준 `5c17a3b8` · 병합 금지
- **조치** 팔경 소제목을 없애고 거리순 목록에 «함평 N경» 뱃지만 둔다. 이름 줄기가 겹치고 300m 안이면 한 행으로 합치며 뱃지와 거리를 유지한다. 축제·행사 행(진해군항제, type 15)은 뺀다. MOONi 근처 볼 곳만 팔경·관광 명소가 체험·상업보다 앞이다.
- **함안 구경** SSOT 9곳. 마산 축제의 가까운 허브는 창원이라 좌표 없는 6곳은 넣지 않고, 악양·입곡은 22.3km로 20km 밖이다. 연꽃테마파크 17.4km만 남는다.
- **VERIFY** nearby health 13 pass · `npx vite build` PASS
- **Preview** `https://days-git-cursor-festival-nearby-9654-catgeots-projects.vercel.app/korea?festival=638576`

## 축제 상세 #1, 팔경 소제목 복구

- **세션** 같은 브랜치 `cursor/festival-nearby-9654` · tip `7abc831f` · draft PR [#430](https://github.com/catgeot/Days/pull/430) · 병합 금지
- **사진** 깨진 썸네일은 `display = 'none'` 뒤 아이콘. health `festival-photo-frame` PASS.
- **조치** 일반 목록은 거리순이고 팔경 멤버를 빼다. 2곳 이상인 팔경은 «함평 팔경» 소제목 아래 경 번호순. 1곳뿐인 다른 시·군(함안 5경)은 뱃지만 달아 일반 목록에 둔다. 표시 이름 끝 시군을 빼고, 사진이 없으면 회색 칸 대신 아이콘. 국향·마산 썸네일은 전부 사진이 있고 이전 회색은 로드 전 캡처.
- **VERIFY** nearby health 15 pass · `npx vite build` PASS

## 카이로 동선 #1, 장소 링크·영문 제목·축제장

- **세션** `카이로 동선 #1, 장소 링크·영문 제목·축제장` · branch `cursor/cairo-follow-8e40` · tip `482874e8` · draft PR [#432](https://github.com/catgeot/Days/pull/432) · 병합 금지
- **앞선 병합** #428 squash `ea2b3730`. 당시 PROD 번들 `index-Blpy8VZ_.js`. #432 배포 후 PROD는 `index-NmcBva9f.js`(장소 청크 `index-Dh-1myli.js`). 라이브 `/place/cairo` D2의 GEM은 `/place/grand-egyptian-museum`.
- **조치** 동선 D2/D3의 GEM·술탄 하산 모스크만 장소 카드로 연결. 영문 GEM 제목은 390에서 `Grand Egyptian` / `Museum`. 팔경 멤버가 축제장이면 소제목 옆에 «2경 함평엑스포공원은 축제장이에요».
- **VERIFY** `npm run test:health` 241 pass · CI run `38145911493` success
- **Preview** `https://days-git-cursor-cairo-follow-8e40-catgeots-projects.vercel.app/place/cairo` · `?lang=en` GEM · `/korea?festival=638576`
- **다음** `카이로 동선 #2, 피드백 반영`
- **병합** #432 squash `44a75df5`

## 카이로 동선 #2, 복귀 스크롤·영문 제목·마산

- **세션** `카이로 동선 #2, 피드백 반영` · branch `cursor/cairo-qa-8e40` · tip `d1c0157a` · draft PR [#433](https://github.com/catgeot/Days/pull/433) · 병합 금지 · #432는 수정하지 않음
- **우선** (c) 영문 헤더 버튼 `Planner` · (a) 뒤로 가기 갤러리 스크롤 복원 · (b) 영문 사실 제목만 번역, 값은 한글
- **헤더** QA에서 (a)(b) 통과. (c)는 제목 `min-w-[11rem]` 때문에 390에서 행이 396px, 버튼이 320–408px였다. 제목 칸을 `min-w-0 flex-1`로 줄임. WebKit 390/360 카이로·GEM 한·영에서 버튼 오른쪽은 378·348.
- **마산 637693** LIVE 390, 수정 없음. 제목 3009ms, «주변 볼거리» 4338ms(15곳). `festivalWindow` 1213→2578ms. 이어서 TourAPI 7건과 Supabase bbox가 병렬(supabase 3282ms, 상세 3883–4393ms). 순차 대기가 아니라 정보 탭이 `detailLoading`에 묶여 목록이 상세 뒤에 나왔다. 목록 캐시가 차가우면 시트가 열리기 전에 6초를 넘길 수 있다. 게이트는 유지하고 분리는 #3. 영문 링크 이름·Checked는 이 PR 밖.
- **VERIFY** `npm run test:health` 243 pass · CI run `38182752936` success
- **Preview** `https://days-git-cursor-cairo-qa-8e40-catgeots-projects.vercel.app/place/cairo` · `/place/grand-egyptian-museum?lang=en` · `/korea?festival=637693`
- **다음** `카이로 동선 #3, 마산 주변 볼거리`
- **QA** #433 tip `e2fdf3d5` PASS. 그 브랜치에 추가 커밋 없음. squash `a3b06706`.

## 마산 주변 볼거리 #1, 상세와 분리

- **세션** `카이로 동선 #3, 마산 주변 볼거리` · branch `cursor/masan-nearby-8e40` · tip `7be4d452` · draft PR [#435](https://github.com/catgeot/Days/pull/435) · 병합 금지 · 헤더 미변경
- **원인** 주변 조회는 상세와 병렬인데 정보 탭 전체가 `detailLoading`에 묶여 상세·사진이 끝나야 목록이 그려졌다.
- **조치** 주변 목록만 상세 로딩 중에도 그린다. 상세 행·숙소·맛집은 그대로 상세 뒤에 둔다.
- **WebKit 390** 목록 `li`까지. 수정 전 cold 4796ms · warm 2796ms. 수정 후 cold 3542ms · warm 1359ms. 수정 후 cold는 목록 뒤에도 tourapi-proxy가 6.9s까지 이어졌다.
- **VERIFY** `npm run test:health` 247 pass · CI run `38183479322` success
- **Preview** `https://days-git-cursor-masan-nearby-8e40-catgeots-projects.vercel.app/korea?festival=637693`
- **다음** `마산 주변 볼거리 #2, 피드백 반영`
