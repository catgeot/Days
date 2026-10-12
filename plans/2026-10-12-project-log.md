# 2026-10-12 프로젝트 일지

직전: [`2026-10-11-project-log.md`](./2026-10-11-project-log.md)

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
