# 2026-11-26 프로젝트 일지

이전: [`2026-11-13-project-log.md`](./2026-11-13-project-log.md)

## 가는 방법 출발 기본값

- `/place/khao-lak` «가는 방법»이 위치가 카오락이어도 `서울 (ICN)`을 출발로 두던 문제를 고쳤다. 알고 있는 좌표·저장된 위치가 있으면 그 공항을 쓰고, 구간은 숨기지 않는다.
- 코드 `dcac4366d` · 브랜치 `cursor/access-origin-default-2dbb` · PR [#920](https://github.com/catgeot/Days/pull/920).
- 단위 `scripts/health/access-origin-default.test.mjs`는 main 해석기에서 FAIL(ICN), 수정 후 PASS. WebKit E2E `e2e/access-origin-default.spec.js`는 카오락·도쿄·제주를 390·1280에서 PASS.
- 사람 확인: Preview에서 카오락 위치를 둔 뒤 «가는 방법» 칩이 `푸켓 (HKT)`인지, 제주에 있으면 `제주 (CJU)`인지 본다.

## 홈 테마 월간 모바일 (#923) — main 병합·MOONi QA 후속

- 브랜치 `cursor/home-theme-monthly-mobile-716c` · head `7ab737d8d` (merge `1af78d0d0` + E2E 보강).
- `origin/main` 병합: #924 MOONi 스냅·#925 인트로/health SSOT 반영; #923 96px 전폭·지구본 메뉴 yield 유지; 중복 `mooniFabBottomClearOfWatchCard` 제거.
- EN 월간 타일 지명: `buildHomeWatchMonthlyDestinations(..., i18n.language)`.
- E2E: `home-monthly-mooni-fab-overlap` 코너 매트릭스 · `home-theme-monthly-mobile` EN·코너 캡처.
- 로컬: overlap 6/6 (chromium+webkit 390), theme monthly mobile PASS, EN destinations PASS; `npm run build` PASS.

## 홈 지구본 자전·카드 리프트 (#947)

- 요약 카드의 Mapbox padding 리프트를 제거했다. 1024px 미만에서는 flyTo 위도만 남쪽으로 옮겨 핀이 카드 위 빈칸에 보이게 하고, 카드를 닫으면 padding 0으로 핀에 다시 맞춘다.
- «지금 볼 거리» 이동은 transform 대신 top. iOS Safari에서 WebGL 조상 transform이 자전을 멈추던 경로와, 우주로 복귀 때 moveend가 안 오면 회전이 안 돌던 경로를 같이 막았다.
- 코드 `206551426` · `cursor/globe-card-offset-b479` · PR #947. E2E `e2e/home-globe-rotate-reset.spec.js` (Chromium 390 · WebKit 390 · Chromium 1280) PASS. typecheck 스크립트는 없다.
