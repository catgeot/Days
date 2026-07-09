# 2026-07-09 프로젝트 일지

**직전**: [`2026-07-07-project-log.md`](./2026-07-07-project-log.md)

---

## 플래너·위키 스마트 링크 → 제휴 홈

**상태**: **✅ QA 통과 (2026-07-09)**

### 내용

- AI `[@브랜드@]` / `한글('English')` 스마트 링크가 제휴 브랜드면 Google 검색 대신 **제휴 홈**으로 연결
- 미매칭(명소·식당 등)은 기존 Google 검색 유지
- 적용: 플래너 `ToolkitCard` · 위키 `PlaceWikiDetailsView` (공통 `CopyableText`)

### 구현

| 파일 | 역할 |
|------|------|
| [`affiliateBrandMatch.js`](../src/utils/affiliateBrandMatch.js) | 별칭 정확 매칭 · `클룩(Klook)` 괄호 병기 분해 |
| [`affiliate.js`](../src/utils/affiliate.js) | Bounce/BikesBooking/GYG/Airalo/Holafly/Trip/Klook 홈 SSOT |
| [`CopyableText.jsx`](../src/components/PlaceCard/common/CopyableText.jsx) | 제휴 홈 우선 · tooltip 분기 |

### 매칭 파트너

Klook · Trip.com · 12Go · Direct Ferries · Airalo · Holafly · Tiqets · GetYourGuide · Bounce · BikesBooking · MyRealTrip  
(Agoda/Booking/GYG short-link 비활성 제외 — GYG는 `partner_id` 직접 홈)

### QA

- [x] `[@Klook@]` · `클룩(Klook)` → 클룩 제휴 홈
- [x] Airalo / Holafly / GetYourGuide → 제휴 홈
- [x] 일반 명소명 → Google 검색 유지

---

## 위키 탭 → 「여행 스케치」(URL `/wiki` 유지)

**상태**: ✅ 구현·문서·커밋 (2026-07-09)

- UI·SEO 표시명만 「여행 스케치」로 교체 (`WIKI` 키·사이트맵 `/wiki` 유지)
- 위키 포토 **클릭 확대(라이트박스)** 를 갤러리 탭 개별 사진 UI와 동일 톤으로 맞춤 (그리드는 기존 비정형 aspectRatio 유지)
- 릴리스 노트 `2026-07-09-2` 반영
- 대상: `PlaceMobileSecondaryNav` · `PlaceChatPanel` · `PlaceCard/index` TAB_METADATA · `SEO` · `PlaceWikiDetailsView`

---

## 여행 스케치 Mapbox → Wikidata 로케이터 지도

**상태**: ✅ 커밋 · 사용자 QA 후 **Mapbox Static으로 교체 결정** (다음 세션)

- 요약 아래 `PlaceMiniMap`(Mapbox GL) 제거 → Wikidata **P242** 정적 이미지
- [`wikiLocatorMap.js`](../src/utils/wikiLocatorMap.js) · [`PlaceWikiLocatorMap.jsx`](../src/components/PlaceCard/common/PlaceWikiLocatorMap.jsx)
- API 스모크: Faroe Islands / Santorini / Bora Bora ✅ · 없는 제목 → 블록 숨김 ✅
- **QA 피드백**: 로케이터 그림만으로는 “어디인지”가 안 읽힘 (축척·라벨·스타일 불균일 · Cancun 등 P242 공백)
- **결정**: 위키 P242는 최선 아님 → **Mapbox Static Images API**로 교체 (아래 핸드오프)

---

## 여행 스케치 정적 지도 세션 — 에이전트 핸드오프

### 완료 (본 세션)

| 항목 | 내용 |
|------|------|
| GL 미니맵 제거 | `PlaceMiniMap.jsx` 삭제 · 홈 지구본 Mapbox **유지** |
| 위키 로케이터 1차 | P242 → Commons `FilePath` · 세션 캐시 · Commons/CC BY-SA 출처 |
| 검토 | P242 ≠ 위치 안내 최적 · Static Images가 목적(대륙 옆·핀)에 맞음 |

