# 2026-10-22 프로젝트 일지

이전: [`2026-10-21-project-log.md`](./2026-10-21-project-log.md)

## 축제 로드 #4, PR-A 골격

- draft [#536](https://github.com/catgeot/Days/pull/536) `cursor/festival-road-pr-a-545a` tip `8c94f1f2`. 축제 상세 날짜·장소 아래 «이 축제로 동선 보기». 번호 순서·회색 점·이번주/다음주·지도 자리 160px. Mapbox 없음. `VITE_GATEO_FESTIVAL_ROAD` 기본 OFF. 닫힌 PR #170 코드는 가져오지 않음. **병합 금지**.
- 검증: `scripts/health/festival-road.test.mjs` 5 PASS · `npm run lint` PASS. 플래그 ON WebKit 390 `docs/qa/festival-road-pr-a/` (버튼 → 번호 → 고성 주변 볼거리 → 다음주 한 줄).
- 사람 체크: 플래그 OFF 축제 상세가 라이브와 같은지. ON이면 버튼 → 번호 순서 → 회색 지역 «주변 볼거리».
