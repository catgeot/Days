# 2026-05-25 프로젝트 일지 — PlaceCard 미디어 탭 스크롤·줌 · 미크로네시아 플래너 SSOT

**직전**: [`2026-05-24-project-log.md`](2026-05-24-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

- **갤러리·위키·리뷰 탭**: 플래너와 동일하게 모바일 고정 헤더 탭 → 본문 맨 위 스크롤 · `pinch-zoom-scroll` 핀치 줌.
- **공통화**: `placeScrollSurface.js` · `usePlaceMediaScrollToTop` · `PlaceChatPanel` `dispatchPlaceScrollToTop(mediaMode)`.
- 모바일 QA 완료 · `releaseNotes.js` `2026-05-25` 반영.

---

## 미크로네시아 플래너 SSOT (yap·chuuk·kosrae·pohnpei)

- **원인**: 검색(`ruul`/`utwe`) vs 지구본(숫자 id) vs SSOT slug 분리 · DB `place_id` 대소문자(`Ruul`≠`ruul`) 미조회.
- **조치**: `travelSpots` 387–390 등록 · 별칭·공항(YAP/TKK/KOS/PNI) · `getPlaceUrlParam`·좌표 매칭 · `buildToolkitPlaceIdCandidates` 소문자·레거시 id 폴백.
- **DB**: 야프 툴킷 `place_id=ruul` — 삭제 불필요 · 선택 `npm run toolkit:reconcile-place-id`로 `yap` 통일.
- QA: 검색·지구본 → `/place/yap/planner` 등 동일 slug · 플래너 로드 확인.

---

## 모바일 PlaceCard 헤더 네비 터치 (뒤로/홈)

- **증상**: 플래너·갤러리·위키 등에서 스크롤·핀치 줌 후 간헐적으로 뒤로/홈 버튼 무반응.
- **조치**: `PlaceChatPanel` — 뒤로/홈과 헤더 스크롤-맨위 탭 분리 · `z-[180]` · fullscreen 시 `pointer-events-none` · 갤러리 상세에서도 헤더 유지. `PlaceWikiDetailsView` — 모바일 하단 바 스크롤 밖 flex 푸터 · 라이트박스 body 포털. `PlannerTab` — 맨 위 버튼 body 포털.
- 릴리스 노트 미반영(버그 수정 · 사용자 요청).
