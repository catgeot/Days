# 2026-05-07 Project Log

이전 일지: [`plans/2026-05-06-project-log.md`](./2026-05-06-project-log.md)

## 오늘 작업 시작

- 아레키파(`Arequipa`) 여행지의 투어 상품 링크 소스를 확인.
- 확인 결과: 마이리얼트립/클룩(`Klook`)에서는 즉시 적용 가능한 투어 상품 링크를 찾지 못함.
- 대체 소스로 GetYourGuide 도시 위젯 링크를 확보하여 운영 후보로 기록.

## 수집한 위젯 코드

```html
<div data-gyg-href="https://widget.getyourguide.com/default/city.frame" data-gyg-location-id="2859" data-gyg-locale-code="ko-KR" data-gyg-widget="city" data-gyg-partner-id="LRKVVU4"></div>
```

## 적용 완료

- `GetYourGuideCityWidget`의 도시 매핑에 아레키파(`location-id: 2859`)를 추가.
- `map_poi` 카드의 GYG 전용 노출 키 목록에 `arequipa`/`아레키파`를 추가해, 해당 여행지에서는 기존 외부 링크 버튼 대신 GYG 위젯만 노출되도록 반영.
- 장소 카드 헤더 표기 로직을 보강해, 상단 주표기가 영문일 때 하단 보조 표기는 한글(`curation_data.location`)을 우선 노출하도록 변경.
- 하드코딩 여행지 목록 fallback을 제거하고, Mapbox 클릭 시 역지오코딩을 `en`/`ko`로 병렬 조회해 `name_ko`를 실시간 주입하도록 개선.
- 장소 카드(요약/확장) 헤더의 보조 지명 텍스트를 더 밝고 선명하게 조정하고, 주/보조 지명 탭 시 클립보드 복사 기능을 추가(모바일 포함).

## 다음 세션 TODO

- Mapbox 지명 라벨 클릭 감지: `queryRenderedFeatures(point, { layers: placeLabelLayers })` 기반으로 라벨 클릭 시 해당 지명 우선 선택.
- 클릭 우선순위 분리: `마커 클릭 > 라벨 클릭 > 빈 지도(좌표 역지오코딩)` 순서로 이벤트 처리.
- 라벨 노출 줌에서 UX 안내 문구(짧은 토스트/힌트) 추가 여부 검토.
