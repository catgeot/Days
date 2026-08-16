# 2026-08-16 프로젝트 일지

직전: [`2026-08-13-project-log.md`](./2026-08-13-project-log.md)

## 에이전트 핸드오프 — 모바일 해역 연속 탭 (#14)

**세션**: `해안 해양 탐색 #14, 모바일 해역 연속 탭 크래시`  
**브랜치**: `cursor/ocean-chip-crash-1ed2` · **PR [#122](https://github.com/catgeot/Days/pull/122)**  
**Preview**: `https://days-git-cursor-ocean-chip-crash-1ed2-catgeots-projects.vercel.app/` (Mapbox URL 1회 등록)

| | |
|--|--|
| **완료** | 대양·해역 연속 탭 QA 통과 · #14 fix |
| **#16b** | 로그 분석 — 해역 `immediate:false` 900ms fly 누적 → 모바일 해역도 항상 jumpTo |
| **읽을 것** | `index.jsx` `handleSeaBasinSelect` · `HomeGlobeMapbox.jsx` `flyToRegion` · `globeRegionHighlight.js` · 일지 #12·#12b |
| **금지** | 새 브랜치 · `seaBasins.json` 직편집 · UI 리디자인 · computerUse QA |
| **VERIFY** | `smoke-sea-basin-rail` · `build` |
| **QA** | 모바일 Preview — 휴양→태평양→…→지중해 순환 후 각 해역 리스트 5~10회 연속 탭 |

## 모바일 대양 칩 연속 탭 크래시

- **증상**: 지구본 홈 대양 대분류 칩 2회+ 연속 탭 시 모바일 탭 다운
- **원인**: 대양 선택만 fly coalesce·busy 가드 없이 즉시 `flyToRegion` — #12 해역 fix 미적용
- **수정**: `handleTopOceanSelect` coalesce/jumpTo · pending fly 정리 · 대양 fly moveend 중복 생략
- **hotfix**: `clearPendingRegionFlies` TDZ → Preview 검은 화면 (선언 순서 이동)
- **Preview 콘솔 403**: Mapbox 토큰 URL 제한 — 신규 git Preview 호스트(`days-git-cursor-ocean-chip-crash-1ed2-…`) 미등록 · 코드 무관 · Mapbox에 호스트 1회 추가 또는 `www.gateo.kr` QA
- **VERIFY**: `smoke:sea-basin-rail` · `build` PASS · 브랜치 `cursor/ocean-chip-crash-1ed2`

## 큐레이션 모바일 sticky·하단 CTA

**상태**: `cursor/curation-mobile-header-f821` · PR 대기  
**세션**: 큐레이션 모바일 고정 헤더·하단 버튼

- **증상**: 모바일 sticky 바가 상태바(안전영역)까지 확장 · GATEO 바는 PC만 없음 · 하단 「새로운 낙원 찾기」 중복
- **한 일**: `/blog/curation` 모바일 GATEO 바 숨김 · sticky `top: env(safe-area-inset-top)` · 목록 하단 CTA 제거(상단 유지)
- **VERIFY**: `npm run build`

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

## 해안 해양 #11 hotfix — 해역 집중 테스트 크래시

- **증상**: 해역 연속 탭 시 브라우저/사이트 다운
- **원인**: 태평양 `topOceanToFlyRegion` bbox 경도 360° → Mapbox `fitBounds` 폭주 · 모바일 소권역 auto-sync 경쟁
- **수정**: `clampOceanFlyBbox` · 대양 fly zoom 폴백 · ref로 배타 선택 경쟁 차단 · 모바일 레일 auto-sync 제거 · 해역 리스트 뷰 디바운스
- **VERIFY**: `smoke:sea-basin-rail` · `build` PASS

## 해안 해양 탐색 #12, 연속 해역 클릭 크래시

**상태**: `cursor/sea-basin-rail-fly-2ab3` · Preview QA  
**세션**: `해안 해양 탐색 #12, 연속 해역 클릭 크래시`

- **증상**: 휴양·태평양 → 리스트 연속 클릭(남태평양→황해) 시 새로고침·다운
- **수정**: `flyToRegion` generation 토큰 · 대양 선택 시 tier1 리스트 고정 · 해역 fly bbox 클램프 · 120ms fly coalesce
- **VERIFY**: `smoke:sea-basin-rail` · `build` PASS
- **PC QA**: 휴양 → 태평양 칩 → 해역 리스트 연속 클릭(황해 포함) — 새로고침·다운 없음

## 해안 해양 탐색 #12b, 메모리 폭주 완화

- **증상**: 동중국해·남중국해 구간까지 진행 후에도 OOM성 새로고침
- **원인**: fly마다 marine 라벨 전체 스캔·하이라이트 3중 적용·stop() moveend 연쇄
- **수정**: 라벨 강조 스로틀 · 해역 하이라이트 fly 종료 1회 · 연속 탭 jumpTo · 탐색 중 뷰 폴링 정지
- **VERIFY**: `smoke:sea-basin-rail` · `build` PASS

## 해안 해양 탐색 #13, 발견형 해역 확장

**상태**: `main` (push 후 SHA)  
**세션**: `해안 해양 탐색 #13, 발견형 해역`

- **의도**: 수량만 늘리지 않고 여행지와 연결된 덜 알려진 해역(홍해·마스카렌·모잠비크 해협·마카로네시아 등) 탐색
- **한 일**: 해역 3(+홍해 tier1 승격·페르시아만 tier2) · coast 링크 15곳 재배치 · 스모크 발견형 게이트
- **VERIFY**: `audit:sea-basins` · `smoke:sea-basin-rail` · `build` PASS
