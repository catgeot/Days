# 2026-08-05 프로젝트 일지

직전: [`2026-08-04-project-log.md`](./2026-08-04-project-log.md)

## 테마여행 #25, 제품 흐름 재잠금

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `56e65bc4` · 플랜·핸드오프 (구현=#23)

- **본선**: type12 → Supabase · **주1회** sync · `/scenic` 명승 · 축제 **주변 관광지** · 맛집 **API만** · MRT **상품 있는 여행지** 큐레이션
- **연동**: 맛집·레포츠·문화·축제 → 명승 · 코스는 축제·주변·맛집과 유지·강화
- **보류**: 10대 절경 · 방방곡곡 (코드 유지 · 확장 중지)
- **SSOT**: `korea-theme-travel-plan.md` **§1.0 · §3.5 · S13**
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme`
- **작업 로그**: Preview 우측 「명승 본선·DB·보류 모듈 플랜」

### 테마여행 · 에이전트 핸드오프 → `#23 국내여행지 DB`

| | |
|--|--|
| **세션 표기** | `테마여행 #23, 국내여행지 DB` |
| **브랜치** | `cursor/korea-theme` (고정 · 새 브랜치 금지) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **tip SHA** | `56e65bc4` (#25 플랜 + #23 핸드오프) |
| **읽을 것 3** | ① 본 절 핸드오프 ② 플랜 **§1.0 · §3.5 · S13**만 ③ 축제 캐시 참고 `tourapi_festival_cache` / Edge `festivalWindow` |
| **금지 3** | 맛집 type39 전량 DB · top10/regions 신규 확장 · `/korea` 축제 지도·칩 리팩터 · `VITE_` Tour 키 · curated JSON에 7천 시드 |
| **이번 목표** | type12 목록 → Supabase 적재 + sync(주1회 골격) · `/scenic`이 DB 읽기(최소) · (여유 시) 축제 주변 관광지 훅 |
| **쿼터** | 개발 **1000/일** · 목록 전수 ≈ **시도 17회**(`numOfRows` 크게, 경기≈878도 1페이지) · **상세 detail 전수 금지** · 같은 키 타작업과 공유 시 잔여 확인 · 실패/429면 내일로 분할 |
| **규모 메모** | type12 ≈**7,294** · 목록에 `mapx`/`mapy` · 신규 드묾·수정 다수 → 주1회 sync면 충분 · 프로브 `scripts/probe-tourapi-scenic-counts.mjs` |
| **벤치** | 축제 DB 캐시 패턴 · 스키마는 별도 테이블(안: `tourapi_attraction`) · festival 캐시 JSON blob 재사용 강제 아님 |
| **VERIFY** | sync 후 active≈7k · scenic DB 목록≥1 · smoke · `npm run build` · push |
| **후속(같은 본선, #23 이후)** | 맛집 API 주변 · 레포츠/문화 · 코스↔축제 연동 · MRT 상품지 큐레이션 · 랜딩 top10/regions 타일 보류 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme` |

**다음 채팅명 (복붙)**:

```
테마여행 #23, 국내여행지 DB
```

**다음 채팅 첫 메시지 (복붙)**:

```
테마여행 #23, 국내여행지 DB
@plans/2026-08-05-project-log.md 「테마여행 · 에이전트 핸드오프」
@plans/korea-theme-travel-plan.md S13·§1.0·§3.5만
브랜치 cursor/korea-theme 고정. type12→Supabase·주1회 sync(목록만·시도≈17회).
scenic이 DB 읽기. 맛집 전량 DB 금지. top10/regions 보류. 축제 지도 리팩터 금지.
쿼터 1000/일·detail 전수 금지. smoke·build 후 push.
```

## 테마여행 #22, 명승지 위치 정보

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · 리서치 ✅ · 제품은 #25로 승격

- **LIVE**: TourAPI type12 전국 ≈**7,294** · 목록 `mapx`/`mapy` · 신규 드묾·수정 다수
- **스크립트**: `node scripts/probe-tourapi-scenic-counts.mjs`
- **다음**: #25 제품 흐름 → #23 DB 구현

## 테마여행 #21, 테마간 이동 개선

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `84e3aeae` · Preview QA 대기

- **한 일**: 크로스 레일 이동 시 `themeNavBack` 스택 push · 모듈 헤더 「이전」+ 이전 상태 표기 · top10/scenic/regions `?spot=` 모달 복원 · placeReturnTo 쿼리 허용 · 축제 `from=theme`도 직전 상세로 · `smoke:korea-theme-nav-back`
- **VERIFY**: `npm run smoke:korea-theme-nav-back` · `smoke:korea-theme-spot-modal` · `smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/top10`
- **QA**: top10 보성녹차밭 모달 → 축제/명승/코스 → 「이전」또는 ← 보성녹차밭 · 10대 절경 → 모달 복원
- **다음**: 명승 TourAPI 리서치(#22) → 전량 구현(#23) · 폴리시(#24)

```
테마여행 #22, 명승지 위치 정보
```

## 테마여행 #20, 본문 가독성 개선

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `49f2d2db` · Preview QA 대기

- **한 일**: `ThemeSpotDetailModal` `DetailRow` 좌우 2열 → 소제목 아래 본문 세로 배치 · 행 간격 `space-y-4` · 작업로그 #20
- **VERIFY**: `npm run smoke:korea-theme-spot-modal` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/top10`
- **QA**: top10 한라산 등 모달 — 개요·주소·이용 시간이 소제목 아래 전체 폭으로 읽히는지
- **다음**: 테마간 이동 개선(#21)

```
테마여행 #21, 테마간 이동 개선
```
