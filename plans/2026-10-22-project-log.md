# 2026-10-22 프로젝트 일지

이전: [`2026-10-21-project-log.md`](./2026-10-21-project-log.md)

## 축제 로드 #4, PR-A 골격

- draft [#536](https://github.com/catgeot/Days/pull/536) `cursor/festival-road-pr-a-545a` tip `8c94f1f2`. 축제 상세 날짜·장소 아래 «이 축제로 동선 보기». 번호 순서·회색 점·이번주/다음주·지도 자리 160px. Mapbox 없음. `VITE_GATEO_FESTIVAL_ROAD` 기본 OFF. 닫힌 PR #170 코드는 가져오지 않음. **병합 금지**.
- 검증: `scripts/health/festival-road.test.mjs` 5 PASS · `npm run lint` PASS. 플래그 ON WebKit 390 `docs/qa/festival-road-pr-a/` (버튼 → 번호 → 고성 주변 볼거리 → 다음주 한 줄).
- 사람 체크: 플래그 OFF 축제 상세가 라이브와 같은지. ON이면 버튼 → 번호 순서 → 회색 지역 «주변 볼거리».

## 축제 로드 QA, #536 위 수정

- #536 `cursor/festival-road-pr-a-545a` @ `abd4db43` 는 그대로. push 없음. QA는 `cursor/festival-road-qa-9d86` draft [#538](https://github.com/catgeot/Days/pull/538) (base `main`, #536 병합 후 rebase). **병합 금지**. 플래그 기본 OFF.
- 무니 버튼 한 번 · 기간 밖 축제는 `11/21 시작` · 빈 지도 자리 숨김 · 건봉사 등 장소 상세 · 서울 자정에 기준일 갱신 · 원주는 `gw-central`. 플래그 OFF 빌드에 로드 JSON 없음.
- 검증: `festival-road.test.mjs` 6 PASS · `lint:ci` PASS. WebKit 390 실데이터: 설악문화제 동선 → 다음주 강릉 · 고성 건봉사 상세 · 춘천 북부 내륙로 · 원주 중부 횡단로.
