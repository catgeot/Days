# 2026-09-21 프로젝트 일지

직전: [`2026-09-19-project-log.md`](./2026-09-19-project-log.md)

## 명승·명소 상세 본문 가독성 (Cloud)

- **세션** `명승 본문 가독성 #1, ThemeSpotDetailModal 프로즈`
- **브랜치** `cursor/korea-theme` · tip `4590e0a1` · `merge origin/main`(PR #291 반영) · draft PR (본문 prose)
- **완료**: `src/shared/readableDetail/*` 공유화 · 축제 `FestivalDetailProse`/`festivalDetailText` re-export · `ThemeSpotDetailModal` 개요 `highlight`+`prose` · intro/info 긴 필드만 `prose`
- **VERIFY**: `smoke:korea-theme-cross-links` · `smoke:korea-scenic-spots` · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/korea-theme → `/korea/theme/scenic?spot=gyeongbokgung` · hub 관광지 카드 1건(긴 개요)
- **QA**: 개요 연한 카드·문단 분리 · 짧은 주소·전화는 한 블록 · 긴 이용안내 항목만 문단

## 명승·명소 상세 개요 가독성 보강 (Cloud)

- **세션** `테마여행 #70, 개요 prose 타이포`
- **브랜치** `cursor/korea-theme-7b3e` · PR [#295](https://github.com/catgeot/Days/pull/295)
- **완료**: TourAPI 개요 `다.1392…` 형태 **공백 없는 마침표**도 문장 분리 · 2문장·240자 단위 문단 · `ReadableDetailProse` overview variant(15px·leading 1.92) · 스모크 `smoke-readable-detail-prose`
- **VERIFY**: `smoke-readable-detail-prose` · `smoke:korea-theme-cross-links` · `smoke:korea-scenic-spots` · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/korea-theme → `/korea/theme/scenic?spot=gyeongbokgung` · DDP
- **QA**: 개요가 **여러 `<p>` 문단**으로 보이는지 · 한 덩어리 wall-of-text 아닌지

## 축제 페이지 — 개요·프로그램 본문 가독성 (Cloud)

- **세션** `축제 페이지 #6, 본문 가독성`
- **브랜치** `cursor/festival-sheet-ui-ec8b` · tip `fcbac504` · PR [#287](https://github.com/catgeot/Days/pull/287)
- **완료**: TourAPI 개요·프로그램·행사장 안내·부대행사를 문장 단위 문단 분리(`FestivalDetailProse`). 개요·프로그램은 연한 카드 배경. 장소 카드와 동일한 행간·자간.
- **VERIFY**: `npm run smoke:korea-festival-personal` PASS · `smoke:korea-festival-nearby` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/festival-ui → git Preview `/korea` (섬진강국제실험예술제 등 긴 개요 확인)
- **QA**: 안내 탭 개요가 문단으로 나뉘는지 · 프로그램 탭도 동일 · 짧은 필드(요금·연령)는 기존과 같이 한 줄
- **다음**: Preview OK면 PR #287 병합

## 명승·명소 상세 본문 가독성 — 다음 세션 준비 (문서)

- **요청**: 명승 홈·명소·명승·관광지 상세 본문을 축제 개요와 **같은 프로즈 형식**으로.
- **준비**: [`korea-theme-travel-plan.md`](./korea-theme-travel-plan.md) **§9.1** · [`feature-handoff-index.md`](./feature-handoff-index.md) 행 + 제시어 · 선행 PR #291 병합 권장 · 구현 SSOT = 축제 `FestivalDetailProse` / `ThemeSpotDetailModal`.
- **다음 세션 제시어**: `명승 본문 가독성 #1, ThemeSpotDetailModal 프로즈` (인덱스 블록 복붙).
