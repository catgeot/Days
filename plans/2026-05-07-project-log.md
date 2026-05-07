# 2026-05-07 Project Log

이전 일지: [`plans/2026-05-06-project-log.md`](./2026-05-06-project-log.md)

## 밤 세션 추가 반영 (감정 중심 검색바)

- 홈 검색바와 탐색 모달 안내 문구를 여행지 직접 입력 톤에서 감정/느낌 입력 톤으로 전면 전환(`느낌으로 검색`, 감정 문장 예시 중심).
- 검색 AI를 오타 교정 중심에서 감정-여행 매칭 큐레이터로 승격하고, 장소카드 설명에 추천 이유(`reason`)를 결합해 "왜 이곳인지"를 안내하도록 보강.
- 허구 지명 방지를 위해 AI/캐시 후보 모두 재지오코딩 + 거리 검증 게이트를 통과한 경우만 지도 핀으로 반영하도록 안전장치 적용.
- `search_dictionary`는 스키마 변경 없이 `location_data` JSON 내부에 `intent_type`, `variants`, `served_count`, `last_served_at`를 저장해 오타(결정적)와 감정(확률적) 캐시 전략을 분리.
- 감정 입력 분류 키워드(`MOOD_HINT_KEYWORDS`)를 한국어 실사용 표현(멘붕/현타/충전/도망가고 싶다 등) 중심으로 확장해 인식률 강화.

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

## 저녁 추가 반영 (UX)

- Mapbox 클릭 우선순위를 `마커 > 라벨 > 빈 지도(역지오코딩)`으로 분리하고, 라벨 클릭 시 장소카드는 한글 표시를 유지하면서 URL은 영문 slug 우선으로 정렬.
- 지도 직접 클릭은 카메라 이동 없이 탐색을 유지하고, 검색/카드/탐색에서 유입된 장소 선택은 홈 복귀 시 해당 좌표로 재포커스되도록 `focus` 옵션 기반 분기 적용.
- `pauseRender` 상태에서 누락되던 포커스를 `pendingFocus` 큐로 보정해 복귀 시점에 안정적으로 적용되게 수정.
- `/place`, `/explore` 진입 시 지구본 렌더를 확실히 멈추도록 pause 조건을 라우트 기준으로 확장.
- `HomeGlobeMapbox`의 `onIdle` 무거운 레이어 재스캔을 제거해 장소카드 뒤로가기/연관키워드 전환 시 체감 지연을 완화.
- 장소카드 헤더에 홈 바로가기(지구본 아이콘) 버튼을 추가하고, 뒤로가기 버튼 대비를 높여 시인성을 개선.

## 다음 세션 TODO

- 라벨 노출 줌에서 UX 안내 문구(짧은 토스트/힌트) 추가 여부 검토.
- 필요 시 `pendingFocus`를 place id 기준 마지막 요청 1건만 유지하도록 추가 디바운스 검토.
