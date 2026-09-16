# 2026-09-16 프로젝트 일지

직전: [`2026-09-15-project-log.md`](./2026-09-15-project-log.md)

## 종각역 숙소 #7 — 거리 Photon 캐시 로딩 (Cloud)

- **세션** `종각역 숙소 #7, Preview OK면 PR 병합` → 실제 작업은 로딩 개선 (병합 보류)
- **브랜치** `cursor/jonggak-first-card-3096` · tip `04735e04` · PR [#266](https://github.com/catgeot/Days/pull/266)
- **원인**: Edge가 호텔마다 Photon(최대 12초)을 기다린 뒤에야 목록을 돌려 숙소 찾기가 느림. 클라 캐시는 sessionStorage 30분·원점 포함이라 탭을 닫으면 사라짐.
- **완료**: 목록은 원점 없이 먼저 표시. 좌표는 localStorage 14일(미스 24시간). 없는 호텔만 `geocodeItems` Photon. 목록 캐시 v23 30분. Edge `fetch-mrt-stays` 배포 `phdjnbfitvmrguqzverm`.
- **VERIFY**: `npm run smoke:mrt-stay` PASS · `npx vite build` PASS
- **Preview** https://days-git-cursor-jonggak-first-card-3096-catgeots-projects.vercel.app/
- **QA**: 홈「종각역」→ **첫 카드** 숙소 찾기 → 카드가 먼저 뜨고 신라스테이 광화문 330m 등 · 네이버 칩 · 재진입은 거의 즉시
- **다음**: `종각역 숙소 #8, Preview OK면 PR 병합`
