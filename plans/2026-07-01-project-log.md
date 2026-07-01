# 2026-07-01 프로젝트 일지

**직전**: [`2026-06-30-project-log.md`](./2026-06-30-project-log.md)

---

## 장소카드 갤러리 탭 — 모바일 확대 뷰 UX

**상태**: **✅ 완료** (사용자 QA 통과 · 2026-07-01)

- **원인**: 모바일 `PlaceChatPanel` 헤더(`z-[180]`)가 미디어 패널(`z-10`) 위에 겹쳐 확대 뷰 닫기·노트 터치 불가.
- **수정 파일**: [`PlaceGalleryView.jsx`](../src/components/PlaceCard/views/PlaceGalleryView.jsx)
  - 터치 기기 확대 → `document.body` 포털 `z-[9999]` · `shouldUseMobilePortal` · body scroll lock
  - **세로**: 메타·닫기 → 사진 → ← · 페이지 · 다운로드 · →
  - **가로**: 사진 전면 + 상·하·좌우 오버레이 · Unsplash 1줄 인라인
  - **그리드 가로**: 개요 숨김 · pt/mt/gap 축소 · 2행 탭 pill 컴팩트
  - `MOBILE_GALLERY_LIGHTBOX_QUERY` · `TOUCH_DEVICE_QUERY` · `currentIndex` id→참조→URL
- **커밋**: `e0d96f1`(1차) · `c1e71b2`(2~5차·QA·핸드오프)

| 차수 | 내용 |
|------|------|
| 2차 | 가로 Unsplash 1줄 · 태블릿 `834px` 포털 · UI 숨김 `matchMedia` |
| 3차 | 그리드 가로 — 헤더 아래 사진 즉시 노출 |
| 4차 | 확대 가로 회전 — `fixed` 셸 · 터치 포털 고정 · scroll lock |
| 5차 | 세로 DOM 순서 복원 (메타·닫기 → 사진 → 하단) |
| 6차 | 확대 포털 **좌우 스와이프** 넘기기 · 탭 UI 토글 충돌 방지 · 릴리스 노트 `2026-07-01` |

---

## 갤러리 — 스와이프 넘기기

**상태**: **✅ 완료** (사용자 QA 통과 · 2026-07-01)

- 모바일 포털 이미지 영역 `touchstart`/`touchend` · 48px·1.25× 가로 우선
- `suppressMobileTapRef` — 스와이프 후 `isMobileUIHidden` 탭 토글 억제
- [`releaseNotes.js`](../src/data/releaseNotes.js) `2026-07-01` 반영
- **커밋**: `97fe854`

---

## 갤러리 세션 — 에이전트 핸드오프 (종료)

### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 1절 유지 규약 · 3절 금지
2. **본 일지** — 「갤러리 세션 — 에이전트 핸드오프」+ 「다음 세션」표
3. [`PlaceGalleryView.jsx`](../src/components/PlaceCard/views/PlaceGalleryView.jsx) — `renderPhotoViewer({ mobilePortal: true })` · `handlePrev`/`handleNext` · `shouldUseMobilePortal` grep만

### 금지 (3)

1. `travelSpots.js` / `travelSpotAirports.json` 전체 Read·직접 수정
2. 갤러리 외 PlaceCard·헤더 대규모 리팩터 (요청 범위만)
3. 사용자 QA·릴리스 노트 합의 전 「완료」 단정 · `releaseNotes.js` 임의 반영

### 다음 세션 — 스와이프 넘기기 ✅

| 항목 | 메모 |
|------|------|
| 목표 | 모바일 확대 뷰에서 **좌우 스와이프**로 이전·다음 사진 (`handlePrev`/`handleNext` 연동) |
| 범위 | `PlaceGalleryView` 포털 이미지 영역 · `isMobileUIHidden` 탭 토글과 충돌 방지 |
| 참고 | 세로·가로 오버레이·포털·scroll lock **유지** · 데스크톱 키보드 ←→는 기존 유지 |
| UX | 임계값·가로 스와이 vs 세로 스크롤 구분 · 첫/끝 사진 no-op |

### 제시어 (보관)

```
갤러리-스와이프 @plans/2026-07-01-project-log.md

PlaceGalleryView 모바일 확대 포털에 좌우 스와이프로 사진 넘기기.
읽기: .ai-context 1·3절 + 본 일지 「다음 세션 — 스와이프」+ PlaceGalleryView grep(handlePrev/Next, mobilePortal).
금지: travelSpots/Airports JSON · 범위 밖 리팩터 · releaseNotes 합의 전 반영.
기존: body 포털·세로 순서·가로 오버레이·탭 UI 숨김 유지.
```

---

## 홈 지구본 — 모바일 카테고리 바·MOONi·Mapbox

**상태**: **✅ 완료** (사용자 QA·세션 종료 · 2026-07-01)

