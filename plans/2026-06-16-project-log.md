# 2026-06-16 프로젝트 일지

**이전**: [`2026-06-15-project-log.md`](./2026-06-15-project-log.md)

## 써머리 장소카드 — 긴 지명·MOONi CTA

- **문제**: 여행지명이 길면 즐겨찾기·닫기 버튼이 밀려 사라짐
- **조치**: `PlaceCardSummary` 헤더 flex — 제목 `min-w-0 flex-1 truncate` · 버튼 `shrink-0` · `title` 툴팁
- **CTA**: 「MOONi에게 물어보기」→ **「MOONi」** (써머리 카드만)
- **QA**: 사용자 Pass

## 3D 투어 — 카보베르데(cape-verde) Sal 섬 조망

- **문제**: `travelSpots` 핀이 군도 해상 중심(16.54°N, 23.04°W) → 투어 카메라가 바다를 바라봄
- **조치**: `globeLandmarks.json` `cape-verde` — Sal Island(SID) 중앙·Santa Maria keyframes · `ISLAND_TOUR_SLUGS` 등록 · `scan-tour-ocean-mismatch` 동기화
- **가이드**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) QA·얇은 atol 예시 갱신
- **QA**: 사용자 Pass

## 꼬꼬무 연관 여행지 — 홈·갤러리 탐색 SSOT

- **홈**: 좌측 연관 검색어 `KEYWORD_DB` → `getRelatedPlaces`(4 연관 + 1 교두보) · 갤러리와 동일 UI(Compass/Sparkles)
- **갱신 규칙**: 연관 4곳 클릭 → flyTo·카드만 · **교두보(푸시아)만** 새 5개 세트 · 지구본·URL 직접 진입은 전체 갱신
- **갤러리**: `PlaceChatPanel` state SSOT · 탭 전환 시 목록 고정(선행 커밋 `db2ee02`) + 교두보만 갱신 동일 적용
- **QA**: 사용자 Pass
