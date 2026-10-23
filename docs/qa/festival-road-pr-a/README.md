# 축제로드 PR-A (flag ON)

WebKit 390×844, `deviceScaleFactor: 1`. Dev server with `VITE_GATEO_FESTIVAL_ROAD=1`. Fixture: `/qa/festival-road` (속초 출발, 강원 동해안).

1. `01-button.png` — 날짜·장소 아래 «이 축제로 동선 보기»
2. `02-numbered-order.png` — 번호 순서, 고성 회색 점, 지도 자리 높이 160
3. `03-gray-nearby.png` — 회색 점 고성의 «주변 볼거리» (건봉사)
4. `04-all-gray.png` — 다음주, «고른 기간에 축제가 없어요. 날짜를 바꿔 보세요»

Flag OFF (`VITE_GATEO_FESTIVAL_ROAD` unset) does not mount the button or this route.