- **모바일**: 카테고리 바 하단 **좌측** · 한글 라벨·시인성(헤일로·테마색 글로우) · 버튼 간격 축소
- **데스크톱**: 카테고리 바 **아이콘+한글 라벨** 상시 표시 · `md:gap-4` 유지
- **MOONi FAB**: 기본 위치 우하단 `{ right: 16, bottom: 32 }` (`gateo_mooni_fab_pos` 저장값 우선)
- **Mapbox**: `attributionControl` compact 복원 · 데스크톱 footer `md:left-[8.75rem]`로 로고 겹침 완화
- **되돌림**: `map.setPadding`·로고 클릭 차단 CSS — 지구본 시야 치우침 방지
- **수정**: `HomeUI.jsx` · `MooniAgentFab.jsx` · `HomeGlobeMapbox.jsx` · `index.css`
- **릴리스 노트**: 초안 대기 (사용자 합의 후 `releaseNotes.js`)
- **커밋**: `97f4fb5`

---

## Mapbox attribution — 모바일 Credits·데스크톱 compact

**상태**: **✅ 완료** (2026-07-01)

- **정책**: Mapbox ToS — 무료 티어도 로고·텍스트 attribution 필수. 모바일은 지도 UI 공간 부족 → **텍스트는 Credits 탭**, 지도에는 **로고만** 좌하단.
- **데스크톱(≥768px)**: `attributionControl={{ compact: true }}` — 홈 지구본·PlaceMiniMap · footer `md:left-[8.75rem]`(로고 겹침 완화).
- **모바일(<768px)**: `.gateo-mapbox-map` CSS로 `.mapboxgl-ctrl-attrib` 숨김 · LogoPanel **Credits** → FooterModal 「기술·지도 출처」(Mapbox/OSM/Maxar 링크 · Telemetry · 기술 스택).
- **SSOT**: [`mapboxAttribution.js`](../src/data/mapboxAttribution.js) · UI [`MapboxCreditsPanel.jsx`](../src/shared/components/MapboxCreditsPanel.jsx)
- **수정**: `HomeGlobeMapbox.jsx` · `PlaceMiniMap.jsx` · `FooterModal.jsx` · `LogoPanel.jsx` · `index.css`
- **주의**: `HomeUI.jsx` — PowerShell `Set-Content`로 UTF-8 깨짐 시 JSX 파싱 오류. **git/에디터 패치만** 사용.
- **커밋**: `f10bed0`

---

## AI 에이전트 — Windows PowerShell 소스 편집 금지

**상태**: **규칙 확정** (2026-07-01)

| 금지 | 이유 |
|------|------|
| PowerShell `Get-Content` → `-replace` → `Set-Content` 로 `.jsx`/`.tsx` 등 수정 | 기본 인코딩·`-NoNewline`으로 **한글 깨짐**, JSX `title="…"` 속성 **따옴표 파손**, Vite esbuild **파싱 오류** |
| 동일 방식으로 UTF-8 BOM 없이 덮어쓰기 | `Login.jsx`·`HomeUI.jsx` 세션에서 재현 — **git checkout 복구** 후 StrReplace/Write만 사용 |

**올바른 방법**: Cursor **StrReplace** / **Write** · git diff 패치 · 사용자 IDE 직접 편집.  
**SSOT**: [`.ai-context.md`](../.ai-context.md) 3절 「Windows/PowerShell 소스 편집 금지」.

---

## 모바일 — 이메일 로그인 후 홈 지구본·UI 비정상

**상태**: **⏳ 배포·실기기 QA 대기** (2026-07-01)

- **증상**: 배포 사이트 · 모바일 · 이메일 로그인 후 홈 복귀 시 지구본 확대·UI 배치 깨짐 (OAuth는 상대적으로 적음).
- **원인**: 로그인 input `text-sm`(14px) → iOS Safari **자동 페이지 줌** 유지 · Mapbox 캔버스가 `innerWidth/Height`만 사용해 `visualViewport`와 불일치.
- **수정**:
  - [`mobileViewport.js`](../src/shared/lib/mobileViewport.js) — `readViewportSize`, `resetIosZoomAfterInput`
  - [`Login.jsx`](../src/shared/Auth/Login.jsx) — input `text-base`, 성공 시 `gateo_reset_viewport` + zoom reset
  - [`Home/index.jsx`](../src/pages/Home/index.jsx) — 홈 마운트 시 플래그로 2차 sync
  - [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) — `visualViewport` resize 리스너
- **릴리스 노트**: 배포 QA 통과 후 사용자 합의 시 `fix` 초안 제시.
- **커밋**: `e2246d7`

---

## 홈 지구본 — 카테고리 버튼 확대 복귀

**상태**: **✅ 완료** (사용자 QA 통과 · 2026-07-01)

