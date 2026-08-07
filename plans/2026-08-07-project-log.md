# 2026-08-07 프로젝트 일지

직전: [`2026-08-06-project-log.md`](./2026-08-06-project-log.md)

## 테마여행 #52, 명소 분류 최적화

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **요청**: 대분류 클릭 시 같은 경주 명소가 흩어짐 → 동일 권역 뭉침 · 중분류 칩은 분류명 대신 지역명(경북·경남)
- **한 일**: `sortScenicSpotsByPlaceCluster` — 선정·유산 목록 시도→시·군 뭉침 · DB `area_code`+`addr1` 정렬 · TourAPI cat2(자연관광지 등) 칩 제거 · 지역 중분류 칩 유지 · `smoke:korea-scenic-place-cluster` · 작업로그
- **VERIFY**: `smoke:korea-scenic-place-cluster` · `smoke:korea-scenic-place-label` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「동일 지역 뭉침 · 중분류를 지역명으로」
- **QA**: `/korea/theme/scenic?region=경상` → 경주 선정 명소 연속 · 중분류=대구·부산·울산·경북·경남 · 자연관광지 칩 없음

### 테마여행 · 에이전트 핸드오프 → `#53`

| | |
|--|--|
| **세션 표기** | `테마여행 #53, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #52 분류 최적화 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #53, Preview QA 반영
```

## 테마여행 #51, 인근 명소 거리순

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `d9cb7211` · Preview QA 대기

- **요청**: 인근 명소를 축제장에서 가까운 순으로 정렬해 일정 감각이 나게
- **한 일**: `FestivalDetailSheet` — `festivalLngLat` + `rankSpotsByDistance` · km 배지 · 좌표 없으면 기존 order · smoke #51 보강 · 작업로그
- **VERIFY**: `npm run smoke:korea-scenic-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「인근 명소를 축제장 가까운 순으로」
- **QA**: `/korea` 축제 상세 → 인근 명소가 가까운 순 · km 배지 · 좌표 없는 축제는 예전 순서

## 테마여행 #50, 인근 명승지 라벨 정리

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `8a039c12` · Preview QA 대기

- **요청**: 축제홈 본문 「인근 명승지」라벨인데 목록은 GATEO 선정 명소
- **한 일**: `FestivalDetailSheet` 섹션·aria·더보기·모달 eyebrow를 「인근 명소」/「○○ 명소 더보기」로 정합 · 작업로그 #50
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「축제 상세 인근 라벨을 명소로」
- **QA**: `/korea` 축제 상세 → 「인근 명소」·목록·「○○ 명소 더보기」·항목 상세 eyebrow
