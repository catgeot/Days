# 2026-09-13 프로젝트 일지

직전: [`2026-09-12-project-log.md`](./2026-09-12-project-log.md)

## 팔경 활용 #32 — 남해 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #32, 남해 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `2dbb33e9` · PR [#232](https://github.com/catgeot/Days/pull/232) · [#231](https://github.com/catgeot/Days/pull/231) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 남해12경 결손 5건(남해 금산과 보리암·창선교와 남해지족해협 죽방렴·서포 김만중 선생 유허와 노도·남해 물건리 방조어부림과 물미해안·창선-삼천포대교)의 개요·주소·공식 사진 보강. 한국관광공사 보리암·죽방렴·창선교·노도·방조어부림·창선삼천포대교 사진을 연결했고, 창선-삼천포대교는 사천9경 케이블카·교량 사진과 다른 썸네일을 썼다. 사람 Preview에서 「남해 십경」으로 보이던 그룹 제목을 공식명 「남해 12경」으로 맞춤(sipgyeong+12경). 하동·금산 십경은 그대로.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=namhae` · 검색 「남해」 그룹명 **남해 12경**
- **잔여**: 사진/개요 순수 누락 **147**/876. QA 후 다음 허브 **포항12경 5**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #33 다음 — 포항 결손 오버레이

```
팔경 활용 #33, 포항 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 포항12경 사진·개요 없는 5건(호미곶 일출·내연산 12폭포·운제산 오어사 사계·영일대 포스코 야경·철길숲 불의 정원)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=pohang
```

## 같은 세션 QA — AGENTS.md 전 주제 규칙

- **적용**: [`AGENTS.md`](../AGENTS.md) Cloud · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§5** · `.ai-context` **§4.1 13**
- **기본**: 복잡 로직·토큰 과다 작업 **외에는** 작업 세션에서 QA 마무리. 다음 제시어 = 다음 작업. `{주제} #N, 사람 Preview QA`를 다음 에이전트 채팅으로 넘기지 않음.
- **예외**: 복잡 로직·토큰 과다 세션만 별도 사람 Preview QA 채팅 허용. 피드백 → 수정 세션.
- **팔경**: 다음 에이전트 = **#33 포항 결손 오버레이**

## 축제 숙소허브 #1 — 미추홀→옹진 오탐 (Cloud)

- **세션** `축제 숙소허브 #1, 주소 매칭`
- **브랜치** `cursor/festival-stay-hub-c241` · tip `60e7e10d` · PR [#233](https://github.com/catgeot/Days/pull/233)
- **원인**: 인천 시드가 인천·강화·옹진뿐 · 옹진 좌표가 군청(미추홀 인근) → 학산마당극놀래 숙소·투어가 「옹진」
- **수정**: 주소 시·군·구로 구 허브(`michuhol`) 우선 · 없으면 인천 시도 대표 · 옹진군 주소는 옹진 유지
- **VERIFY**: `smoke:korea-festival-personal` · `smoke:korea-theme-cross-links` · `smoke:korea-tna-strip` · `smoke:korea-festival-stay-url` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/festival-stay-hub → git Preview `/korea`
- **QA**: 학산마당극놀래 본문 숙소·투어 제목이 **미추홀**인지(옹진 아님)

## 축제 숙소허브 #2 다음

```
축제 숙소허브 #2, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
브랜치 cursor/festival-stay-hub-c241 · PR #233 · Preview /qa/festival-stay-hub
금지: UI 리디자인 · 축제 시트 리팩터 · feature에 plans/** 커밋
작업: 학산마당극놀래 본문 숙소·투어가 미추홀인지(옹진 아님). OK면 PR #233 병합
```