- **문제**: 지명 flyTo·수동 확대 후 카테고리 버튼 → 확대 유지 + 권역만 pan → 탐색 맥락 단절
- **수정**: 확대 상태면 **초기 줌·고도 복귀** 후 해당 카테고리 면으로 fly — Mapbox `GLOBE_VIEW.default.zoom`(1.25) · legacy `DEFAULT_ALT`(2.5)
- **수정 파일**: `HomeGlobeMapbox.jsx` · `HomeGlobe.jsx` · `globeCategoryFocus.js`(주석 SSOT)
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) 카테고리 5면 pan 절
- **릴리스 노트**: 갱신 없음 (사용자 요청)
- **커밋**: `d898190`

### 후속 — 모바일·데스크톱 분기 (2026-07-01 ✅)

- **모바일**: 확대 중 카테고리 → 초기 줌·고도 복귀 (유지)
- **데스크톱**: 확대 중 카테고리 → **flyTo 줌·고도**(2.35 / legacy 2.1)로 pan
- **SSOT**: `globeCategoryFocus.js` — `resolveCategoryFaceMapboxZoom` · `resolveCategoryFaceLegacyAltitude`
- **커밋**: `827bc9e`

---

## 홈 지구본 — 초기 로딩 지연 (~7초)

**상태**: **⏳ WIP** — 1·2안 코드 반영 · **배포·체감 QA 대기** (2026-07-01)

- **커밋**: `6037c9d`

### 증상

- PC·모바일 공통: 홈 `/` 진입 시 지구본이 **약 7초 후** 표시 (UI·헤더는 먼저 보임).

### 원인 (파악)

| 구분 | 내용 |
|------|------|
| **직접 원인 (앱)** | `HomeGlobeMapbox` — `isStyleTransitioning` + **`waitingThemeSettleRef`** 가 Mapbox **`onIdle`** 전까지 `tryRevealGlobeBase` 차단 (2026-06-08 지명 플래시 fix `069b95f` 부작용) |
| **1안만으로 무효** | gateo 마커 레이어 분리만으로는 **idle 대기**가 병목이라 체감 단축 없음 (사용자 확인) |
| **Mapbox SDK** | `mapbox-gl@3.20.0` · `react-map-gl@8.1.0` — **2026-06 이후 버전 bump 없음** (위키 통합 `d7ab503` 이후 고정). globe projection + `satellite-streets-v12` 초기 타일·셰이더 부담 |
| **7/1 작업** | 카테고리 바·attribution·mobileViewport — **초기 7초와 무관** |

### 적용 (1·2안)

| # | 내용 | 파일 |
|---|------|------|
| **1** | 베이스(위성 구체) / 오버레이(gateo 지명) 분리 · 마커 레이어 생성 시 `visibility:none` | `globeMarkerLayers.js` · `HomeGlobeMapbox.jsx` |
| **2** | **첫 마운트** `globeTheme` effect theme-settle freeze 생략 · `onLoad`에서 즉시 `tryRevealGlobe()` | `HomeGlobeMapbox.jsx` |
| **+** | Mapbox `preconnect` | `index.html` |

### 다음 세션 (미적용 후보)

| 우선 | 작업 |
|------|------|
| A | 배포 후 **첫 진입** 체감 재측정 (2안 효과) |
| B | DevTools Network — `satellite-streets-v12`·타일 응답 vs `onLoad`/`idle` 타이밍 |
| C | `HomeGlobeMapbox` **dynamic import** (vendor ~686KB gzip 분리) |
| D | 첫 프레임 **가벼운 스타일** → satellite 지연 로드 |
| E | Performance mark — `onLoad` / `idle` / `tryRevealGlobeBase` 구간 수치화 |

### 홈 지구본 로딩 세션 — 에이전트 핸드오프

#### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 1절 · 3절 · 5절 「지구본 로딩」
2. **본 일지** — 「홈 지구본 — 초기 로딩 지연」+ 「다음 세션」표
3. [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) — `tryRevealGlobeBase` · `tryRevealGlobeOverlays` · `globeThemeInitializedRef` grep만

#### 금지 (3)

1. `GLOBE_VIEW.flyZoom`·`HIGH_ZOOM_FULL_REVEAL` 임의 변경 (`.ai-context` 3절)
2. `travelSpots.js` / JSON spots 직접 수정
3. 배포 QA 전 「완료」 단정 · `releaseNotes.js` 임의 반영

#### 제시어 (보관)

```
지구본-로딩 @plans/2026-07-01-project-log.md

홈 Mapbox 지구본 초기 로딩 ~7초 — 1·2안 배포 QA 또는 C~E 최적화.
읽기: .ai-context 5절 + 본 일지 「홈 지구본 — 초기 로딩」+ HomeGlobeMapbox grep(tryRevealGlobe*, globeThemeInitializedRef).
금지: flyZoom/HIGH_ZOOM 변경 · travelSpots JSON · releaseNotes 합의 전.
```