### 다음 세션 — 실행 계획 (Mapbox Static)

| 단계 | 내용 |
|------|------|
| **1** | `wikiLocatorMap.js` / Wikidata fetch **제거 또는 미사용** — 좌표 기반 URL 빌더로 교체 |
| **2** | Mapbox Static Images: `styles/v1/{user}/{style}/static/{overlay}/{lon},{lat},{zoom}/{w}x{h}@2x?access_token=` |
| **3** | 입력: `location.lat` / `location.lng` (필수) · 핀 overlay · 줌은 섬/도시 맥락용 고정 또는 간단 휴리스틱 |
| **4** | UI: [`PlaceWikiLocatorMap.jsx`](../src/components/PlaceCard/common/PlaceWikiLocatorMap.jsx)를 Static `<img>`로 개조(또는 리네임) · 밝은/다크 스타일·출처는 Mapbox attribution SSOT |
| **5** | 토큰: 기존 `VITE_MAPBOX_TOKEN` · URL 제한·quota 주의 · `attributionControl={false}` 금지 원칙과 동일하게 **이미지 옆/캡션에 attribution** |
| **6** | QA: 페로 제도(북대서양 맥락) · Santorini · Cancun(P242 없던 곳) · 좌표 없으면 블록 숨김 |

**권장 기본값 (합의 전 제안)**: dark/outdoors 계열 스타일 · 핀 1개 · zoom ≈ 4~6(섬·소국) / 도시 5~7 · 크기 ~1200×640 · `@2x` · 클릭 시 선택적으로 홈 지구본/외부 지도 링크는 **범위 밖**(요청 시만).

**하지 말 것**: Mapbox GL `PlaceMiniMap` 부활 · Wikidata P242 폴백 유지 · `releaseNotes` 합의 전 반영 · 홈 지구본 코드 손대기.

### 읽을 것 (3)

1. `.ai-context` 3절 Mapbox attribution · 5절 미완 한 줄
2. 본 일지 「여행 스케치 정적 지도 세션 — 에이전트 핸드오프」
3. grep: `PlaceWikiLocatorMap` · `wikiLocatorMap` · `VITE_MAPBOX_TOKEN` · [`mapboxAttribution.js`](../src/data/mapboxAttribution.js)

### 금지 (3)

1. `travelSpots.js` / airports JSON 전체 Read·직접 수정
2. 인터랙티브 GL 미니맵 재도입
3. `releaseNotes.js` 사용자 합의 전 반영

### 제시어 (다음 세션)

```
여행스케치-지도-이어하기 @plans/2026-07-09-project-log.md

여행 스케치 요약 아래 지도를 Wikidata P242 → Mapbox Static Images로 교체.
읽기: .ai-context 3·5절 + 본 일지 「여행 스케치 정적 지도 세션 — 에이전트 핸드오프」.
대상: PlaceWikiLocatorMap.jsx · wikiLocatorMap.js(제거/교체) · location.lat/lng · VITE_MAPBOX_TOKEN.
구현: Static URL + 핀 · attribution 캡션 · 좌표 없으면 숨김 · 홈 지구본 무관.
금지: PlaceMiniMap GL 부활 · P242 폴백 · releaseNotes 합의 전 · airports/travelSpots 전체.
QA: 페로 제도 · Santorini · Cancun · 모바일 스크롤.
이전: P242 1차 커밋됨 · 사용자 QA「어디인지 안 보임」→ Static 결정.
```

---

## Cursor 설정 · 로컬 스모크

- User Rule: Thinking/diff 항상 펼침 설정이 생기면 즉시 켜기 · Git Bash 선호
- Cursor `settings.json`: 기본 터미널 **Git Bash** (+ `automationProfile`) — Agent는 Windows에서 PS 강제 가능(알려진 제한)
- `smoke:health` 로컬 실패 원인: Vite **HTTPS(basic-ssl)** 인데 `http://localhost:5173` 호출 → self-signed TLS 거부
- 수정: `scripts/smoke-health.mjs` 로컬 HTTPS 허용·HTTP→HTTPS 폴백 · `npm run smoke:health:local`
