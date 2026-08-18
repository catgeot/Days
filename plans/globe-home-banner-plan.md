# 지구본 홈 동적 배너

**주제**: 좌상단 축제·명소 전광판  
**브랜치**: `cursor/globe-banner-8ec9`  
**PR**: #131 (draft)

## 범위

- 축제: TourAPI rolling12 → 장기(60일·키워드) 제외 → 진행 중 → 이번 주 → 이번 달, 시작일 최신, 최대 3
- 명소: `cityAttractionHubs` hub 명소 일별 로테이션 (GPS·지자체 N경 SSOT는 추후)
- 큐레이션: **제외** (사용자 결정)
- UI: 로고·바로가기 하단, 한 줄 혼합 마키, Zen 숨김

## 코드 SSOT

| 파일 | 역할 |
|------|------|
| `src/pages/Home/components/GlobeHomeMarqueeBanner.jsx` | 마키 UI (우→좌) |
| `src/pages/Home/hooks/useGlobeHomeBanner.js` | 데이터 fetch |
| `src/pages/Home/lib/globeBannerContent.js` | pick·mix 로직 |
| `scripts/smoke-globe-home-banner.mjs` | 스모크 |

## 미결 (다음 세션)

- GPS 허용 시 근접 hub 명소
- GPS 없음/해외 폴백
- 지자체 N경 전용 SSOT
- 명소 클릭: 허브 목록 vs 상세
- 모바일 QA 확정 후 속도 미세 조정

---

## §9 핸드오프

| | |
|--|--|
| **세션** | 지구본 홈 배너 #2 |
| **브랜치** | `cursor/globe-banner-8ec9` |
| **PR** | https://github.com/catgeot/Days/pull/131 |
| **Preview** | `https://days-git-cursor-globe-banner-8ec9-catgeots-projects.vercel.app/` |
| **QA** | `/` 좌상단 — 바로가기 하단 마키, 모바일 우선 |
| **VERIFY** | `npm run smoke:globe-home-banner` · `npm run build` |
| **금지** | 큐레이션 레인 추가 · UI 임의 리디자인 · 새 Preview 브랜치 |

**완료 (#1)**: MVP 마키, 축제 pick, hub 명소, 100s→**32s** 속도 조정, 우→좌 방향 유지.

**다음 (#2)**: Preview 모바일 QA → GPS 근접 명소 → 속도/레이아웃 피드백 반영.
