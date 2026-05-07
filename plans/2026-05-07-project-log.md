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

---

## 감정 검색 도입 이후 캐시 분기 진단 (코드 변경 없음, 진단·계획만)

### 문제 정의

감정 검색바 도입 이후, 같은 좌표·같은 도시인데도 위키(`place_wiki`)·플래너(`place_toolkit`)·갤러리(`place_stats`)·영상(`place_videos`)·집계(`recordInteraction`)가 **다시 비어 있는 것처럼 동작**하고 새로 채워지는 빈도가 높아짐. 원인은 감정 검색 그 자체가 아니라 그 이전부터 있던 다음 약점이 트리거된 것.

> **"백엔드 캐시의 `place_id` 컬럼을 프론트가 거의 일관되게 `location.name`(한글 표시명)으로 채우고 있다."**

### 증거 (현재 코드 기준)

- `src/components/PlaceCard/modes/PlaceCardExpanded.jsx`: `const queryKey = location.name;` 으로 위키/플래너 훅 키 결정.
- `src/components/PlaceCard/hooks/useWikiData.js`: `.eq('place_id', String(placeId))` (placeId === location.name).
- `src/components/PlaceCard/hooks/usePlannerData.js`: 동일 패턴.
- `src/components/PlaceCard/hooks/usePlaceGallery.js`: `.eq('place_id', koreanName)` 후 `place_id: koreanName` upsert.
- `src/pages/Home/hooks/useYouTubeSearch.js`: `cacheKey = String(location.name)`.
- `src/shared/api/supabase.js#recordInteraction`: `p_id`로 한글 표시명을 그대로 RPC 전송.

이 한 축이 어긋나면 위 5개 영역이 동시에 새 행으로 갈라짐.

### 같은 좌표를 다르게 부르게 되는 진입 경로

| 진입 | `name` 결정 | 변종 위험 |
|---|---|---|
| `TRAVEL_SPOTS` 카드 클릭 | 정적 `name` | 없음(정답) |
| `citiesData` 매칭 | 정적 `name` | 카드 데이터와 다른 표기 가능 |
| Mapbox 라벨 클릭 | `clickedLabel` 그대로 | 줌/언어 따라 표기 변동 |
| 빈 지도 클릭 → 역지오코딩 | Nominatim 응답 | 동일 좌표라도 응답 표기 변동 |
| 텍스트 직검색(Forward 성공) | 사용자 입력값 그대로 | 오타·축약·다국어가 그대로 키화 |
| AI typo 교정 | AI 한글명 | 같은 곳을 다른 표기로 줄 수 있음 |
| AI mood (감정) 매칭 | AI 한글명 + `pickMoodVariant` 변동 | **같은 입력에도 후보 흔들림** |

특히 `verifyAndNormalizeCandidate`(`useHomeHandlers.js`)는 **좌표만 검증**하고 `name`은 AI 응답 우선으로 둠 → AI가 "쿄토"로 주면 큐레이션 "교토"와 캐시 키가 갈라짐.

### 관리 방안 (단계 분리, 계획 단계)

- **단계 A (프론트만, DB 무변경, 즉효성 큼)**
  - `getPlaceStableId(location)` 헬퍼 신설.
    - 우선순위: `slug` → `city-{lat}-{lng}` → `search-…`/`loc-…` → `geo-{lat.toFixed(3)}-{lng.toFixed(3)}` → 최후로 `name`.
  - `useWikiData`, `usePlannerData`, `usePlaceGallery`, `useYouTubeSearch`, `recordInteraction`, `LogoPanel` 썸네일 로직이 모두 이 헬퍼 결과를 키로 사용하도록 통일.
  - `verifyAndNormalizeCandidate`에 **큐레이션 우선 매칭** 추가: 검증 좌표 ±5km 또는 동일 `name_en`이 `TRAVEL_SPOTS`/`citiesData`에 존재하면 AI 결과를 폐기하고 큐레이션 객체를 사용.

- **단계 B (감정 검색 정체성 마무리, DB 무변경)**
  - `search_dictionary.location_data`에 `canonical_place_key`(=spot.slug 등) 보존.
  - 캐시 적중 시 큐레이션 객체로 그대로 반환 → 감정 입력마다 표기 흔들리는 문제 종결.
  - 큐레이션 매칭 실패 시 `geo-…` 키로 박아 좌표 기준 수렴.

- **단계 C (DB 마이그레이션 — 별도 세션 권장)**
  - 2026-05-04 일지의 Phase A~D 실행: `place_wiki`/`place_toolkit`/`place_stats`/`place_videos` 모두 `place_id`를 stable key로 통일하고 `name_ko`/`name_en`/`lat`/`lng`/`source` 메타 컬럼 추가, RPC 정렬, 한글 레거시 행 백필 또는 폴백 기간 후 정리.

