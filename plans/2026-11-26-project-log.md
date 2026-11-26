# 2026-11-26 프로젝트 일지

이전: [`2026-11-13-project-log.md`](./2026-11-13-project-log.md)

## 가는 방법 출발 기본값

- `/place/khao-lak` «가는 방법»이 위치가 카오락이어도 `서울 (ICN)`을 출발로 두던 문제를 고쳤다. 알고 있는 좌표·저장된 위치가 있으면 그 공항을 쓰고, 구간은 숨기지 않는다.
- 코드 `dcac4366d` · 브랜치 `cursor/access-origin-default-2dbb` · PR [#920](https://github.com/catgeot/Days/pull/920).
- 단위 `scripts/health/access-origin-default.test.mjs`는 main 해석기에서 FAIL(ICN), 수정 후 PASS. WebKit E2E `e2e/access-origin-default.spec.js`는 카오락·도쿄·제주를 390·1280에서 PASS.
- 사람 확인: Preview에서 카오락 위치를 둔 뒤 «가는 방법» 칩이 `푸켓 (HKT)`인지, 제주에 있으면 `제주 (CJU)`인지 본다.
