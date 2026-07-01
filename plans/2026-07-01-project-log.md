# 2026-07-01 프로젝트 일지

**직전**: [`2026-06-30-project-log.md`](./2026-06-30-project-log.md)

---

## 장소카드 갤러리 탭 — 모바일 확대 뷰 UX

**상태**: **1차 ✅** · **세부 조정 ⏳**

- **원인**: 모바일 `PlaceChatPanel` 헤더(`z-[180]`)가 미디어 패널(`z-10`) 위에 겹쳐 확대 뷰 닫기·노트 터치 불가.
- **수정 파일**: [`PlaceGalleryView.jsx`](../src/components/PlaceCard/views/PlaceGalleryView.jsx)
  - 모바일·가로 회전 터치 기기 → `document.body` 포털 `z-[9999]`
  - 상단: 사진 노트 + 닫기(X) **한 줄** · 닫기 버튼 시인성 강화
  - 하단: ← · 페이지 · 다운로드 · → (세로) / 가로는 사진 **전면 오버레이**·좌우 ←→
  - `MOBILE_GALLERY_LIGHTBOX_QUERY`: `(max-width:767px)` 또는 `(max-height:500px + landscape + coarse pointer)` — **가로 회전 시 포털 유지**
  - `currentIndex`: id → 참조 → URL fallback
- **커밋**: (아래 git commit 후 SHA 기록)

---

## 갤러리 세션 — 에이전트 핸드오프

### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 1절 유지 규약 · 3절 금지
2. **본 일지** — 「갤러리 세션 — 에이전트 핸드오프」+ 「다음 세션」표
3. [`PlaceGalleryView.jsx`](../src/components/PlaceCard/views/PlaceGalleryView.jsx) — `MOBILE_GALLERY_LIGHTBOX_QUERY` · `renderPhotoViewer({ mobilePortal: true })` 만 (전체 스캔 금지)

### 금지 (3)

1. `travelSpots.js` / `travelSpotAirports.json` 전체 Read·직접 수정
2. 갤러리 외 PlaceCard·헤더 대규모 리팩터 (요청 범위만)
3. 사용자 QA·릴리스 노트 합의 전 「완료」 단정 · `releaseNotes.js` 임의 반영

### 다음 세션 (세부 조정 후보)

| 항목 | 메모 |
|------|------|
| 가로 Unsplash 크레딧 | 현재 `landscape:hidden` — 필요 시 1줄 오버레이 |
| UI 숨김(탭 토글) | `isMobileUIHidden` — 가로에서도 의도 확인 |
| iPad / 좁은 태블릿 | `767px` 경계·포털 vs 데스크톱 분기 |
| 데스크톱 확대 | 패널 내 뷰는 변경 없음 — 요청 시만 |

### 제시어

```
갤러리-이어하기 @plans/2026-07-01-project-log.md

PlaceGalleryView 모바일 포털(세로 거의 OK). 가로·세부 UI 이어 조정.
읽기: .ai-context 1·3절 + 본 일지 핸드오프 + PlaceGalleryView grep만.
금지: travelSpots/Airports JSON 직접 편집 · 범위 밖 리팩터.
```
