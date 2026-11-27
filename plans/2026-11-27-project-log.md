# 2026-11-27 프로젝트 일지

이전: [`2026-11-26-project-log.md`](./2026-11-26-project-log.md)

## 홈 지구본 드래그 후 자동 회전

- 라이브(PR #947, `723ed038`)에서 드래그·탭 뒤 경도가 멈췄다. WebKit 390은 3초 뒤 lng 24.97 고정, Chromium 1280은 10초 Δlng 0. 새로고침·워치바·월간 카드·로케일·visibility·세션 키는 약 −18°/6s로 돌았다. reduced-motion과 `/place` 라우트는 의도적으로 0.
- 원인: 제스처가 `autoRotateRef`만 끄고 `dragend`/`pointerup`이 되돌리지 않음. 탭의 `flyToAndPin({ focus: false })`도 같다.
- 수정: 제스처 종료 450ms 뒤 기존 재개 조건으로 회전. 코드 `f1268c292` · `cursor/globe-rotate-resume-b8cd` · PR [#951](https://github.com/catgeot/Days/pull/951).
- 로컬 수정 빌드: 드래그 후 10초 WebKit Δlng −29.58, Chromium −30.10. reduced-motion은 0. 기존 프레임 E2E 포함 6 passed.
- 사람 확인: 홈에서 지구본을 한 번 민 뒤 몇 초 안에 다시 도는지, «우주로 복귀» 뒤에도 도는지. 카드가 열린 채 확대된 장소는 기존처럼 멈출 수 있다.
