# 2026-09-12 프로젝트 일지

직전: [`2026-09-11-project-log.md`](./2026-09-11-project-log.md)

## 팔경 활용 #17 — 한천팔경 공식명·지구본 검색 (Cloud)

- **세션** `팔경 활용 #16, 사람 Preview QA` 피드백 → **#17**
- **브랜치** `cursor/palgyeong-use-e744` · tip `61c72ba3` · PR [#217](https://github.com/catgeot/Days/pull/217)
- **완료**:
  1. 영동은 한천팔경·양산팔경이 같이 있어 그룹명이 「영동 팔경」으로 겹침. 같은 시군에 같은 종류가 둘이면 공식 title(한천팔경·양산팔경)을 씀. 「영동 팔경」은 공식 명칭이 아님.
  2. 지구본 홈 「한천」검색이 영동 도시만 나오던 문제 — `resolveLocalScenicListFromSearchQuery`로 includes 매칭을 검색에 연결해 한천팔경 8행이 먼저 나오게 함.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=yeongdong`
- **다음** 사람 Preview QA — 명승 「한천」그룹명 한천팔경 · 지구본 검색 한천팔경 · 영동 허브 두 팔경 분리

## 팔경 활용 #18 — 한천 행 부제 공식명 (Cloud)

- **세션** `팔경 활용 #18` Preview QA 피드백 — 리스트 제목과 행 부제 불일치
- **브랜치** `cursor/palgyeong-use-e744` · tip `900d77af` · PR [#217](https://github.com/catgeot/Days/pull/217)
- **완료**: 그룹명 한천팔경인데 행이 영동 N경이던 불일치. 같은 시군에 팔경이 둘이면 공식명 어간으로 번호(한천 1경·양산 1경).
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use
- **다음** 사람 Preview QA — 「한천」검색 그룹 한천팔경 · 행 한천 1경~8경

## 팔경 활용 #19 다음 — 함안·사천 결손 오버레이

- **#18** PR [#217](https://github.com/catgeot/Days/pull/217) merge ✅ `d24e0bd1`
- **잔여**: 사진/개요 순수 누락 **209**/876. 큐 다음 허브 **함안9경 7** · 사천9경 6 · 그다음 이천9경 6
- **다음** 함안·사천 결손 오버레이 (`LOCAL_SCENIC_MEMBER_OVERLAYS` · JSON contentId 금지)

```
팔경 활용 #19, 함안·사천 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 함안9경 사진·개요 없는 7건(말이산고분군·악양의 꽃길과 노을·무진정의 사계·연꽃테마파크의 아라홍련·장춘사의 산사풍경·합강정과 반구정의 해돋이·대평늪의 늪지식물)과 사천9경 6건(삼천포대교와 사천바다케이블카·남일대 코끼리바위·선진리성 벚꽃·봉명산 다솔사·비토섬 갯벌·용두공원과 청룡사 겹벚꽃)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=haman · ?hub=sacheon
```
