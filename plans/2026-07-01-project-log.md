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
