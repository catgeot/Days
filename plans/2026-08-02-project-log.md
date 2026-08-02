# 2026-08-02 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## MRT 패키지 연결 #3, 숙소·투어 패키지 CTA

**상태**: feature `cursor/mrt-package-strip-18d2` · Preview QA 대기

- 투어 CTA 문구: `{지역} 패키지 상품보기` (예: 더블린 패키지 상품보기)
- 숙소 모달 하단에도 동일 CTA 신설 (간접 진입)
- 탐색 CTA·써머리 탭 폐기 상태 유지
- **공유**: `https://www.gateo.kr/qa/package`

## MRT 패키지 연결 #1–2, 탐색 재연결·써머리 폐기

**상태**: ✅ 탐색 OK · 써머리 탭/모달 폐기

- **탐색 ✅**: 일본 `q=일본` · 가족/유럽/휴양 promotionGroup · 선두=패키지 홈
- **써머리 패키지 탭·모달**: 목록 API 부재 → 폐기
- **공유**: `https://www.gateo.kr/qa/package` · git Preview `…-git-cursor-mrt-package-strip-18d2-….vercel.app/`

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

**상태**: ✅ main `#45` · 고정 브랜치 재사용 중

- **기존 기준**: 중분류 목록 = 면 시드(`GLOBE_FACE_PRIORITY`) 순 + 나머지 앵커 거리·인기·가나다 → 인접국 느낌이 약함
- **변경**: `getFaceRegionsForSubregion`이 좌표 nearest-neighbor 연쇄로 재정렬 · 시작국은 소권역 정의 첫 id
- **검증**: `npm run smoke:globe-face-neighbor-order` · `smoke:place-label-slug` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/globe` · git Preview `…-git-cursor-globe-neighbor-list-15b3-….vercel.app/`

## 지구본 나라 목록 #2, 스크롤 상단 시작

**상태**: feature `cursor/globe-neighbor-list-15b3` · `8bfbbf0` · PR [#46](https://github.com/catgeot/Days/pull/46) · Preview QA 대기

- **이슈**: 긴 나라 리스트가 하단 기준으로 열려 위로 스크롤해야 했음
- **변경**: `GlobeFaceRegionRail` — `justify-end` 하단 배치는 유지 · 초기 `scrollTop`만 0(상단)
- **검증**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/globe` · git Preview `…-git-cursor-globe-neighbor-list-15b3-….vercel.app/`
- **QA**: 홈→권역→중분류에서 긴 목록이 위에서 보이고 아래로 스크롤되는지 · 짧은 목록은 하단 고정인지
