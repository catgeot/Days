# 2026-10-02 프로젝트 일지

직전: [`2026-10-01-project-log.md`](./2026-10-01-project-log.md)

## 팔경 활용 #95, 완도8경 상왕봉 SSOT 정제

- **세션** `팔경 활용 #95, 완도 상왕봉 정제` · branch `cursor/palgyeong-use-e744` · tip `54ba8135` · PR [#368](https://github.com/catgeot/Days/pull/368)
- **조치** 완도8경의 국화섬 표기를 완도군 공식 명칭인 상왕봉(`Sangwangbong Peak`, 644m, 좌표 34.34829, 126.693023)으로 SSOT 정제. 화성시 국화도 동명 캐시 오탐 원천 차단. 공식 사진 3장 및 오버레이 정상 연동. `.ai-context.md` §4.1 15 규칙을 '지명 오탐·동명 충돌은 SSOT 데이터로 정제'로 실정에 맞게 합리화.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS.
- **Preview** https://www.gateo.kr/qa/palgyeong-use
- **작업 로그** 완도8경 상왕봉 SSOT 정제
- **다음** 없음

## 팔경 활용 #95, 국화섬 로직 되돌림

- **세션** `팔경 활용 #95, 완도 데이터만` · branch `cursor/palgyeong-use-e744` · tip `32246408` · PR [#368](https://github.com/catgeot/Days/pull/368)
- **조치** 갤러리 개요에 넣었던 상왕봉 문장과 `place_chat_intro` 조회 키 우회를 제거. 갤러리 개요는 무니 써머리. 국화섬은 검색 행 개요·공식 사진 3장만. 재발 방지: `.ai-context` **§4.1 15**.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` PASS.
- **Preview** https://www.gateo.kr/qa/palgyeong-use
- **작업 로그** 국화섬 로직 되돌림
- **다음** 없음

## 팔경 활용 #95, 완도 검색 지역

- **세션** `팔경 활용 #95, 완도 검색 지역` · branch `cursor/palgyeong-use-e744` · tip `75aaa7f4` · PR [#368](https://github.com/catgeot/Days/pull/368)
- **조치** 탐색홈에서 완도8경 국화섬을 열면 `place_chat_intro`가 이름「국화섬」캐시로 경기도 화성시를 가리켰다. 목록명은 국화섬. 핀은 위키백과 상황봉 34.34829, 126.693023. 영문명 Sangwangbong. 장소 카드 한 줄은 완도군 상왕봉(644m). intro 키는 `완도 상왕봉`이라 이름 캐시를 쓰지 않는다. 검색 행 overview는 `searchOverlayDesc` 유지. JSON contentId 없음.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → 홈 검색「완도」국화섬 · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app`
- **작업 로그** 완도 국화섬 검색 지역
- **다음** 순수 사진·개요 누락 없음. contentId 기입은 종료 트랙 — [`feature-handoff-index.md`](./feature-handoff-index.md)

## 팔경 활용 #95, 완도 결손 오버레이

- **세션** `팔경 활용 #95, 완도 결손 오버레이` · branch `cursor/palgyeong-use-e744` · tip `996e53ac` · PR [#368](https://github.com/catgeot/Days/pull/368)
- **조치** 완도8경 국화섬은 한국민족문화대백과 제5경 상황백운홍춘국원. 완도군 문화관광 현재 이름은 상왕봉(644m·완도읍·군외면·제2코스 들머리 죽청리). 공식 사진 3장. JSON contentId 없음. overview는 `searchOverlayDesc`만. 화성 국화도와 구분.
- **VERIFY** `smoke:korea-local-scenic-lists` · `smoke:korea-scenic-search` · `smoke:korea-scenic-spots` · `npm run build` PASS. 순수 누락 **0**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=wando` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=wando`
- **작업 로그** 완도 국화섬 사진
- **다음** 순수 사진·개요 누락 없음. contentId 기입은 종료 트랙 — [`feature-handoff-index.md`](./feature-handoff-index.md)
