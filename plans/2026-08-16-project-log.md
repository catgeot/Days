# 2026-08-16 프로젝트 일지

직전: [`2026-08-13-project-log.md`](./2026-08-13-project-log.md)

## 해안 해양 탐색 #6, 바다 리스트 최적화

**상태**: `cursor/coast-sea-plan-8c05` tip `4c293544` · PR [#118](https://github.com/catgeot/Days/pull/118)  
**세션**: `해안 해양 탐색 #6, 바다 리스트 최적화`

- **증상**: 가용높이 연동 후 해역 칩 수 동일·감소 + 빈 스크롤·지도 체이닝
- **한 일**: `maxListHeightPx` 개수 제한 제거 · `maxCount` 12 · 모바일 `maxHeight`만 · 해역 모드 `justify-end` 해제
- **VERIFY**: `smoke-sea-basin-rail` · `smoke-sea-basin-search` · `audit:sea-basins` · `build`
- **Preview**: `https://days-git-cursor-coast-sea-plan-8c05-catgeots-projects.vercel.app/` — 모바일 바다 탭 QA ✅
- **규칙**: `cloud-preview-continuity` §1.2 제시어 핀 3개 · `feature-handoff-index.md` 추가
- **main 병합**: `origin/main` `bf22da68` — PR #118 feature merge · smoke/audit/build PASS · PROD 배포 후 QA
- **다음 제시어**:

```
해안 해양 탐색 #7, (다음 단계)
@plans/feature-handoff-index.md
@plans/2026-08-16-project-log.md
@plans/coast-sea-explore-plan.md
브랜치 cursor/coast-sea-plan-8c05 · PR #118 · Preview QA
금지: main 새 브랜치 · seaBasins.json 직접 편집 · UI 리디자인 · GLOBE_CATEGORY_IDS에 coast 추가
```

## 해안 해양 탐색 #7, 해역 fill·이름 QA

**상태**: `main` `d014e64e`  
**세션**: `해안 해양 탐색 #7, 해역 fill·이름 QA`

- **증상**: 해역 선택 시 fill ~2초 후 사라짐 · 해역명 미표시
- **한 일**: `syncGateoMarkerLayers` 해역 하이라이트 분기 · fly `moveend` 재적용 · 바다 모드 소권역 auto-sync 차단 · 상단 해역명 pill
- **VERIFY**: `smoke-sea-basin-rail` · `audit:sea-basins` · `build` PASS · `main` push
- **PROD QA**: https://www.gateo.kr/ — 바다 탭 → 해역 선택 → fill 유지·상단 해역명 확인
- **후속**: HTML pill → 지도 심볼 지명 · Mapbox marine 라벨 강조 · `main` push
- **#8**: 소해역 선택 시 칩 리스트·핀 범위 붕괴 — parentOcean bbox pick · 핀 필터 제거(하이라이트만)
- **#9**: 바다 모드 줌·팬 시 칩 축소 — pick 범위 고정(seaRailPickContext) · minSpan · preventShrink

## 해안 해양 탐색 #10 핸드오프 — 계층 리스트·바다버튼

- **요청**: 대양→중위권역→소해역 **고정 계층 리스트** (뷰포트 1줄 동적 칩 대체) · 바다 토글 시인성 1단 하향 · 중분류 칩은 **후순위**
- **SSOT**: `seaBasins` `parentOcean`/`tier` · `seaBasinRail.js` · `GlobeFaceRegionRail.jsx` · `SeaBasinListButton`
- **다음 제시어**: `feature-handoff-index.md` 활성 행 참고

## 해안 해양 탐색 #10, 계층 해역 리스트·바다버튼 톤다운

**상태**: `main` tip (로컬 커밋 대기) · PROD QA  
**세션**: `해안 해양 탐색 #10, 계층 해역 리스트·바다버튼 톤다운`

- **한 일**: `buildHierarchicalSeaBasinRail` 3단(대양·tier2·tier1) · `seaRailPickContext`/`pickVisibleSeaBasins` 레일 경로 제거 · `SeaBasinListButton` prominent 글로우·ring 완화
- **VERIFY**: `smoke:sea-basin-rail` · `audit:sea-basins` · `build` PASS
- **PROD QA**: https://www.gateo.kr/ — 바다 탭 → 1단 대양 4개 고정 · 2단 중위 · 줌/선택 시 3단 소해역 · 바다 버튼 톤 나라 칩과 균형
- **보류**: 중분류 칩(소권역형) — 별 세션

## 해안 해양 탐색 #11, 대양 중분류 칩·바다버튼 제거

**상태**: `main` · PROD QA  
**세션**: `해안 해양 탐색 #11, 대양 중분류 칩·바다버튼 제거`

- **한 일**: `faceSeaOceans.js` 면별 대양 칩( coast 스팟 기반·빈 칩 숨김) · 소권역 바·PC 사이드에 배타 노출 · 레일은 tier2/3만 · `SeaBasinListButton`·`faceRailMode` 제거
- **VERIFY**: `smoke:sea-basin-rail` · `audit:sea-basins` · `build` PASS
- **PROD QA**: https://www.gateo.kr/ — 하단 소권역 옆 대양(지중해 등) 탭 → 레일 해역 · 동남아 탭 → 나라 목록
