# 2026-08-05 프로젝트 일지

직전: [`2026-08-04-project-log.md`](./2026-08-04-project-log.md)

## 테마여행 #25, 제품 흐름 재잠금

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · 플랜만 (구현=#23)

- **본선**: type12 → Supabase · **주1회** sync · `/scenic` 명승 · 축제 **주변 관광지** · 맛집 **API만** · MRT **상품 있는 여행지** 큐레이션
- **연동**: 맛집·레포츠·문화·축제 → 명승 · 코스는 축제·주변·맛집과 유지·강화
- **보류**: 10대 절경 · 방방곡곡 (코드 유지 · 확장 중지)
- **SSOT**: `korea-theme-travel-plan.md` **§1.0 · §3.5 · S13**
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme`
- **다음**:

```
테마여행 #23, 국내여행지 DB
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
