# 2026-10-21 프로젝트 일지

이전: [`2026-10-20-project-log.md`](./2026-10-20-project-log.md)

## 현지 정보 #1, LI-1 레지스트리

- draft [#533](https://github.com/catgeot/Days/pull/533) `cursor/local-info-registry-8958` tip `a359f621`. 카이로만 slug 레지스트리. 언급은 토큰 전체 일치. 공항→시내 출처는 cairo-airport.com 안내만. Uber 문장 삭제. `VITE_GATEO_LOCAL_INFO_ROLLOUT` 기본 OFF. **병합 금지**.
- 증거 `gateo-ops/qa/li-1-registry/` (ko·en, 390·1280, before/after). `npm run test:health` 581 PASS. 로컬 `place-local-info` 3 PASS. `PlaceGalleryView.jsx` 미변경.
- 확인 안 된 항목 숨김은 이 PR에 없음.
- tip `a4213e86`. 공항 안내 URL은 Chromium WAF 500, WebKit은 TLS 거절. 출처 정의는 남기고 공항→시내 슬롯은 빈 칸이라 칩이 안 나온다. `data-unverified-items`에 공항→시내. `npm run test:health` 584 PASS. 로컬 `place-local-info` 3 PASS.
- tip `83ef9007`. 리뷰 결정으로 공항→시내 칩을 되돌림. 본문은 1c195e32와 같고 Uber 문장은 그대로 없음. 출처는 URL 없이 평문. 확인 안 된 항목에서 공항→시내를 뺌. URL은 2026-10-21 기준 접속 불가 주석만. `npm run test:health` 584 PASS. 로컬 `place-local-info` 3 PASS.

## 축제 확대보기 #4, 로드된 장수

- draft [#532](https://github.com/catgeot/Days/pull/532) `cursor/festival-lightbox-loaded-0e70` tip `6e8a33c3`. 확대보기 카운트·이전/다음이 필름스트립에 로드된 URL만 따른다. 나중에 로드되면 보고 있던 URL은 유지하고 장수만 갱신. **병합 금지**.
- 실데이터 WebKit 증거 `gateo-ops/qa/lightbox-loaded-532/` (390·1280, 825295·637693·3481597, 스와이프·뒤로·X, 2/2→3/3). 목록 URL과 원본 URL 192장 동일, 원본만 실패 0%. 앱 코드 변경 없음.
- #531은 main `25135b92`. WebKit 390 `e2e/festival-lightbox-ios.spec.js` 픽스처 5건 PASS (X 테스트 `page.goto` 타임아웃 1회 후 재실행 PASS). `npm run test:health` 580 PASS.
- 사람 체크: 깨진 사진이 있는 축제에서 필름스트립 장수와 확대보기 `n / m`이 같은지, N번째 썸네일이 그 사진을 여는지.

## 장소 갤러리 라이트박스 iOS 뒤로가기

- draft [#534](https://github.com/catgeot/Days/pull/534) `cursor/lightbox-history-d223` tip `f018ddff`. 확대보기를 열면 같은 URL 히스토리 한 칸. 가장자리 스와이프·브라우저 뒤로가기는 사진만 닫고 갤러리에 남는다. 그다음 뒤로가기는 지구본 써머리. X도 그 칸을 `history.back()`. 사진 변경은 칸을 더하지 않음. 축제 확대보기와 세션 공유. `VITE_GATEO_LIGHTBOX_HISTORY` 기본 ON (`0`이면 OFF). **병합 금지**.
- WebKit 390 제주·파리·방콕: 홈 써머리 → 갤러리 → 확대 → 스와이프 → 뒤로(갤러리) → 뒤로(써머리) 4 PASS. `scripts/health/lightbox-history.test.mjs` 7 PASS.
- 사람 체크: 아이폰 사파리에서 장소 사진 확대 후 왼쪽 가장자리 스와이프가 지구본 써머리로 나가지 않고 갤러리에 남는지.
- Site QA HOLD 반영. 로직 tip `4c790106`. `VITE_GATEO_LIGHTBOX_HISTORY=0`은 장소 갤러리만 끈다. 축제 확대보기 히스토리는 항상 켜 둠(#531). `history.back()`이 popstate를 안 주면 삼키는 리스너는 500ms 뒤 제거. 열린 채 라우트가 바뀌면 같은 URL 칸을 새 라우트로 덮어 고아 칸을 없앰. 단위 10 PASS. WebKit 390·1280 홈→써머리→갤러리→사진→뒤로→써머리 닫기, 제주·파리·방콕, 그리고 `/korea` 지역 칩→축제 확대→뒤로(시트 유지) PASS. draft 유지. **병합 금지**.

## 여행경보 API 키 프로브

- draft [#535](https://github.com/catgeot/Days/pull/535) `cursor/travel-advisory-probe-4534`. 호스티드 러너가 `apis.data.go.kr:443`에 연결하지 못함. run `39591764354`: IPv4 curl 28, IPv6 주소 없음, HTTP 000. 시크릿은 로그에 `***`. UAE 경보 단계 미확인. **병합 금지**.
- Gemini health ping `workflow_dispatch`는 GitHub App 토큰 403으로 실행하지 못함. 리셋(20:20 KST) 이전 스케줄 run `39576844493`(18:25 KST)은 `FAIL(http) code=403 error=origin_not_allowed`.
