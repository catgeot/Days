# 2026-10-01 프로젝트 일지

직전: [`2026-09-30-project-log.md`](./2026-09-30-project-log.md)

## 탐색 검색 → 장소카드 뒤로가기

- **브랜치** `cursor/explore-place-back-84a8` · `afeb4ec3` · PR [#366](https://github.com/catgeot/Days/pull/366)
- **원인** 장소카드 ← 가 카드 마운트 이후 경로만 봐서, 탐색 검색 → 지구본 써머리 → `/place` 뒤로가기가 `navigate('/')`로 떨어짐.
- **조치** 탐색에서 연 카드만 검색·선택 목록으로 복귀. 탐색 밖 써머리에서 연 카드는 기존처럼 홈. 써머리 X는 지구본 유지.
- **VERIFY** `npm run smoke:place-card-back` PASS
- **Preview** git `https://days-git-cursor-explore-place-back-84a8-catgeots-projects.vercel.app/explore`

## 팔경 활용 #93, 기백산 검색 중복

- **세션** `팔경 활용 #93, 기백산 검색 중복` · branch `cursor/palgyeong-use-e744` · tip `10b30afa` · PR [#367](https://github.com/catgeot/Days/pull/367)
- **확인** 배포본 탐색 검색「기백산」은 같은 좌표의 방문 기록 두 줄(사진 없는 함양 부제 · Sang-won-ri Unsplash 사라예보 건물)이 카드 둘. 함평 팔경 목록 행은 「함평 N경」. 돌머리 상세는 관광 정보 응답 전 아이콘·빈 개요, 응답 후 개요와 사진. 영구 빈 개요 아님.
- **조치** 같은 한글 이름·같은 좌표는 한 장, 한글 place_id 우선. 기백산 빈 사진·Unsplash는 Tour `126033` 공식 사진. 장소 카드 갤러리도 그 3장. 팔경 상세는 응답 전에 목록 사진. JSON contentId 기입 없음.
- **VERIFY** `smoke:visited-place-search` · `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → 홈 검색「기백산」 · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/`
- **작업 로그** 기백산 검색 한 장
- **다음** **#94 합천8경 1**(옥전고분군) · 순수 누락 **2**/876 — [`feature-handoff-index.md`](./feature-handoff-index.md)

## 팔경 활용 #94, 합천 결손 오버레이

- **세션** `팔경 활용 #94, 합천 결손 오버레이` · branch `cursor/palgyeong-use-e744` · tip `9c4840aa` · PR [#368](https://github.com/catgeot/Days/pull/368)
- **조치** 합천8경 제7경 옥전고분군(쌍책면 성산리 산23-18·황강옥전로 1558) 민족문화대백과 공식 사진 3장·개요. 사적 제326호·유네스코 가야고분군 1666-003. JSON contentId 없음. overview는 `searchOverlayDesc`만.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=hapcheon` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=hapcheon`
- **작업 로그** 합천 옥전고분군 사진
- **다음** **#95 완도8경 1**(국화섬) · 순수 누락 **1**/876 — [`feature-handoff-index.md`](./feature-handoff-index.md)
