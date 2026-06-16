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

## 지구본·플래너 권역 클러스터 — 탐색 UX

- **Phase 3 범례**: 정적 범례 → `GlobeClusterLegend` — 탭 시 주변 관문 여행지 목록 · 항목 클릭 flyTo·장소카드 전환 · 3D 투어 pivot 연동
- **데이터**: `travelSpotClusters.json` **3→31 권역** · **116 slug**(271 중 43%) — 필리핀·발리·베트남·이탈리아·미크로네시아 등 공항 SSOT 기준 확장 · 파타고니아+페닌슬라 발데스
- **플래너**: `RelatedTravelSpots` — 가로 스크롤바 가시성(slate) · 마우스 드래그 스크롤 · 드래그 중 링크 클릭 방지
- **QA**: 사용자 Pass (지구본·플래너)

---

## 항공 시네마 — 에이전트 핸드오프 (Phase 2b · 다음 세션)

**결정 (2026-06-16)**

- **진입점 피벗** — Trip CTA 앞 시네마 ❌ → **써머리「항공 경로」** 미리보기 (Trip·항공권 카드는 완성도 확인 후).
- 라우팅 왕복 없음 · `pauseRender` 예외 · Skip/닫기로 종료.

**구현됨 (WIP · 본 커밋)**

- `globeFlightCinema.js` · `globeFlightCinemaEngine.js` · `FlightCinemaContext` · `FlightCinemaBar` · `HomePlaceCardSummary` · `PlaceCardSummary`「항공 경로」· `HomeGlobeMapbox.startFlightCinema`.

**수정 (세션 내)**

- `setTimeout(performance.now())` 버그 → arc 미재생 — **350ms 상대 지연**으로 수정.
- arc glow·카메라 pullback 제거 · 시네마 중 지구본 dimming 해제.

**알려진 QA 이슈 (다음 세션 우선)**

1. **첫 sapa** arc OK → **2번째 여행지** arc 실패 (점만).
2. PlaceCard·`flightCinemaActiveRef` / engine `active` 잔류 의심.
3. sapa 도착 = **HAN** SSOT (사파 마을 좌표 아님).

**다음 세션 제시어**

```
@.ai-context.md @plans/2026-06-16-project-log.md @plans/2026-06-02-globe-enrichment-plan.md

항공-시네마-이어하기

Phase 2b WIP — 써머리「항공 경로」연속 재생·PlaceCard 간섭 디버그.
첫 sapa OK → 2번째 여행지 arc 실패 · engine/ref/레이어 reset 우선.
완성 후 Trip CTA·항공권 카드 연결.
```

**읽을 것**: `.ai-context` 5~6절 · 본 절 · 계획 §Phase 2b.

**금지**: `flyZoom` 변경 · `navigate('/')` 왕복 · releaseNotes 선반영.
