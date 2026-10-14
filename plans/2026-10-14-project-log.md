# 2026-10-14 프로젝트 일지

이전: [`2026-10-12-project-log.md`](./2026-10-12-project-log.md)

## MOONi #453 스테이징 가는 법 9샷 QA (combo 종료)

- **#453** `cursor/mooni-route-origin-aa3c` tip **`c399efcf`** — E2E: `MOONI_STAGING_COMBO_QA=1` 시 스테이징 `gemini-proxy` read-only 가드 예외 + `e2e/mooni-staging-combo-access-qa.spec.js` (국향/마산/강릉 × 서울·대구·인천). `npm run test:health` 351 pass.
- **검증:** `vite build`(staging URL+anon) → `npx serve -s dist -l 5173` → `http://localhost:5173` · WebKit 390×844 · 9 PNG md5 distinct · README `/opt/cursor/artifacts/mooni-staging-combo-390/` (Cloud 아티팩트).
- **스테이징:** `GEMINI_PROXY_ALLOW_LOCALHOST`·`GEMINI_PROXY_ALLOWED_ORIGINS` unset · localhost Origin **403** 확인.
- **삭제:** `cursor/preview-453-456-combo-aa3c` (remote). #456 tip **`4b9010e1`** 유지·미병합.
