# 2026-05-05 Project Log

이전 일지: [`plans/2026-05-04-project-log.md`](./2026-05-04-project-log.md)

## 오늘 작업 요약

- 홈 글로브를 `react-globe.gl` 단일 엔진에서 **어댑터 기반 이중 엔진** 구조로 전환.
- 신규 파일 `src/pages/Home/components/HomeGlobeAdapter.jsx` 추가:
  - Mapbox 우선 로드
  - `VITE_HOME_GLOBE_ENGINE`, `localStorage(home_globe_engine)`, `?globeEngine=` 오버라이드 지원
  - Mapbox 실패 시 legacy 자동 폴백
- 신규 파일 `src/pages/Home/components/HomeGlobeMapbox.jsx` 추가:
  - `react-map-gl/mapbox` + `projection="globe"` 구현
  - 기존 홈 로직 호환을 위한 ref 메서드(`flyToAndPin`, `resumeRotation`, `pauseRotation`, `resetPins`, `triggerRipple`) 유지
  - 홈 클릭/마커 클릭 계약 유지(`onGlobeClick({lat, lng})`)
- `src/pages/Home/index.jsx`에서 홈 글로브 import를 어댑터로 교체.

## 시각 조정(사용자 피드백 반영)

- deep 테마 스타일을 위성 질감 기반으로 조정:
  - `mapbox://styles/mapbox/satellite-streets-v12`
- 바다 톤이 갈색/회색으로 보이지 않도록 water 계열 레이어 색을 테마별 보정.
- 테마별 fog 프리셋으로 대기/우주 톤을 분리해 deep/bright/neon 차이를 명확히 유지.
- 최종 사용자 결정:
  - 육지 질감은 위성 기반으로 유지
  - 바다는 과하지 않은 딥블루로 보정

## 확인 사항

- 수정 파일 lint 점검: 오류 없음.
- 개발 서버(`npm run dev`) 환경에서 점진 확인 완료.

## 다음 세션 TODO(미세 조정)

- deep 바다 톤 1단계 미세 조정 후보 2안 비교(더 어둡게 vs 채도 소폭 상승).
- 마커 대비(글로우/외곽선) 테마별 튜닝.
- 필요 시 Mapbox Studio 커스텀 스타일 도입 검토(정밀한 해양/육지 색상 제어).
