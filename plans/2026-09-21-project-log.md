# 2026-09-21 프로젝트 일지

직전: [`2026-09-19-project-log.md`](./2026-09-19-project-log.md)

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
