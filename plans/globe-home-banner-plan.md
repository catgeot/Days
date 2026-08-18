# 지구본 홈 동적 배너

**주제**: 좌상단 축제 전광판 + 명소 별도 배너  
**브랜치**: `cursor/globe-banner-8ec9`  
**PR**: #131 (draft)

## 범위

- 축제: TourAPI rolling12 → 장기(60일·키워드) 제외 → 진행 중 → 이번 주 → 이번 달, 시작일 최신, 최대 3 — **기존 좌상단 마키**
- 명소: `cityAttractionHubs` hub 명소 일별 로테이션 — **별도 배너** (정위치 전 임시: 모바일 검색 아래·PC 우하단)
- 큐레이션: **제외** (사용자 결정)
- UI: 축제 마키는 로고·바로가기 하단 · Zen 숨김 · **혼합 레인 없음**

## 코드 SSOT

| 파일 | 역할 |
|------|------|
| `src/pages/Home/components/GlobeHomeMarqueeBanner.jsx` | 마키 UI (우→좌) · `lane=festival\|scenic` |
| `src/pages/Home/hooks/useGlobeHomeBanner.js` | 레인별 fetch |
| `src/pages/Home/lib/globeBannerContent.js` | pick 로직 (`mix*`는 헬퍼만, UI 미사용) |
| `scripts/smoke-globe-home-banner.mjs` | 스모크 |

## 미결 (다음 세션)

- 명소 배너 **정위치** (사람 QA 후)
- GPS 허용 시 근접 hub 명소
- GPS 없음/해외 폴백
- 지자체 N경 전용 SSOT
- 명소 클릭: 허브 목록 vs 상세
- 모바일 QA 확정 후 속도 미세 조정

---

## §9 핸드오프

| | |
|--|--|
| **세션** | 지구본 홈 배너 #3 |
| **브랜치** | `cursor/globe-banner-8ec9` |
| **PR** | https://github.com/catgeot/Days/pull/131 |
| **Preview** | `https://days-git-cursor-globe-banner-8ec9-catgeots-projects.vercel.app/` |
| **공유** | `https://www.gateo.kr/qa/globe-banner` |
| **QA** | `/` 좌상단 **축제만** · 우측 **명소**(임시) · 탭 이동 |
| **VERIFY** | `npm run smoke:globe-home-banner` · `npm run build` |
| **금지** | 큐레이션 레인 추가 · UI 임의 리디자인 · 새 Preview 브랜치 |

**완료 (#1–#2)**: MVP 마키, 축제 pick, hub 명소, 100s→**32s**, 우→좌.

**완료 (#3)**: 축제·명소 **레인 분리**. 축제는 기존 좌상단. 명소는 임시 위치(모바일 검색 아래·PC 우하단)에서 동작 확인.

**다음 (#4)**: 사람 모바일 QA → 명소 정위치 → GPS 근접 명소 → 지자체 N경 SSOT.
