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

## 추가 반영 (야간 세션)

- Mapbox 글로브 인터랙션 안정화:
  - 초기 로드 직후 첫 입력이 클릭으로만 소비되던 문제를 해결하기 위해 포인터 시작 시 자동회전을 즉시 멈추고 상호작용 상태를 우선 적용.
  - `clickTolerance` 및 드래그 직후 클릭 가드로 오클릭 감소.
- 지명/도로/경계선 표시 정책 재정의:
  - 지명은 확대(`PLACE_LABEL_MIN_ZOOM`) 시에만 표시.
  - 도로/POI/행정경계(`Administrative boundaries`)는 스타일 재로딩 이후에도 숨김 유지되도록 레이어 가시성 + `basemap` config를 병행 적용.
- 모드 정책 최종 확정:
  - 기본 모드(`deep`)는 위성 기반 스타일로 유지.
  - `bright`는 표준 지도 기반, `neon`은 위성 계열 유지.
  - `deep`에 은은한 푸른 윤곽 대기(네온보다 약함) 적용, `neon`은 바다 톤을 더 밝게 조정.

## 다음 세션 TODO(미세 조정)

- deep 바다 톤 1단계 미세 조정 후보 2안 비교(더 어둡게 vs 채도 소폭 상승).
- 마커 대비(글로우/외곽선) 테마별 튜닝.
- 필요 시 Mapbox Studio 커스텀 스타일 도입 검토(정밀한 해양/육지 색상 제어).

## 추가 반영 (UX 세부 조정 2차)

- 글로브 장소 선택 시 `flyTo`를 중지해, 사용자가 크게 확대한 상태에서도 오클릭 후 탐색 맥락을 유지하도록 변경.
- 글로브 우측 빠른 액션 버튼(공유/현재 위치/우주 복귀) 추가:
  - 공유: iOS 공유 박스 스타일에 가깝게 아이콘 미세 조정(박스 폭/화살표 비율 포함).
  - 현재 위치: iPhone 스타일 화살표(초록 계열)로 시각 톤 통일.
  - 우주 복귀: 지구본 아이콘(블루 계열) 적용 및 아이콘 크기 확대.
- 버튼 클릭 이슈 수정:
  - 상위 레이어/티커가 클릭을 가로채던 문제를 `z-index` + `pointer-events` 분리로 해결.
- 데스크톱 상단 레이아웃 재정렬:
  - `눈/휴지통`을 좌측 상단 테마/Zen 그룹 옆으로 이동.
  - 기존 `눈` 영역에는 우측 액션 3버튼(공유/위치/지구본) 배치.
  - 좌측 아이콘 그룹 간격을 늘려 시각 밀집도 완화.
- PlaceCard 반응형 정책 변경:
  - 태블릿에서 데스크톱 2단으로 보이던 레이아웃을 모바일 스타일로 유지하도록 `md -> lg` 브레이크포인트 상향.
