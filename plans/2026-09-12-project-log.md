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

## 팔경 활용 #23 — 창녕 검색 버그픽스 (Cloud)

- **세션** `팔경 활용 #23, 창녕 검색 버그픽스`
- **브랜치** `cursor/palgyeong-use-e744` · tip `251cd352` · PR [#221](https://github.com/catgeot/Days/pull/221)
- **완료**: `창령`+hub URL이면 창녕구경이 주입되던 오탐을 검색 풀 0건일 때 팔경 병합 금지로 막음. `창녕` 관광지는 0건 중·소분류 URL을 해제하고, 분류칩 건수가 있으면 빈 문구를 숨김.
- **VERIFY**: `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-local-scenic-lists` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `창령`은 팔경 없음 · `창녕`은 관광지 목록·칩 일치
- **잔여**: 다음 허브 **진주8경 6**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #24 — 창령→창녕 별칭 (Cloud)

- **세션** `팔경 활용 #24, 창령→창녕 별칭`
- **브랜치** `cursor/palgyeong-use-e744` · tip `e601302f` · PR [#221](https://github.com/catgeot/Days/pull/221)
- **완료**: 발음 혼동 `창령`·`창령군`을 창녕 허브 별칭으로 연결. 명승 홈 검색은 공식명 창녕으로 풀어 팔경·명소·명승·관광지가 창녕과 같다. 창녕구경 리스트 제목은 유지.
- **VERIFY**: `npm run smoke:korea-scenic-search` PASS · `npm run audit:city-attraction-hubs` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `창령` 검색이 창녕 결과
- **잔여**: 다음 허브 **진주8경 6**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #25 — 진주 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #25, 진주 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `7f537719` · PR [#222](https://github.com/catgeot/Days/pull/222)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 진주8경 결손 6건(남강 의암·뒤벼리·새벼리·망진산 봉수대·비봉산의 봄·월아산 해돋이)의 개요·주소·공식 사진 보강. 한국관광공사 의기사와 의암·망진산 봉수대 사진을 연결했고, 뒤벼리는 남가람공원·선학산전망대, 새벼리는 석류공원, 비봉산은 의곡사, 월아산은 청곡사 공식 사진으로 근사했다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=jinju`
- **잔여**: 사진/개요 순수 누락 **178**/876. QA 후 다음 허브 **상산팔경 6**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #26 — 상산(진천) 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #26, 상산(진천) 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `29c7bb3a` · PR [#225](https://github.com/catgeot/Days/pull/225)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 상산팔경 결손 6건(평사낙안·우담제월·금계완사·상산모운·어은계석·적대청람)의 개요·주소·공식 사진 보강. 한국관광공사 미호천 농다리·초평호 미르숲·진천 농교·보탑사·정송강사 사진을 연결했고, 금계완사는 같은 군 농교 물가, 상산모운은 만뢰산 보탑사, 우담제월·적대청람은 초평호·미르숲 공식 사진으로 근사했다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=jincheon`
- **잔여**: 사진/개요 순수 누락 **172**/876. QA 후 다음 허브 **구례10경 5**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #27 — 구례 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #27, 구례 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `2ed942ea` · PR [#226](https://github.com/catgeot/Days/pull/226)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 구례10경 결손 5건(노고단 운해·반야봉 낙조·피아골 단풍·산동 산수유꽃·노고단 설경)의 개요·주소·공식 사진 보강. 한국관광공사 노고단 정상·운해·설화·반야봉 낙조·피아골 계곡·산동 산수유꽃 사진을 연결했고, 구례군청 피아골 출렁다리 단풍 사진을 보탰다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=gurye`
- **잔여**: 사진/개요 순수 누락 **167**/876. QA 후 다음 허브 **강진12경 5**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #27 — 구례 수목원 사진 (Cloud QA)

- **세션** `팔경 활용 #27, 구례 결손 오버레이` 사람 Preview 피드백
- **브랜치** `cursor/palgyeong-use-e744` · tip `fbc921de` · PR [#226](https://github.com/catgeot/Days/pull/226)
- **완료**: GATEO 선정 구례 수목원(`gurye-arboretum`, TourAPI 3001143)은 개요만 있고 firstimage가 비어 목록·상세가 아이콘이었다. 한국관광공사 구석구석 공공 사진 6장을 대표 이미지·galleryUrls로 넣었다. palgyeong JSON contentId·scenic 승격 없음.
- **VERIFY**: `npm run smoke:korea-scenic-spots` PASS · `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=gurye` 지역 대표 명소 구례 수목원
- **다음**: #28 강진12경 5. 사람은 같은 턴에 수목원 썸네일·본문 갤러리 확인.

## 팔경 활용 #28 — 강진 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #28, 강진 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `5ced5845` · PR [#226](https://github.com/catgeot/Days/pull/226)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 강진12경 결손 5건(월출산·가학산·백야김좌진기념관·남도별미식문화박물관·강진청자박물관)의 개요·주소·공식 사진 보강. 가학산은 같은 능선 흑석산자연휴양림 근사 사진. 백야김좌진기념관은 실제 시설이 충남 홍성(강진 동명 시설 없음). 남도별미식문화박물관은 강진 동명 시설이 없어 사의재 저잣거리 안내·근사 사진. 강진청자박물관은 고려청자박물관 공식 사진.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=gangjin`
- **잔여**: 사진/개요 순수 누락 **162**/876. QA 후 다음 허브 **선유8경 5**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #28 — 강진 12경 제목·청자단지 (Cloud QA)

- **세션** `팔경 활용 #28, 강진 결손 오버레이` 사람 Preview 피드백
- **브랜치** `cursor/palgyeong-use-e744` · tip `6391db8d` · PR [#228](https://github.com/catgeot/Days/pull/228)
- **완료**: 강진 검색 소제목을 「강진 명소」에서 공식명 **강진 12경**으로 맞춤(`listKind other` + 제목 N경). 청자단지는 contentId만 있고 사진이 없어 고려청자촌 공식 사진 런타임 오버레이. JSON contentId 추가 없음. #226은 main 병합됨.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → 지구본·명승 「강진」검색 그룹명 · 청자단지 썸네일
- **다음**: #29 선유8경 5. 사람은 같은 턴에 그룹명·청자단지 사진 확인.

## 팔경 활용 #29 — 군산 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #29, 군산 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `ba1a57e2` · PR [#229](https://github.com/catgeot/Days/pull/229)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 선유8경 결손 5건(선유낙조·명사십리·망주폭포·월영단풍·무산십이봉)의 개요·주소·공식 사진 보강. 한국관광공사 선유도 낙조·선유도해수욕장·말도 사진과 국가유산 망주봉 폭포 사진을 연결했고, 월영단풍은 같은 섬 대각산 공식 사진으로 근사했다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=gunsan`
- **잔여**: 사진/개요 순수 누락 **157**/876. QA 후 다음 허브 **금산10경 5**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #30 — 금산 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #30, 금산 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `f6c7a3f2` · PR [#231](https://github.com/catgeot/Days/pull/231)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 금산10경 결손 5건(산림문화 힐링명소·금산인삼 세계농업유산·인삼·약령시장·월영산 원골·태조태실 요광은행나무)의 개요·주소·공식 사진 보강. 한국관광공사 금산산림문화타운·인삼약령시장·월영산 출렁다리·기러기공원·태조대왕 태실 사진을 연결했고, 세계농업유산은 같은 군 금산인삼관 공식 사진으로 근사했다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=geumsan`
- **잔여**: 사진/개요 순수 누락 **152**/876. QA 후 다음 허브 **남해12경 5**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #31 다음 — 남해 결손 오버레이

```
팔경 활용 #31, 남해 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 남해12경 사진·개요 없는 5건(남해 금산과 보리암·창선교와 남해지족해협 죽방렴·서포 김만중 선생 유허와 노도·남해 물건리 방조어부림과 물미해안·창선-삼천포대교)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=namhae
```

## 같은 세션 QA — AGENTS.md 전 주제 규칙

- **적용**: [`AGENTS.md`](../AGENTS.md) Cloud · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§5** · `.ai-context` **§4.1 13**
- **기본**: 복잡 로직·토큰 과다 작업 **외에는** 작업 세션에서 QA 마무리. 다음 제시어 = 다음 작업. `{주제} #N, 사람 Preview QA`를 다음 에이전트 채팅으로 넘기지 않음.
- **예외**: 복잡 로직·토큰 과다 세션만 별도 사람 Preview QA 채팅 허용. 피드백 → 수정 세션.
- **팔경**: 다음 에이전트 = **#31 남해 결손 오버레이**


## 한국 투어티켓 #1 — 축제·명승 본문 투어·티켓 카드 섹션 (Cloud)

- **세션**: `한국 투어티켓 #1, 본문 TNA 섹션`
- **브랜치**: `cursor/korea-tna-strip-ef65` · tip `b47d8880` · PR [#223](https://github.com/catgeot/Days/pull/223)
- **완료**:
  1. `EventTnaStrip.jsx` 공통 컴포넌트 신설: 숙소 스트립과 일관된 카드 규격(148px~168px 가로 스크롤, 썸네일, 카테고리, 평점/리뷰수, 가격 포맷, 마이리얼트립 딥링크) 및 헤더 검색 더보기 링크 지원.
  2. 축제 상세 바텀시트(`FestivalDetailSheet.jsx`): `FestivalStayStrip` 바로 아래에 `FestivalTnaStrip` 연동. 카드 스트립 노출 시 중복 텍스트 칩 숨김 처리.
  3. 명승 상세 모달(`ThemeSpotDetailModal.jsx`): `ScenicStayStrip` 바로 아래에 `ScenicTnaStrip` 연동. POI 중첩 모달(`hideTnaStrip={isApiPoiCross}`) 숨김 및 하단 CrossRail 텍스트 칩 조건부 처리.
  4. 다국어(`ko.json`, `en.json`) 번역 키 등록 및 `scripts/smoke-korea-tna-strip.mjs` 신설 (`npm run smoke:korea-tna-strip` PASS).
- **VERIFY**: `npm run smoke:korea-tna-strip` PASS · `npm run smoke:korea-scenic-stay` PASS · `npm run smoke:korea-festival-stay-url` PASS · `npm run smoke:mrt-tna` PASS · `npm run build` PASS
- **Preview**: https://www.gateo.kr/qa/korea-tna-strip → git Preview `/korea/theme/scenic?spot=gyeongbokgung`
- **다음**: 사람 Preview QA (경복궁 등 명승 상세 및 축제 상세 본문 TNA 카드 섹션 확인)

## 한국 투어티켓 #2 — 사람 Preview QA (Cloud)

- **세션**: `한국 투어티켓 #2, 사람 Preview QA`
- **브랜치**: `cursor/korea-tna-strip-ef65` · tip `c567a1c2` · PR [#223](https://github.com/catgeot/Days/pull/223)
- **사람**: Preview에서 명승·축제 상세 투어·티켓 카드 노출 확인. 목록이 몇 개까지인지 질문.
- **답**: 본문 스트립은 `EventTnaStrip`이 마이리얼트립에 `size: 10`을 요청해 **최대 10개** 가로 스크롤. 검색이 적으면 그만큼만. 더보기는 마이리얼트립 검색(외부).
- **VERIFY**: `npm run smoke:korea-tna-strip` PASS (`size: 10` 상한 포함)
- **Preview**: https://www.gateo.kr/qa/korea-tna-strip → git Preview `/korea/theme/scenic?spot=gyeongbokgung`
- **다음**: 개수 조정이면 `EventTnaStrip` `size`만 수정. 추가 피드백 없으면 PR #223 병합 후 인덱스 행 삭제

## 한국 투어티켓 #3 — 숙소·투어 20개 · 크게 보기 (Cloud)

- **세션**: `한국 투어티켓 #3, Preview OK면 PR 병합`
- **브랜치**: `cursor/korea-tna-strip-ef65` · tip `404878dc` · PR [#223](https://github.com/catgeot/Days/pull/223)
- **사람 피드백**: 숙소·투어 모두 기본 20개 · 「크게 보기」로 펼쳐 아래로 스크롤
- **완료**:
  1. `EventTnaStrip` `MRT_TNA_FETCH_SIZE`(20) · `EventStayStrip` `MRT_STAY_PAGE_SIZE`(20)
  2. `StripListLargeToggle` — 축제·명승 리스트와 같은 「크게/기본」칩. 펼치면 1열(sm 2열) 세로 그리드, 접으면 기존 가로 스크롤
- **VERIFY**: `npm run smoke:korea-tna-strip` PASS · `npm run smoke:korea-scenic-stay` PASS · `npm run smoke:korea-festival-stay-url` PASS · `npm run build` PASS
- **Preview**: https://www.gateo.kr/qa/korea-tna-strip → git Preview `/korea/theme/scenic?spot=gyeongbokgung`
- **다음**: 사람 Preview — 20개·크게 펼침 확인. OK·추가 피드백 없으면 PR #223 병합 후 인덱스 행 삭제

## 한국 투어티켓 #4 — 크게는 가로로 카드만 (Cloud)

- **세션**: 사람 피드백 — 세로 펼침은 본문 스킵이 어렵다. 가로로 카드만 키울지, 5개씩 더보기인지
- **결정**: **크게 = 카드만 키우고 좌우 스크롤 유지**. 5개씩 더보기는 MRT 더보기와 겹치고 「크게」도 아니어서 넣지 않음
- **브랜치**: `cursor/korea-tna-strip-ef65` · tip `13bd6974` · PR [#223](https://github.com/catgeot/Days/pull/223)
- **완료**: 숙소·투어 「크게」카드 220~252px · 썸네일 132px · `overflow-x-auto` 유지. 세로 그리드 제거
- **VERIFY**: `npm run smoke:korea-tna-strip` PASS · `npm run smoke:korea-scenic-stay` PASS · `npm run smoke:korea-festival-stay-url` PASS · `npm run build` PASS
- **Preview**: https://www.gateo.kr/qa/korea-tna-strip
- **다음**: 사람 Preview — 크게가 가로인지 · 아래로 스킵되는지. OK면 PR #223 병합

## 한국 투어티켓 #5 — 사람 Preview QA PASS · PR 병합

- **세션**: `한국 투어티켓 #5, Preview OK면 PR 병합`
- **사람**: QA 통과 — 「크게」가 카드만 키우고 좌우 스크롤 · 아래로 본문 스킵
- **브랜치**: `cursor/korea-tna-strip-ef65` · merge `0071d2cb` · PR [#223](https://github.com/catgeot/Days/pull/223) merge ✅
- **VERIFY**: `npm run smoke:korea-tna-strip` PASS · `npm run smoke:korea-scenic-stay` PASS · `npm run smoke:korea-festival-stay-url` PASS
- **PROD**: https://www.gateo.kr/korea/theme/scenic?spot=gyeongbokgung
- **다음 제시어 없음** (주제 종료). 인덱스 행을 병합 완료로 닫음

## 한국 투어티켓 — 릴리스 노트 Updates 반영

- **세션**: 사람 요청 — 합의 초안을 로고 패널 Updates에 넣음
- **브랜치**: `cursor/tna-notes-058f` · merge `488816f5` · PR [#227](https://github.com/catgeot/Days/pull/227) merge ✅
- **완료**: `releaseNotes.js` 맨 앞 `2026-09-12` KO+EN. 홈 자동 팝업 없음
- **VERIFY**: `npm run smoke:release-notes-footer` PASS
- **PROD**: 로고 패널 → Updates. 배포 후 확인

## 한국 투어티켓 — 실행 계획서 수립 및 클룩·렌터카 연계 준비

- **플랜**: [`korea-tna-strip-plan.md`](./korea-tna-strip-plan.md) 신설
- **내용**: 본문 TNA 마이리얼트립 카드 하단에 클룩 즐길거리("즐길거리 클룩에서 더보기") 및 렌터카("렌터카 최저가 비교") 아웃링크 칩 연계 방안 확정 및 세션 로드맵 세분화.
- **다음**: `한국 투어티켓 #6, 클룩 즐길거리·렌터카 연동` 진행.

## 한국 투어티켓 #6 — 클룩 즐길거리·렌터카 연동 (Cloud)

- **세션**: `한국 투어티켓 #6, 클룩 즐길거리·렌터카 연동`
- **브랜치**: `cursor/korea-tna-strip-ef65` · tip `0c77e661` · PR [#230](https://github.com/catgeot/Days/pull/230)
- **완료**: `EventTnaStrip` 하단에 클룩 즐길거리(`getKlookSearchUrl`)·렌터카(`getKlookRentalUrlByLocation`) 아웃링크 칩. 마이리얼트립 카드 규격 유지. empty에서도 칩 표시. KO/EN i18n.
- **VERIFY**: `npm run smoke:korea-tna-strip` PASS · `npm run smoke:korea-scenic-stay` PASS · `npm run smoke:korea-festival-stay-url` PASS · `npm run build` PASS
- **Preview**: https://www.gateo.kr/qa/korea-tna-strip → git Preview `/korea/theme/scenic?spot=gyeongbokgung`
- **QA 체크**: 투어 섹션 하단 클룩 칩 2개 · 카드 가로 스크롤 유지 · 칩이 클룩으로 열리는지
- **다음**: Preview OK면 PR #230 병합. 레이아웃 피드백이면 칩 스타일만 수정

```
한국 투어티켓 #7, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-tna-strip-plan.md
브랜치 cursor/korea-tna-strip-ef65 · PR #230 · Preview /qa/korea-tna-strip
금지: UI 리디자인 · 마이리얼트립 카드 규격 파손 · feature에 plans/** 커밋
작업: 경복궁·축제 상세 투어 섹션 하단 클룩 칩이 보이면 PR #230 병합. 레이아웃 피드백이면 칩 스타일만 수정
```

## AI 모델 #1 — Gemini 2.5 Flash/Pro 교체 (Cloud)

- **세션** `AI 모델 #1, 2.5 종료 교체`
- **브랜치** `cursor/gemini-models-df4c` · tip `9a0dc58d` · PR [#224](https://github.com/catgeot/Days/pull/224)
- **이유**: Vertex 2.5 Flash/Pro 퇴직 2026-10-20. Gemini API 일자는 철회됐으나 Vertex·신규키 제한이 남아 교체.
- **매핑**: FAST `3.1-flash-lite`(유지) · QUALITY `2.5-flash`→`3.5-flash` · WRITE `2.5-pro`→`3.1-pro-preview`(폴백 `3.5-flash`)
- **Edge 배포됨**: `gemini-proxy` · wiki · toolkit · magazine · event-travel-guide · explain-event-term
- **LIVE ping**: 3.5-flash 200 · 2.5-flash→3.5-flash · 2.5-pro→3.1-pro-preview
- **VERIFY**: `npm run smoke:gemini-models` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/gemini → git Preview `/`
- **QA 체크**: 홈 무니 한 턴 · 예약/교통 질문 · (가능하면) 리뷰 AI
- **다음**: 사람 같은 턴 Preview. 피드백 있으면 #2 수정, 없으면 PR 병합 후 index 행 삭제

```
AI 모델 #2, Preview 피드백 수정
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
브랜치 cursor/gemini-models-df4c · PR #224 · Preview /qa/gemini
금지: UI 리디자인 · 최신 Flash 추격 · feature에 plans/** 커밋
작업: 사람 Preview 피드백이 있으면 모델 티어만 수정. 없으면 PR 병합 후 이 행 삭제
```

## AI 모델 #2 — 사이트 점검 FAST·QUALITY ping (Cloud)

- **세션** `AI 모델 #2, Preview 피드백 수정`
- **브랜치** `cursor/gemini-models-df4c` · tip `7ab5d0fb` · PR [#224](https://github.com/catgeot/Days/pull/224)
- **사람**: 무니 대화 이상 없음. 워크스페이스 사이트 점검(`smoke-health`)도 티어를 맞춰야 하는지 질문.
- **완료**: P0-3가 `gemini-3.1-flash-lite`만 하드코딩 → `geminiModels` SSOT **FAST + QUALITY**. WRITE(위키·툴킷)는 6시간 cron 비용 때문에 ping 안 함.
- **LIVE**: `FAST=gemini-3.1-flash-lite · QUALITY=gemini-3.5-flash`
- **VERIFY**: `npm run smoke:gemini-models` PASS · `npm run smoke:health` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/gemini → git Preview `/`
- **다음**: 무니 유지 확인되면 PR 병합 후 index 행 삭제

```
AI 모델 #3, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
브랜치 cursor/gemini-models-df4c · PR #224 · Preview /qa/gemini
금지: UI 리디자인 · 최신 Flash 추격 · feature에 plans/** 커밋
작업: 무니 대화가 이전과 같으면 PR #224 병합 후 이 행 삭제. 추가 티어 피드백이면 모델 티어만 수정
```

