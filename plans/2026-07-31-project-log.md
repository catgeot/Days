# 2026-07-31 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## 블로그 AI 큐레이션 → 장소/지구본/무니 연결

**상태**: tip · Preview QA 대기

| | |
|--|--|
| 배경 | 블로그 홈 AI 큐레이션이 추천만 하고 장소카드·써머리·무니로 이어지지 않음 · 사진 깨짐(마크만) |
| 조치 | `curationPlaceBridge` 하이드레이트·홈 핸드오프 · CTA 3종(지구본 써머리/장소 카드/무니) · Unsplash→Pexels · `0,0` 금지 · 실패 시 가짜 Aitutaki 결과 제거 |
| VERIFY | `npm run smoke:curation-place-bridge` |
| 브랜치 | `cursor/blog-ai-curation-links-54e3` |

**QA**: `/blog` → 도구 → 낙원 탐색 → 사진 또는 「사진 준비 중」 · 지구본 써머리 / 장소 카드 / 무니에게 묻기 · 북마크 후 로고패널 재진입

**파일**: `AICurationCard.jsx` · `useLogbookAI.js` · `curationPlaceBridge.js` · `Home/index.jsx` · `useTravelData.js` · smoke

## 블로그 AI 큐레이션 — 비로그인 실행

**상태**: tip · Preview QA 대기

| | |
|--|--|
| 조치 | 낙원 탐색 로그인 게이트 제거 · 비로그인은 취향 데이터 없이 자유 추천 · 북마크만 로그인 유지 |
| 파일 | `AICurationCard.jsx` · `useLogbookAI.js` · `prompts.js` |

**QA**: 로그아웃 상태 `/blog` → 도구 → 낙원 탐색 시작 → 결과·CTA 동작 · 북마크는 로그인 안내

## 큐레이션 페이지 핸드오프 (다음 세션)

**사람 확인**: Phase A(연결·이미지·비로그인) Preview OK · 이전 실패 지점 해소.

**다음 방향 (합의)**: 연결 CTA 중심이 아니라 **`/blog/curation` 인페이지 콘텐츠 허브**  
— 나의 큐레이션 목록 · 페이지 안에서 실용/숨은 정보 · 지구본·장소카드 이탈 후 복귀 어려움 해소.

| | |
|--|--|
| 계획 SSOT | [`blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) |
| 제시어 | `큐레이션-이어하기` |
| 다음 Phase | **B** 전용 페이지 셸 + history 객체 목록 · **C** tips/season 등 인페이지 리치 |
| tip | `500ae06` · PR [#38](https://github.com/catgeot/Days/pull/38) |

**에이전트**: 계획 §0·§2·§3 + 위 파일 4종만 · travelSpots/축제/MRT 가이드 전체 Read 금지.
