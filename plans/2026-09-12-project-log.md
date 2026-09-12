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

## 팔경 활용 #19 — 함안·사천 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #19, 함안·사천 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `13d69f11` · PR [#219](https://github.com/catgeot/Days/pull/219)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 함안9경 결손 7건·사천9경 결손 6건의 개요·주소·공식 사진 보강. 합강정·대평늪·비토섬은 같은 시군 수변·해안 공식 사진으로 근사.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=haman` · `?hub=sacheon`
- **잔여**: 사진/개요 순수 누락 **196**/876. QA 후 다음 허브 **이천9경 6**

## 팔경 활용 #20 — 사람 Preview QA PASS

- **세션** `팔경 활용 #20, 사람 Preview QA` — 함안·사천 결손 행 썸네일·개요·행마다 다른 사진 **PASS ✅**
- **#19** PR [#219](https://github.com/catgeot/Days/pull/219) merge ✅ `985bf7b7`
- **잔여**: 사진/개요 순수 누락 **196**/876. 다음 허브 **이천9경 6** · 그다음 창녕구경 6
- **다음** 이천9경 결손 오버레이 (`LOCAL_SCENIC_MEMBER_OVERLAYS` · JSON contentId 금지)

```
팔경 활용 #21, 이천 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 이천9경 사진·개요 없는 6건(노성산 말머리바위·도드람산 삼봉·반룡송·사기막골도예촌·설봉산 삼형제 바위·애련정)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=icheon
```

## 팔경 활용 #21 — 이천 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #21, 이천 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `7903a22c` · PR [#220](https://github.com/catgeot/Days/pull/220)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 이천9경 결손 6건(노성산 말머리바위·도드람산 삼봉·반룡송·사기막골도예촌·설봉산 삼형제 바위·애련정)의 개요·주소·공식 사진 보강. 노성산 말머리바위는 같은 시 기암 공식 사진으로 근사.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=icheon`
- **잔여**: 사진/개요 순수 누락 **190**/876. 다음 허브 **창녕구경 6**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #22 — 창녕 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #22, 창녕 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `ddd01ca0` · PR [#221](https://github.com/catgeot/Days/pull/221)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 창녕구경 결손 6건(우포늪과 따오기·화왕산 억새와 진달래·낙동강유채축제와 남지개비리·만옥정공원과 신라진흥왕척경비, 술정리동삼층석탑·교동과 송현동고분군·3·1민속문화제와 영산만년교)의 개요·주소·공식 사진 보강. 한국관광공사 우포늪·화왕산·유채축제·개비리길·만옥정·석탑·고분군·만년교 사진을 연결했고, 만년교 쥐불놀이 공식 사진으로 민속제를 보탰다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=changnyeong`
- **잔여**: 사진/개요 순수 누락 **184**/876. QA 후 다음 허브 **진주8경 6**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #23 다음 — 진주 결손 오버레이

```
팔경 활용 #23, 진주 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 진주8경 사진·개요 없는 6건(남강 의암·뒤벼리·새벼리·망진산 봉수대·비봉산의 봄·월아산 해돋이)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=jinju
```

## 같은 세션 QA — AGENTS.md 전 주제 규칙

- **적용**: [`AGENTS.md`](../AGENTS.md) Cloud · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§5** · `.ai-context` **§4.1 13**
- **기본**: 복잡 로직·토큰 과다 작업 **외에는** 작업 세션에서 QA 마무리. 다음 제시어 = 다음 작업. `{주제} #N, 사람 Preview QA`를 다음 에이전트 채팅으로 넘기지 않음.
- **예외**: 복잡 로직·토큰 과다 세션만 별도 사람 Preview QA 채팅 허용. 피드백 → 수정 세션.
- **팔경**: 다음 에이전트 = **#23 진주 결손 오버레이**
