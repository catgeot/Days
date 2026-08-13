# 2026-08-13 프로젝트 일지

직전: [`2026-08-12-project-log.md`](./2026-08-12-project-log.md)

## 지구본 홈 #13, Chrome 칩 히트 어긋남

**상태**: feature `cursor/chrome-hit-6294` · tip `01910faf` · push됨 · PR 생성은 권한상 보류(사람/포털)  
**세션**: `지구본 홈 #13, Chrome 칩 히트 어긋남`

- **증상**: Chrome만 — 첫 진입 칩 OK → 1턴(써머리/페이지 왕복) 후 「한국의 명승」탭이 `/blog/curation`으로 감 · 큐레이션도 이상
- **원인(1순위)**: `HomeUI` 칩 컬럼 `translate3d`+`isolate` 강제 합성 레이어가 `syncHomeViewportAfterInput`/URL바·Mapbox resize 후 paint↔hit 어긋남
- **수정**: 레이어 승격 제거 · 불투명 실드/칩 BG 유지 · 검색 absolute 열 `pointer-events-none`(pill만 auto) · `/qa/chrome-hit`
- **VERIFY**: `npm run build`
- **QA**: `https://www.gateo.kr/qa/chrome-hit` · git Preview `…-git-cursor-chrome-hit-6294-….vercel.app/`
- **사람 체크**: Chrome에서 홈→써머리 닫기 또는 명승/큐레이션 왕복 후, 명승=`/korea/theme/scenic` · 큐레이션=`/blog/curation`
- **다음 채팅명**:

```
지구본 홈 #14, Chrome 칩 QA
```

## 지구본 홈 #12, Chrome 클릭 관통·장소카드 갇힘

**상태**: `main` 반영 · PR [#116](https://github.com/catgeot/Days/pull/116) · tip `ae00ee74` / 히트실드 `643d912b`  
**세션**: `지구본 홈 #12, Chrome 클릭 관통·장소카드 갇힘`

- **증상**: Chrome에서 AI 큐레이션 칩 클릭이 아래(지도)로 뚫림 → 써머리 오픈 → X가 확장으로 오인 → `/place` 갇힘·explore 루프
- **한 일**: 홈 칩 레이어 `isolate`/`translateZ(0)`·불투명 보강 · 써머리 X 타깃 확대 · `/place` X는 홈+써머리 재오픈 skip · expand param 가드 · **후속**: Chrome 전용 불투명 히트 실드·칩 `backdrop-blur` 제거 (Safari/네이버/구글앱은 정상·Chrome만 재현 확인)
- **VERIFY**: `npm run build`
- **PROD 테스트**: `https://www.gateo.kr/` — Chrome에서 AI 큐레이션 칩·써머리 X
- **다음 채팅명**:

```
지구본 홈 #13, Chrome 클릭 QA
```
