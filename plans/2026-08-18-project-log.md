# 2026-08-18 프로젝트 일지

직전: [`2026-08-17-project-log.md`](./2026-08-17-project-log.md)

## 지구본 홈 배너 #1–#2, MVP · 마키 속도 조정

**세션**: `지구본 홈 배너 #1` MVP → `#2` 속도·핸드오프  
**브랜치**: `cursor/globe-banner-8ec9` · PR #131 (draft)  
**적용**: 좌상단 축제·명소 혼합 마키(우→좌), 바로가기 하단, 60일·키워드 장기 축제 제외, hub 명소 로테이션  
**속도**: 100s → **32s**/바퀴 (뉴스 크롤 통상)  
**VERIFY**: `smoke:globe-home-banner` · `build` PASS  
**Preview**: `https://days-git-cursor-globe-banner-8ec9-catgeots-projects.vercel.app/`  
**남은 일**: 모바일 QA · GPS 근접 명소 · 지자체 N경 SSOT

## 지구본 홈 배너 #3, 축제·명소 레인 분리

**세션**: `지구본 홈 배너 #3, 모바일 Preview QA`  
**적용**: 축제는 **기존 좌상단 마키만**. 명소는 **별도 배너**(임시: 모바일 검색 아래 · PC 우하단). 혼합 레인 제거.  
**QA**: Preview `/` — 좌상단 축제 탭 → `/korea?festival=` · 우측 명소 탭 → `/korea/theme/scenic`  
**VERIFY**: `smoke:globe-home-banner` · `build`  
**Preview**: `https://days-git-cursor-globe-banner-8ec9-catgeots-projects.vercel.app/`  
**공유**: `https://www.gateo.kr/qa/globe-banner`

**에이전트 핸드오프 (#4)**  
- 읽을 것: `feature-handoff-index` 지구본 배너 행 · [`globe-home-banner-plan.md`](./globe-home-banner-plan.md) §9 · 본 절  
- 금지: 큐레이션 레인 · 새 Preview 브랜치 · UI 임의 리디자인  
- 다음: 모바일 QA 피드백 → 명소 정위치 → GPS 근접 hub 명소 → 지자체 N경 SSOT
