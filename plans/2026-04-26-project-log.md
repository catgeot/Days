# 2026-04-26 프로젝트 로그

[⬅ 이전: 2026-04-23 (아카이브)](./archive/legacy-2026-04-root/2026-04-23-project-log.md)

## 요약 (Cursor 세션)

- **문서**: `.ai-context.md` 압축·갱신, `plans/` 루트 문서 `archive/legacy-2026-04-root/`로 이전, `plans/README.md` 안내
- **버그/품질**: `useClickWithDragPrevention` `reset` 선언 순서, `Home` `isExploreFromPlace` state(렌더 시 ref 읽기 제거), `App` 미사용 `AdminLayout` 제거, `index.html` `head` 내 잘못된 `div` 정리·스크립트 `body` 하단 이동
- **정리**: `src/pages/Home/data` 구형 `travelSpots*backup*·phase*` 등 비참조 js 9개 삭제; 스크립트 백업 경로 `scripts/outputs/` + `.gitignore`, `merge-phase2`/`analyze-density`·`create-phase1`/`add-phase2` 경로 정합
- **빌드**: `npm run build` 통과
- **다음(당시)**: (선택) `emrld`, 제휴 링크/DF 노선 — `npm run lint`·`exhaustive-deps`는 아래 “추가”·같은 날 세션

### 추가 (같은 날 · ESLint 세션)

- **ESLint**: `npm run lint` **error 0**; 당시 `exhaustive-deps` **12건** 잔여(후속 exhaustive-deps 세션에서 0까지 정리). `eslint.config.js`에 `scripts/**`·Node 전역, `argsIgnorePattern`(`^_`) 등. 미사용 변수/일부 `set-state-in-effect`·`planner/utils` `no-case-declarations`·DailyReport·Home·PlaceCard 일괄 반영. `formatUrlName.js`, `common/device.js` 추가.
- **emrld**(`index.html` 하단): Travel Payouts 사이트 소유자 확인용 — **삭제하지 말 것**(운영 측 요청·로그인 연동).
- **다음(당시)**: (선택) `emrld`, 제휴 링크/DF 노선; CI `max-warnings` 정책 합의(선택).

### 추가 (같은 날 · exhaustive-deps 세션)

- **`react-hooks/exhaustive-deps`**: 12건만 잔여였던 항목을 `useCallback`/`useRef` 안정화, `useDashboardData`는 `useLocation`+`loadData` `useCallback`, `Home` `/place/` 동기·`HomeGlobe` 마운트 이펙트는 **의도적** deps이므로 `eslint-disable-next-line` + 한 줄 근거. `npm run lint` **warning 0** (동작·UX 의도적 비변경).

### 추가 (같은 날 · Home AI 채팅 / `saved_trips` 정합)

- **문제**: `handleStartChat`이 destination당 **빈 `messages: []` row를 선 insert**해, 방문·모달 오픈만으로도 채팅 목록·지구본 말풍선이 쌓임.
- **해결**: DB에 해당 destination이 없을 때는 `setChatDraft`만 두고 모달 오픈; **첫 사용자 메시지**에서 `saveNewTrip`(첫 메시지 포함) + `setActiveChatId`. `ChatModal`에 `onCreateTripOnFirstUserMessage` 연동.
- **표시**: `tripChatUtils.js`의 `tripHasPersistedDialogue`로 사이드바·`HomeGlobe` 말풍선 필터(실제 user/model 텍스트 있는 trip만).
- **기타**: `PlaceCardSummary` 요약 문구에서 지명 뒤 **하드코딩된「울루루」** 제거 → `{location?.name}의 숨겨진 매력…`.
- **빌드**: `npm run build` 통과.

## 커밋

- `chore(lint): ESLint error 0, scripts/node overrides, PlaceCard/Home fixes` — 이 일지·`.ai-context` 갱신 포함. (해시는 `git log -1 --oneline`로 확인)
- `chore(lint): exhaustive-deps warning 0, context log` — PlaceCard/Home/DailyReport 훅 정리, `.ai-context`·`2026-04-26-project-log` 반영. (이후 `git log -1 --oneline`으로 확인)
- `fix(home): defer saved_trips until first chat message` — 채팅 목록·지구본 말풍선은 저장된 대화만; `.ai-context`·일지 갱신. (`git log -1 --oneline`으로 확인)
