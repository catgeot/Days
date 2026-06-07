# 2026-06-04 프로젝트 일지 — 3D 투어 Summary 데스크톱 풀 카드 복원

**직전**: [`2026-06-03-project-log.md`](2026-06-03-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## 제품 결정

- **모바일(`<lg`)** 3D 투어: Summary 숨김 + 헤더 **`TourMobileBar`** 컴팩트 UI 유지.
- **데스크톱(`lg+`)** 3D 투어: Summary **풀 카드** 복원 — 설명·「3D 투어」·MOONi 버튼 노출 (`isCompact` prop 제거).

## 구현

- [`index.jsx`](../src/pages/Home/index.jsx): `PlaceCardSummary`에서 `isCompact={isTourActive && !isMobileViewport}` 제거.
- [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md): 제품 목표·SSOT 표 갱신.

## QA

- 로컬 Pass: 데스크톱 투어 중 풀 Summary · 모바일 투어 중 `TourMobileBar`만 표시.

---

## Mapbox 지명 줌 임계값 복원 (2026-06-04)

- **문제**: `PLACE_LABEL_MIN_ZOOM` 2.0 시험(커밋 `305475b`) — 마커와 동시에 Mapbox 지명 노출 → 일반 지명 클릭 시 장소카드 콘텐츠 빈약.
- **복원**: [`globeZoomPolicy.js`](../src/pages/Home/lib/globeZoomPolicy.js) `PLACE_LABEL_MIN_ZOOM = 4.0` — tier 마커 → `HIGH_ZOOM_FULL_REVEAL`(3.0) 전체 여행지 → **4.0+** Mapbox 지명·행정선 (`isPinVisible`·`globeMapboxLabelPolicy` SSOT 유지).

## 3D 투어 — 섬·해변 검은 화면 (2026-06-04)

- **원인**: `globeLandmarks` center가 라군·해상·섬 중앙(산) — 위성 스타일에서 바다=검정.
- **조치**: 몰디브·세이셸·잔지바르·세부 center 육지/해안 POI로 이동 · 사모아·그레이트 배리어 리프·레위니옹 landmark 신규 · `coastalOrbit` `shoreOffset` (세이셸).
- **QA 대기**: 사용자 스모크 — 위 7 slug 3D 투어.

## 3D 투어 — 섬 항공 조망 `islandReveal` (2026-06-04)

- **템플릿**: [`globeTourTemplates.js`](../src/pages/Home/lib/globeTourTemplates.js) `islandReveal` — top-down → pitch 하강 → 짧은 orbit (`islandScale`: small/medium/large/archipelago).
- **landmark**: 몰디브·세이셸·사모아·잔지바르·레위니옹·세부·라로통가·보라카이·보라보라 등 섬 centroid + `islandReveal`.
- **폴백**: `globeTourResolve` paradise + 섬 slug/키워드 → `islandReveal` (그레이트 배리어 리프 등 육지 관문은 `coastalOrbit` 유지).

## 3D 투어 — 섬 진입 (`islandReveal` v4)

- **스폰지/멀미**: off-island ring center → 섬이 화면 가장자리로 밀림. **조망~근접은 center=섬 고정**, zoom/pitch만 변화 · 마지막만 `approachBlend` 14~20% 공항 쪽 nudge.
- **라로통가·코코스**: `coastalOrbit` 유지.
- **몰디브**: `archipelago`·전역 centroid 제거 → **북말레 훌루말레** 단일 초점 · zoom 상향(MLE).

## 3D 투어 — 몰입감 강화 (2026-06-04) — **2026-06-07 복원**

- **문제**: 투어 모드로 진행 시 지도의 구분선(국경, 행정구역)과 많은 지명이 함께 표시되어 몰입감을 저해함.
- **조치(당시)**: `applyPlaceLabelVisibility`에 `!isTourMode` 추가 · `globeTourUi` symbol 숨김.
- **복원(2026-06-07)**: 투어 중에도 홈과 동일한 지명·행정선 정책 · 지명·마커 클릭 허용 · 빈 지도 탭만 차단 — [`2026-06-07-project-log.md`](2026-06-07-project-log.md).

## 보라카이 3D 투어 최적화 (2026-06-04)

- **요구사항**: 사용자가 항공기로 보라카이에 접근하며 섬 전체 조망 → 지형 파악(접근) → 섬 주변 선회(외형 확인) → 주요 명소(화이트 비치)로 마무리하는 시네마틱 패턴.
- **조치**: [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json)의 보라카이 설정을 기존 `islandReveal` 템플릿에서 직접 제어하는 `keyframes` 5단계 배열로 변경함.
  1. 줌 11.0에서 수직에 가깝게 넓은 섬 전체 조망 (`duration: 0`)
  2. 줌 12.0 / 피치 45로 섬으로 부드럽게 다가가며 지형 파악
  3. ~ 4. 섬 상공에서 고도를 낮추고 베어링(Bearing)을 크게 회전시키며 항공기에서 창밖을 보는 듯한 섬 주변 선회(`orbit: true`)
  5. 카메라 중심을 화이트 비치 해안선(`[121.920, 11.963]`)으로 이동하며 줌인하여 주요 명소에 착륙하듯 마무리

## 휴양지 3D 투어 시네마틱 패턴 일괄 적용 및 고도 최적화 (2026-06-04)

- **요구사항**: 보라카이에서 검증된 5단계 항공기 선회 패턴을 다른 대표 휴양/섬 여행지에도 적용. 마지막 착륙 구간에서 카메라가 지표면에 너무 가까워져 지형의 3D 볼륨감이 사라지고 평면적으로 보이는 현상(Clipping/Flattening) 방지.
- **조치**: [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json) 내 `islandReveal` 템플릿을 사용 중이던 대표 휴양지 4곳(보라보라, 세이셸, 잔지바르, 랑카위)을 보라카이와 함께 5단계 `keyframes` 패턴으로 개편 및 파라미터 미세 조정함.
  - 섬 전체 조망 → 고도 하강(접근) → 90도 이상 크게 베어링을 회전하는 선회(`orbit`) → 주요 명소/해안으로 줌인 착륙하는 비행기 창문 밖 시퀀스를 공통으로 적용 완료.
  - **고도 최적화**: 마지막 두 프레임의 과도한 밀착을 막기 위해 최종 프레임의 `zoom`을 평균 1~1.5 낮추고(예: 14.5 → 13.5), `pitch` 상한을 65도에서 55도로 제한하여 공중에서 내려다보는 입체적인 3D 산악/해안 지형의 볼륨감이 유지되도록 보완함.

## 세이셸 3D 투어 착륙 지점 보완 (2026-06-04)

- **문제**: 세이셸(Seychelles)의 마지막 선회 프레임에서 카메라 중심이 섬의 동쪽 해상(`[55.51, -4.62]`)으로 지정되어 있어, 카메라가 육지를 등지고 빈 바다를 향해 착륙하는 현상(섬의 뒤편/바다 조망)이 발생.
- **조치**: [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json)의 세이셸 `keyframes` 경로를 수정함.
  - 마에(Mahé) 섬의 핵심 관광지인 **보발롱(Beau Vallon) 해변**(`[55.43, -4.62]`)을 최종 목적지로 설정.
  - 카메라가 바다 쪽(북서쪽)에서 보발롱 해변과 뒤편의 마에 섬 산맥을 바라보며 들어가도록 베어링(Bearing)을 135도로 조정.
  - 자연스럽게 섬의 윤곽을 훑으며 보발롱 해변으로 진입하도록 각 프레임의 중심점 좌표와 각도를 매끄럽게 연결. 랜드마크 이름도 "Beau Vallon & Mahé"로 명확히 함.

## 섬/휴양지 전체 3D 투어 시네마틱 패턴 100% 전환 (2026-06-04)

- **요구사항**: `islandReveal` 템플릿을 사용 중이던 나머지 모든 섬/휴양지들도 동일한 수준의 시네마틱 선회/착륙 패턴으로 100% 전환.
- **조치**: [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json)의 이비자, 타히티, 세부, 모리셔스, 사모아, 레위니옹 등 6곳의 설정을 5단계 `keyframes`로 업그레이드함.
  - 단순히 템플릿만 교체한 것이 아니라, **각 여행지의 실제 유명 해안이나 핵심 항구**로 종착지(`approachPoint`) 좌표를 정밀 매핑함.
  - 이비자(이비자 타운), 타히티(파페에테), 세부(막탄), 모리셔스(르 모른 브라반트), 사모아(아피아), 레위니옹(생질) 등 지표면/해수면 근처 착륙 시 입체감이 살도록 고도 상한(`zoom: 13.0`, `pitch: 55`) 유지.

## 사모아 3D 투어 시선 및 비행 경로 2차 교정 (2026-06-04)

- **문제**: 사모아 투어 첫 시작 좌표가 우폴루(Upolu) 섬과 사바이(Savai'i) 섬의 중간 해협(`[-172.10, -13.75]`)으로 설정되어 있어, 비행의 시작점이 주요 섬을 벗어나 있었음.
- **조치**: [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json)의 사모아 `keyframes` 첫 시작점과 전체 `center`를 우폴루 섬 중앙(`[-171.75, -13.917]`)으로 수정함.
  - 섬 중앙 상공에서 넓게 내려다보며 시작한 뒤, 북쪽의 아피아 해안선(`[-171.77, -13.83]`)으로 부드럽게 다가가며 선회하도록 `center` 경로를 전면 재조정.
  - 이를 통해 처음부터 끝까지 우폴루 섬의 스케일과 지형에 온전히 집중하는 완벽한 3D 비행이 가능해짐.

## 섬 3D 투어 — 전체 island slug 시네마틱 100% (2026-06-04)

- **요구**: 여행지가 **섬**이면 보라카이와 동일한 5단 항공샷 `keyframes` 패턴.
- **조치**: `buildIslandCinematicKeyframes` SSOT · `globeLandmarks` 잔여 23 slug(발리·제주·몰디브·코모도 등) 전환 · 폴백 `islandCinematic` · `scripts/apply-island-cinematic-keyframes.mjs`.
- **제외**: 하롱베이(카르스트 군도)·블레드(호수 섬)·그레이트 배리어 리프(육지 관문) — `coastalOrbit`/`mountainOrbit` 유지.

