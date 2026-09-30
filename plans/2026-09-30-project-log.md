# 2026-09-30 프로젝트 일지

직전: [`2026-09-29-project-log.md`](./2026-09-29-project-log.md)

## 팔경 활용 #91, 옥천 결손 오버레이

- **세션** `팔경 활용 #91, 옥천 결손 오버레이` · branch `cursor/palgyeong-use-e744` · tip `5e47e56f` · 코드 `a3c8e435` · PR [#361](https://github.com/catgeot/Days/pull/361)
- **조치** JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 옥천9경 제2경 옛37번 국도변 벚꽃길(교동저수지~소정리 8km·향수옥천 100리길) 옥천군 문화관광 공식 사진 3장·개요. 탐색 검색 desc 스모크.
- **VERIFY** `smoke:korea-local-scenic-lists` · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=okcheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=okcheon`
- **추가** QA 피드백 — 옥천9경 **금강유원지**(7경) 검색 썸네일 결손 → 동일 세션 오버레이(군 공식 3장·`127618` 썸네일 매핑)
- **수정** `5f20e005` 갤러리 `splitPlaceOverview`에서 오버레이 `overview` 제거 · 금강유원지 overview에서 TourAPI 메모 문장 삭제. **미완** — 탐색 검색 `localScenicMemberToSuggestion`이 `desc`에 오버레이 개요(240자)를 넣고 intro hydrate를 건너뜀. Preview에서 옛37번 벚꽃길 장소 카드 써머리가 여전히 오버레이 문장.
- **보류** 사람 요청으로 #91 옥천 작업 **중단**. 함양(#93 예정) 착수 금지. 다음 = **#92 옥천 세션 점검·QA**
- **다음** [`feature-handoff-index.md`](./feature-handoff-index.md) **#92**

## 팔경 활용 #92, 옥천 세션 점검·QA

- **세션** `팔경 활용 #92, 옥천 세션 점검·QA` · branch `cursor/palgyeong-use-e744` · tip `14a2b992` · **main** `102a4fae` · PR [#361](https://github.com/catgeot/Days/pull/361) MERGED
- **진단** 장소 카드에 팔경 개요가 보인 것은 옥천 데이터만의 문제가 아님. `#89` `a2273d0a`가 갤러리에 오버레이 overview를 직접 넣었고, `#90` `04842b6f`가 검색 `desc`에 같은 개요를 넣어 intro hydrate를 skip. `#91` `5f20e005`는 `splitPlaceOverview`만 분리해 `desc` 경로는 남음. 옥천에서 확인된 기존 로직 부작용.
- **조치** `localScenicMemberToSuggestion`은 오버레이 개요를 `desc`에 넣지 않음. 검색 행은 `searchOverlayDesc`. 벚꽃길·금강유원지 썸네일·갤러리 3장 유지. 장소 카드는 `place_chat_intro` hydrate.
- **VERIFY** `smoke:korea-local-scenic-lists` · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → 검색「옥천」· `/korea/theme/scenic?hub=okcheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=okcheon`
- **다음** **#93 함양8경 1**(덕유운해) · 순수 누락 **3**/876 — [`feature-handoff-index.md`](./feature-handoff-index.md)

## 팔경 활용 #93, 함양 결손 오버레이

- **세션** `팔경 활용 #93, 함양 결손 오버레이` · branch `cursor/palgyeong-use-e744` · tip `e656ab9d` · PR [#362](https://github.com/catgeot/Days/pull/362)
- **조치** JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 함양8경 제7경 덕유운해(서상면 남덕유산 1,507m·영각사 덕유월성로 567). 디지털함양문화대전 덕유산 공식 사진 3장. 오버레이 overview는 `searchOverlayDesc`만.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS · 순수 누락 **2**/876
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=hamyang` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=hamyang`
- **다음** **#94 합천8경 1**(옥전고분군) · 잔여 순수 누락 완도 국화섬 — [`feature-handoff-index.md`](./feature-handoff-index.md)
- **추가** 사람 QA — 검색홈「함양」카드(서암석불·대봉산·개평한옥마을·지안재)와 명소홈 검색(지리산 가는길·화림동계곡·기백산) 써머리 공란·주소만. tip `092c1f02` Tour overview를 그 줄에만 표시. desc 미대입. 덕유운해는 오버레이 개요 우선.
