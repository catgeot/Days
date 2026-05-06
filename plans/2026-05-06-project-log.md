# 2026-05-06 Project Log

이전 일지: [`plans/2026-05-05-project-log.md`](./2026-05-05-project-log.md)

## 오늘 작업 요약

- 홈 Mapbox 글로브의 여행지 라벨을 지도 지명과 조화되는 텍스트형 스타일로 재설계.
- 기존 pill/배경 중심 마커를 정리하고, 라벨 가독성을 위해 본문 색상은 중성 계열로 통일.
- 카테고리 구분은 점(`•`) 색상 중심으로 유지하고, `urban`/`culture` 색을 확실히 분리.
- 점 크기를 텍스트 대비 2배 수준으로 키우고 색 대비를 강화해 시인성을 개선.
- 라벨 HTML 생성부에 `escapeHtml`을 추가해 이름 문자열 안전성을 보강.

## 글로브 노출 정책 변경

- 여행지 표시를 동적 겹침 계산 방식 대신 **줌 단계 기반 3단계 정책**으로 단순화.
  - 1단계(기본): `showOnGlobe !== false` 여행지 노출
  - 2단계(중간, `zoom >= 2.35`): 숨김 여행지 중 `tier <= 1` 또는 `popularity >= 90` 추가
  - 3단계(전체, `zoom >= 3.15`): 숨김 포함 전체 여행지 노출
- 지도 기본 지명(`PLACE_LABEL_MIN_ZOOM = 3.5`)이 나오기 전에 우리 여행지 라벨이 먼저 충분히 보이도록 임계값을 조정.

## 확인 사항

- 수정 파일 lint 점검 완료: 오류 없음.
- 개발 서버(`npm run dev`)에서 사용자 피드백 기준으로 단계별 시각/노출 동작 확인.

## Home Mapbox 마커 최적화 후속 튜닝 (야간 세션)

- 사용자 핀 로직은 즐겨찾기 중심 운영으로 정리하고, 핀 생성 커밋(`fc7eb76`)을 `git revert`로 되돌림.
- `HomeGlobeMapbox` 마커 노출을 **tier + 근접 병합 + 2차 충돌 완화** 구조로 재편, 밀집 구간에서 겹침을 줄이면서 기본 화면 가독성을 확보.
- 테마/카테고리 경계는 **초기·중간 줌에서는 유지**, `HIGH_ZOOM_FULL_REVEAL = 3.0` 이상에서만 전체 여행지(`allTravelSpots`)를 개방하도록 분리.
- 기본 지명 임계값은 `PLACE_LABEL_MIN_ZOOM = 4.0`으로 상향해, 지명 과밀 전 마커 탐색 시간을 확보.
- 고줌 전체 개방 구간에서는 `showOnGlobe` 제한과 병합 강도를 풀어 원본 여행지 노출을 우선하고, 중저줌에서는 병합/충돌 완화로 시야를 정리.
- 다음 데이터 증설 대응 포인트: `TIER_STAGE_ZOOM_LEVELS`, `HIGH_ZOOM_FULL_REVEAL`, `getMajorMergeThreshold()`, `getMarkerCollisionThreshold()` 4개 임계값만 우선 조정하면 빠르게 균형 복구 가능.

## PlaceCard 영문명 + GetYourGuide 위젯 운영 반영 (심야 세션)

- 요약 카드(`PlaceCardSummary`)와 확장 카드 헤더(`PlaceChatPanel`)에 여행지 영문명(`name_en`/`curation_data.locationEn`)을 제목 하단 보조 라인으로 노출.
- `index.html` `<head>`에 GetYourGuide Analytics 스크립트(`pa.umd.production.min.js`, `partner-id=LRKVVU4`)를 추가해 위젯 유입 추적 기반을 활성화.
- 플래너 `map_poi` 카드에 `GetYourGuideCityWidget`을 추가하고, 지역별 `location-id` 매핑(에베레스트/코스타리카/갈라파고스/파타고니아)을 구성.
- 운영 정책: GYG 위젯 대상 여행지는 `map_poi`의 기타 링크 버튼(구글맵/Klook/MRT/다이닝)을 숨기고 위젯만 노출.
- 홈 복귀 시 지구본이 좌상단에 축소되는 이슈를 `HomeGlobeMapbox`의 `pauseRender` 복귀 타이밍 `map.resize()` 이중 보정으로 수정.