### 결정 사항 (이 세션 추가 합의)

1. **canonical 키 형태**: `slug-first`. 큐레이션(`TRAVEL_SPOTS`) 매칭 시 `slug`(예: `uyuni-salt-flat`), `citiesData` 매칭 시 `slug` 또는 `formatUrlName(name_en)`, 미매칭 시 `geo-{lat.toFixed(3)}-{lng.toFixed(3)}`, 좌표도 없으면 폐기 후보.
2. **중복 처리 규칙**: 같은 canonical 키에 행이 충돌하면 `updated_at` 최신 행이 이김(`newest-wins`). 진 행은 `*_archive` 백업 테이블로 옮긴 뒤 삭제. 즉시 `DELETE` 금지.
3. **AI에게 보낼 표시명(`locationName`) 정책**: 큐레이션 매칭 시 **정식 대표명으로 치환**해서 Edge Function에 전달 (예: `"우유니"` → `"우유니 소금사막"`, `"Kyoto"` → `"교토"`). 동일 canonical 키의 본문이 입력 표기 차이로 흔들리지 않도록 함.
4. **별칭 운영**: `place_alias` 테이블 신설 — `(alias TEXT PRIMARY KEY, canonical_slug TEXT NOT NULL, source TEXT, created_at TIMESTAMPTZ DEFAULT now())`. 런타임 `getPlaceStableId()`와 마이그레이션 스크립트가 동일한 별칭 소스를 참조. 초기 시드는 `keywordData.js` + `travelSpots-list.json` + `citiesData`로 생성, 이후 운영 중 누적 가능.

### 키의 두 가지 역할 (마이그레이션이 건드리는/건드리지 않는 영역)

| 역할 | 의미 | 사용처 | 마이그레이션 영향 |
|---|---|---|---|
| **A. 행 식별자** | DB 캐시 인덱스 | `place_wiki.place_id`, `place_toolkit.place_id`, `place_stats.place_id`, `place_videos.place_id`, `recordInteraction.p_id` | **변경**: 한글 표시명 → canonical slug |
| **B. 검색어 / AI 주제** | Unsplash·YouTube 검색, Edge Function이 AI에게 보낼 `locationName` | `usePlaceGallery.primaryQuery`, `useYouTubeSearch.searchQuery`, `update-place-wiki(locationName)`, `update-place-toolkit(locationName)` | **유지**: 표시명 그대로 사용. 단 큐레이션 매칭 시 정식 대표명으로 치환 (위 결정 3) |

→ 본문 자산(`ai_practical_info`, `essential_guide`, `gallery_urls`, `videos` JSON)은 마이그레이션에서 **재생성하지 않음**. 행의 `place_id` 컬럼만 다시 라벨링.

### 다음 세션 실행 순서 (계획)

1. **단계 A (프론트 정렬, DB 무변경)**
   - `src/pages/Home/lib/getPlaceStableId.js` 신설.
   - 5개 호출부에서 사용: `useWikiData`, `usePlannerData`, `usePlaceGallery`, `useYouTubeSearch`, `recordInteraction` 호출부, `LogoPanel` 썸네일.
   - `verifyAndNormalizeCandidate`에 큐레이션 우선 매칭 추가 (좌표 ±5km / `name_en` 일치).
   - 신 키 조회 실패 시 1회 한글 폴백 조회 (마이그레이션 전 안전판).
2. **단계 B (감정 검색 정체성 마무리)**
   - `search_dictionary.location_data`에 `canonical_place_key` 보존 → 감정 검색 캐시 적중 시 큐레이션 객체 반환.
3. **단계 C (DB 마이그레이션 — 별도 세션)**
   - `place_alias` 테이블 신설 + 시드 SQL.
   - 백업 (4개 테이블 NDJSON 덤프, `scripts/outputs/place_id_backup_YYYYMMDD/`).
   - `scripts/migrate-place-id-to-slug.cjs` (`--dry-run` / `--apply`):
     - alias map 빌드 → 행 순회 → `kept / rekeyed / merged / archived / unresolved` 보고서.
     - `newest-wins` 규칙으로 충돌 해결, 진 행은 `*_archive` 테이블로 이전.
   - `increment_place_stats` RPC도 동일 키 규칙 사용 확인.
4. **검증**
   - "우유니" 입력 → `place_wiki.place_id = "uyuni-salt-flat"` 적중 확인.
   - "교토" / "Kyoto" / "쿄토" 모두 동일 canonical 키로 수렴.
   - 마이그레이션 후 위키/플래너/갤러리 본문이 손실 없이 그대로 노출.

### 산출물

- 본 일지 섹션이 진단·계획의 단일 출처.
- 코드 변경은 이번 세션에 없음. 단계 A 착수 시 별도 커밋 단위로 분리 예정.

