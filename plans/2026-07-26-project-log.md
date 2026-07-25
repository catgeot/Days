# 2026-07-26 프로젝트 일지

직전: [`2026-07-25-project-log.md`](./2026-07-25-project-log.md)

## 써머리 숙소↔투어 하단 전환 CTA

**상태**: ✅ 사람 QA OK · **push 완료** · 세션 종료

### 구현

- 숙소 모달 하단「주변 즐길거리를 탐색해 보세요」→ 투어 모달 (`openTourSignal`)
- 투어 모달 하단「편하게 묵을 숙소를 알아보세요」→ 숙소 모달 (`openStaySignal`)
- 기존 `peerOpen` 상호배타로 상대 닫힘 · 인라인 상품 목록 없음
- 상대 스트립 비대상이면 CTA 숨김 (TNA/GYG · `canShowMrtStayStrip`)

### 파일

- [`HomePlaceCardSummary.jsx`](../src/pages/Home/components/HomePlaceCardSummary.jsx)
- [`GlobeStayStrip.jsx`](../src/pages/Home/components/GlobeStayStrip.jsx)
- [`GlobeTourStrip.jsx`](../src/pages/Home/components/GlobeTourStrip.jsx)

### 세션 종료

- 릴리스 노트: 해당 없음(소소한 UX 연결) · Vercel 배포는 push 후
