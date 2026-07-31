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
