# 2026-04-26 프로젝트 로그

[⬅ 이전: 2026-04-23 (아카이브)](./archive/legacy-2026-04-root/2026-04-23-project-log.md)

## 요약 (Cursor 세션)

- **문서**: `.ai-context.md` 압축·갱신, `plans/` 루트 문서 `archive/legacy-2026-04-root/`로 이전, `plans/README.md` 안내
- **버그/품질**: `useClickWithDragPrevention` `reset` 선언 순서, `Home` `isExploreFromPlace` state(렌더 시 ref 읽기 제거), `App` 미사용 `AdminLayout` 제거, `index.html` `head` 내 잘못된 `div` 정리·스크립트 `body` 하단 이동
- **정리**: `src/pages/Home/data` 구형 `travelSpots*backup*·phase*` 등 비참조 js 9개 삭제; 스크립트 백업 경로 `scripts/outputs/` + `.gitignore`, `merge-phase2`/`analyze-density`·`create-phase1`/`add-phase2` 경로 정합
- **빌드**: `npm run build` 통과
- **다음(당시)**: `npm run lint` 정리, (선택) `emrld`, 제휴 링크/DF 노선

### 추가 (같은 날 · ESLint 세션)

- **ESLint**: `npm run lint` **error 0**; `exhaustive-deps` **warning** 12건만 잔여(다음 세션·선택). `eslint.config.js`에 `scripts/**`·Node 전역, `argsIgnorePattern`(`^_`) 등. 미사용 변수/일부 `set-state-in-effect`·`planner/utils` `no-case-declarations`·DailyReport·Home·PlaceCard 일괄 반영. `formatUrlName.js`, `common/device.js` 추가.
- **emrld**(`index.html` 하단): Travel Payouts 사이트 소유자 확인용 — **삭제하지 말 것**(운영 측 요청·로그인 연동).
- **다음**: (선택) `exhaustive-deps` 12건 정리 또는 CI `max-warnings` 정책 합의.

## 커밋

- `chore(lint): ESLint error 0, scripts/node overrides, PlaceCard/Home fixes` — 이 일지·`.ai-context` 갱신 포함. (해시는 `git log -1 --oneline`로 확인)
