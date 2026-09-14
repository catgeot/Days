# 2026-09-14 프로젝트 일지

직전: [`2026-09-13-project-log.md`](./2026-09-13-project-log.md)

## 방문자 개선 #3 — 크롤러 SEO 및 본문 프리렌더링 (Cloud)

- **세션** `방문자 개선 #3, 크롤러 SEO 및 본문 프리렌더링`
- **브랜치** `cursor/visitor-growth-1f90` · tip `dd317cf9` · PR [#248](https://github.com/catgeot/Days/pull/248)
- **완료**: `botDetect`에 카카오·다음·슬랙 봇 추가. `TRAVEL_SPOTS` 274곳 전수 크롤러 메타. 봇 응답 `#root`에 장소별 `h1`·설명·갤러리/플래너/AI 도슨트 nav 주입(허브는 기존 본문 유지).
- **VERIFY**: `npm run generate:crawler-place-meta` 274 slugs · `npm run smoke:crawler-place-meta` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/place/tokyo?crawler=1` · `/place/santorini?crawler=1`
- **QA**: `?crawler=1` 도쿄·산토리니 본문이 홈 소개글이 아닌지 · 일반 브라우저 UI 그대로인지.

## 팔경 활용 #42 — 진도 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #42, 진도 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `aac4eaf2` · PR [#245](https://github.com/catgeot/Days/pull/245)
- **진행 확인**: GATEO 빈허브 큐는 소진(빈 hub 0). 팔경 contentId(B)는 병합 종료. 활성 트랙은 팔경 활용 A 오버레이. 핸드오프의 문경8경 4건은 사진·개요 기완료(순수 누락 0)라 건너뛰고, 다음 순수 누락 4건 허브 **진도10경**을 채움.
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 진도10경 결손 4건(조도관음도·의장대·돈대산·하조대)의 개요·주소·진도군 문화관광 공식 사진 보강. 하조대는 하조도등대이며 양양 하조대와 혼동하지 않음. origin/main 병합 때 남은 Tour 썸네일 충돌 표식은 영덕(127160·1621219·126143)·문경석탄(2599737) 양쪽을 유지해 해소.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS · `report-local-scenic-missing-content --hub=jindo` 사진/개요 10/10, 순수 누락 0
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=jindo`
- **잔여**: 사진/개요 순수 누락 **106**/876. 다음 허브 **함평8경 4** (그다음 해남8경·홍성12경·화순11경)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #43 다음 — 함평 결손 오버레이

```
팔경 활용 #43, 함평 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-14-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 함평8경 사진·개요 없는 4건(백제고도·모악산·삼호천·청계산)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=hampyeong
```
