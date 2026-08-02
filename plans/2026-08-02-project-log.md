# 2026-08-02 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## 에이전트 규칙 — 로컬 UI 커밋 보류 vs Cloud 매 턴 push

**상태**: ✅ `8a6bc24` · `main` ahead 1 (push는 사람 요청 시)

- 의도 명시: 로컬 UI 커밋 보류 = 색·폰트 등 미세 조율 **커밋 난발(5+) 방지** · Cloud feature = **Preview 로드를 위해 매 턴 커밋·push 필수**
- SSOT: `.ai-context` **1.5.1**/**§4.1 6** · `AGENTS.md` Cloud · `gateo-project-context.mdc`
- User Rule「Git commit/push — verification gate」(`16942118`) 동일 취지로 직접 갱신 — LOCAL 커밋 보류(난발 방지) · CLOUD feature 매 턴 커밋·push(Preview)

## 규칙 보강 — 첫 턴 잔여 항목

**상태**: ✅ 문서 반영

| 항목 | 조치 |
|------|------|
| 축제 플랜「Cloud 중단」 | [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) → 로컬 우선 · Cloud UI=AGENTS Preview |
| Cloud `main` 착지 표 | `.ai-context` **1.5.2** · `AGENTS.md` — 짧은 SSOT=`main` 커밋·push는 사람 요청 / UI=feature+매 턴 push |
| Cloud 최소 검증 | AGENTS — 도메인 smoke 또는 `npm run build` |
| 비오케 Cloud PR | AGENTS Preview 표 — PR 없으면 생성 |
| stale handoff | `2026-05-22-ai-chat-booking-cta-handoff` 「요청 시만 commit」→ 1.5.1 포인터 |

## 지구본 나라 목록 #1, 인접국 연쇄 정렬

**상태**: feature `cursor/globe-neighbor-list-15b3` · Preview QA 대기

- **기존 기준**: 중분류 목록 = 면 시드(`GLOBE_FACE_PRIORITY`) 순 + 나머지 앵커 거리·인기·가나다 → 인접국 느낌이 약함
- **변경**: `getFaceRegionsForSubregion`이 좌표 nearest-neighbor 연쇄로 재정렬 · 시작국은 소권역 정의 첫 id
- **검증**: `npm run smoke:globe-face-neighbor-order` · `smoke:place-label-slug` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/globe` (PROD redirect는 main 반영 후) · git Preview `…-git-cursor-globe-neighbor-list-15b3-….vercel.app/`
- **QA**: 홈 → 권역 → 중분류 → 나라 칩을 위에서 아래로 눌러 인접 느낌이 이어지는지
