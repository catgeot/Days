# 2026-10-14 프로젝트 일지

이전: [`2026-10-12-project-log.md`](./2026-10-12-project-log.md)

## 축제 카드 #1, 열차 문장·소개 축제

- **브랜치** `cursor/festival-access-promo-5b7f` tip **`f6b622bf`** · draft PR [#462](https://github.com/catgeot/Days/pull/462) · **병합·Edge 배포 없음**. main `d283e814`를 머지해 MOONi 가는 법 문장 변경을 유지했다.
- **열차:** 가장 빠른·가장 싼·하루 횟수 문장. 나머지는 «열차 시간 더 보기». 코레일 아래 Trip.com (`/trains/korail/`). 수서 출발은 SR만.
- **소개 축제:** 이번 달·검색 아님·내 주변 아님. 지역 0건이면 섹션 숨김. 내 주변은 `GATEO 추천` 한 줄. 위치 허용 부트는 시도 칩만 바꿔 강원이면 섹션이 숨는다.
- **검증:** 단위 30 pass · `vite build` · WebKit 390 실클릭(국향 638576, 마산 637693, 강릉 국수 2930716). 강릉커피 825295는 허용 목록 밖이라 카드 없음.
- **Preview** `https://days-git-cursor-festival-access-promo-5b7f-catgeots-projects.vercel.app/korea`

## MOONi #453 스테이징 가는 법 9샷 QA (combo 종료)

- **#453** `cursor/mooni-route-origin-aa3c` tip **`c399efcf`** — E2E: `MOONI_STAGING_COMBO_QA=1` 시 스테이징 `gemini-proxy` read-only 가드 예외 + `e2e/mooni-staging-combo-access-qa.spec.js` (국향/마산/강릉 × 서울·대구·인천). `npm run test:health` 351 pass.
- **검증:** `vite build`(staging URL+anon) → `npx serve -s dist -l 5173` → `http://localhost:5173` · WebKit 390×844 · 9 PNG md5 distinct · README `/opt/cursor/artifacts/mooni-staging-combo-390/` (Cloud 아티팩트).
- **스테이징:** `GEMINI_PROXY_ALLOW_LOCALHOST`·`GEMINI_PROXY_ALLOWED_ORIGINS` unset · localhost Origin **403** 확인.
- **삭제:** `cursor/preview-453-456-combo-aa3c` (remote). #456 tip **`4b9010e1`** 유지·미병합.
