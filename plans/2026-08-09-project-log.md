# 2026-08-09 프로젝트 일지

직전: [`2026-08-07-project-log.md`](./2026-08-07-project-log.md)

## 테마여행 #67, 홈 명승·카테고리 겹침

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **요청**: PC 홈에서 로고 아래 「한국의 명승」과 좌측 테마 카테고리 겹침 해소 (모바일 OK)
- **한 일**: PC 카테고리 레일을 `top-[14.5rem] bottom-28` 밴드 안 세로 중앙으로 내려 투톱과 분리 · 로고/투톱 z를 카테고리 위로
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/`
- **QA**: PC 폭 홈에서 명승 버튼과 Paradise 등 카테고리가 겹치지 않는지

## 테마여행 #68, 카테고리 하위칩 겹침

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **요청**: 테마 카테고리 클릭 전엔 OK, 하위칩 생성 시 위로 밀려 명승과 겹침
- **한 일**: PC 레일 `justify-center` → `justify-start` (투톱 아래 상단 고정, 확장만 아래) · 밴드 넘치면 스크롤
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/`
- **QA**: PC 홈에서 카테고리 클릭 후에도 명승 버튼과 겹치지 않는지

### 테마여행 · 에이전트 핸드오프 → `#69`

| | |
|--|--|
| **세션 표기** | `테마여행 #69, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #68 하위칩 ③ #67 겹침 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/` |

**다음 채팅명 (복붙)**:

```
테마여행 #69, Preview QA 반영
```
