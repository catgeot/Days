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

## 월간 카드 장소 이유

- 홈 월간 카드로 연 장소(이번·다음 달 12곳) 소개문 위에 선정 이유·시기·출처 상자를 넣었다. 카드 짧은 문구는 그대로 두고, 장소 페이지에 없던 시기 설명만 공식 출처로 채웠다.
- 코드 `e70467fbb` · 브랜치 `cursor/monthly-place-reason-a9a0` · PR [#929](https://github.com/catgeot/Days/pull/929). CI 46건 통과(run 45780935329).
- 단위 `scripts/health/place-monthly-reason.test.mjs` · WebKit 390 `e2e/home-monthly-place-reason.spec.js`.
- 사람 확인: `/?home_monthly_switch=1`에서 푸꾸옥을 열면 소개문 위에 «11월 건기 시작»과 베트남 관광청 출처가 있는지. `lang=en`이면 «Dry season·Nov». 병합 전이라 프로덕션에는 없다.
