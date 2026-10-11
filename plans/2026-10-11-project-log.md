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

## 소셜 축제 입구 #1, 클라 pin·프로모·병합

- **세션** `소셜 축제 입구 #1, pin·프로모·병합` · branch `cursor/social-entry-festival-pin-4768` · tip `0289b88a` · draft PR [#422](https://github.com/catgeot/Days/pull/422)
- **③** 상세 닫기 세션 핀 + 딥링크 `pushViewed` · **②** `socialPromoFestivals.json` 상단 카드(638576·637693) · **①** 목록/검색 병합(`국향`→638576)
- **VERIFY** `npm run test:health` 207 pass · e2e 여행자 경로(로컬 `vite preview` HTTPS, TourAPI LIVE)
- **Preview** `https://days-git-cursor-social-entry-festival-946b77-catgeots-projects.vercel.app/korea/` (Vercel SSO — 사람 QA) · `/qa/` 미등록
