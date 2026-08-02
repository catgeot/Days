# 2026-07-31 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## Cloud · Preview URL 고정 (main)

- **규칙**: 이어하기 시 열린 feature 브랜치 **재사용** · 세션마다 새 `cursor/…-xxxx` 금지.
- Mapbox에는 Vercel **git Preview URL**(`…-git-<branch>-….vercel.app`)만 1회 등록 · 해시 배포 URL 금지.
- SSOT: [`AGENTS.md`](../AGENTS.md) Cloud「고정 브랜치 · Mapbox Preview URL」· `.ai-context` **1.5.2** · Rule `gateo-project-context`.
- **의도**: Cloud가 `main`을 읽을 때부터 적용되도록 docs를 main에 반영.

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
| 조치 | 낙원 탐색 로그인 게이트 제거 · 비로그인도 취향 데이터 없이 자유 추천 · 북마크만 로그인 유지 |
| 파일 | `AICurationCard.jsx` · `useLogbookAI.js` · `prompts.js` |

**QA**: 로그아웃 상태 `/blog` → 도구 → 낙원 탐색 시작 → 결과·CTA 동작 · 북마크는 로그인 안내

## 큐레이션 페이지 핸드오프 → Phase B+C

**사람 확인**: Phase A(연결·이미지·비로그인) Preview OK · 이전 실패 지점 해소.

**방향 (합의)**: 연결 CTA가 아니라 **`/blog/curation` 인페이지 콘텐츠 허브**.

## 블로그 AI 큐레이션 — Phase B+C (인페이지 허브)

**상태**: tip · Preview QA 대기

| | |
|--|--|
| Phase B | `/blog/curation` · `CurationHub` · history **객체** upsert/복원 · 도구 카드→페이지 링크 |
| Phase C | `whyHidden` · `bestSeason` · `tips[]` 프롬프트+인페이지 블록 |
| VERIFY | `npm run smoke:curation-history` · `smoke:curation-place-bridge` |
| 브랜치 | `cursor/blog-ai-curation-links-5aff` · tip `559ab4d` · PR [#42](https://github.com/catgeot/Days/pull/42) |
| 계획 | [`blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) |

**QA**: Preview `/blog/curation` → 낙원 탐색 → 리치 블록 · 나의 목록 탭 복원 · `/blog` 도구→페이지 링크 · 비로그인 실행 · 「전체 지도에서 보기」는 보조

**다음**: Phase D(사람 합의) — `placeReturnTo` · 미니맵/갤러리 임베드 · 릴리스 노트 초안은 Preview OK 후

**파일**: `Curation.jsx` · `CurationHub.jsx` · `curationHistory.js` · `AICurationCard.jsx` · `useLogbookAI.js` · `prompts.js` · `App.jsx` · smoke

**에이전트**: 계획 §0·§3 Phase D · 일지 Phase B+C · travelSpots/축제/MRT 가이드 전체 Read 금지.
