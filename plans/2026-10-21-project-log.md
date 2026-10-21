# 2026-10-21 프로젝트 일지

이전: [`2026-10-20-project-log.md`](./2026-10-20-project-log.md)

## 현지 정보 #1, LI-1 레지스트리

- draft [#533](https://github.com/catgeot/Days/pull/533) `cursor/local-info-registry-8958` tip `a359f621`. 카이로만 slug 레지스트리. 언급은 토큰 전체 일치. 공항→시내 출처는 cairo-airport.com 안내만. Uber 문장 삭제. `VITE_GATEO_LOCAL_INFO_ROLLOUT` 기본 OFF. **병합 금지**.
- 증거 `gateo-ops/qa/li-1-registry/` (ko·en, 390·1280, before/after). `npm run test:health` 581 PASS. 로컬 `place-local-info` 3 PASS. `PlaceGalleryView.jsx` 미변경.
- 확인 안 된 항목 숨김은 이 PR에 없음.
- tip `a4213e86`. 공항 안내 URL은 Chromium WAF 500, WebKit은 TLS 거절. 출처 정의는 남기고 공항→시내 슬롯은 빈 칸이라 칩이 안 나온다. `data-unverified-items`에 공항→시내. `npm run test:health` 584 PASS. 로컬 `place-local-info` 3 PASS.

## 축제 확대보기 #4, 로드된 장수

- draft [#532](https://github.com/catgeot/Days/pull/532) `cursor/festival-lightbox-loaded-0e70` tip `6e8a33c3`. 확대보기 카운트·이전/다음이 필름스트립에 로드된 URL만 따른다. 나중에 로드되면 보고 있던 URL은 유지하고 장수만 갱신. **병합 금지**.
- 실데이터 WebKit 증거 `gateo-ops/qa/lightbox-loaded-532/` (390·1280, 825295·637693·3481597, 스와이프·뒤로·X, 2/2→3/3). 목록 URL과 원본 URL 192장 동일, 원본만 실패 0%. 앱 코드 변경 없음.
- #531은 main `25135b92`. WebKit 390 `e2e/festival-lightbox-ios.spec.js` 픽스처 5건 PASS (X 테스트 `page.goto` 타임아웃 1회 후 재실행 PASS). `npm run test:health` 580 PASS.
- 사람 체크: 깨진 사진이 있는 축제에서 필름스트립 장수와 확대보기 `n / m`이 같은지, N번째 썸네일이 그 사진을 여는지.
