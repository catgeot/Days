# 2026-10-11 프로젝트 일지

직전: [`2026-10-10-project-log.md`](./2026-10-10-project-log.md)

## 축제 MOONi Edge #1, QA 마찰

- **세션** `축제 MOONi Edge #1, QA 마찰` · branch `cursor/mooni-festival-edge-7c65` · tip `63b3a78d` · draft PR [#420](https://github.com/catgeot/Days/pull/420) · base `main` `c60b2b5b` (#419)
- **조치** Edge 프롬프트와 클라이언트 폴백. 숙소 끝줄은 `[강릉 국수 축제 페이지](url)에서 가는 법을 알아보세요`로 합친다. `10/15~18이예요`는 `10/15~18예요`. 근처 먹을 곳은 상세 주변 맛집만 쓰고 생활문화센터·터널은 뺀다. #419 사실·링크·채움 문장 규칙은 유지.
- **범위** Edge+client. 모델 `gemini-3.1-flash-lite`, Fast off. **에이전트는 gemini-proxy를 배포하지 않음.** prod는 v25 (`05679653`). staging `qeqszwxjvhnbzhkchera` 배포는 box ops.
- **VERIFY** `npm run test:health` 203 pass.
- **Preview** `https://days-git-cursor-mooni-festival-edge-7c65-catgeots-projects.vercel.app/korea?festival=2930716` — 클라이언트 폴백만. Edge 문장은 staging 배포 후.
