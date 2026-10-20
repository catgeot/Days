# 2026-10-20 프로젝트 일지

이전: [`2026-10-19-project-log.md`](./2026-10-19-project-log.md)

## 축제 확대보기 iOS 탭·스와이프

- draft [#530](https://github.com/catgeot/Days/pull/530) `cursor/festival-lightbox-ios-e9da` tip `0dcaab21` — 스크림 `#000` (`1113cb3d`). 0.92는 흰 시트를 8% 남겨 제목이 비쳤다. 재촬영 `gateo-ops/qa/lightbox-530-2026-10-20/1113cb3d907224f7bb60b0aa91ad4748394b2df0/`. **병합됨** `23b3ac3b`.
- WebKit 390 `hasTouch` `e2e/festival-lightbox-ios.spec.js` PASS. before/after `docs/qa/festival-lightbox-ios/`.

## 축제 확대보기 세로 중앙·뒤로가기

- draft [#531](https://github.com/catgeot/Days/pull/531) `cursor/lightbox-center-aaff` 코드 `d7e08231` · 증거 `bd6f913f`. 390에서 사진을 스테이지 세로 중앙에 두고 이전/다음을 그 높이에 맞춘다. 1280 화살표는 사진 밖. 열 때 같은 URL history 한 칸. 뒤로가면 라이트박스만 닫고 `?festival=`에 남는다. X는 그 칸을 소비. **병합 금지**. 플래그 없음.
- WebKit `e2e/festival-lightbox-ios.spec.js` 4 PASS. 실데이터 `gateo-ops/qa/lightbox-center-2026-10-20/d7e082316377a1333f5a401136a31cd0befb0c23/` (825295 · 세로 포스터 4127746).
