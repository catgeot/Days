# 2026-10-06 프로젝트 일지

직전: [`2026-10-02-project-log.md`](./2026-10-02-project-log.md)

## place_intro Edge 잘림 (draft)

- **세션** Edge `place_intro` MAX_TOKENS · branch `cursor/place-intro-edge-truncation-9145` · tip `7ac1255b` · draft PR [#397](https://github.com/catgeot/Days/pull/397)
- **조치** `maxOutputTokens` 512→2048, Gemini 3.x는 `thinkingLevel: "low"`(2.5만 `thinkingBudget: 0`). `MAX_TOKENS`·빈 본문·문장 미완은 502 `{error:"truncated"}`이고 본문을 넣지 않음. 헬스 프로브에 `mid_sentence_end`·`too_short`. 클라이언트 게이트는 main `02e15b01`. Edge는 배포하지 않음. 롤백 대상 **v20**.
- **VERIFY** `deno test` proxy_test+call_test 34 pass · `node --test scripts/health/mooni-intro-leak.test.mjs` 3 pass
- **다음** staging `gemini-proxy` → prod. `review_draft`(768)·`curation`(1024)은 같은 QUALITY 모델이나 이번 로그 증거가 없어 한도 유지. `MAX_TOKENS`가 보이면 후속.
