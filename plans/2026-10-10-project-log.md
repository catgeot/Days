# 2026-10-10 프로젝트 일지

직전: [`2026-10-06-project-log.md`](./2026-10-06-project-log.md)

## 축제 딥링크 #1, 목록 밖 상세

- **세션** `축제 딥링크 #1, 목록 밖 상세` · branch `cursor/festival-deeplink-1147` · tip `72397e1f` · PR [#418](https://github.com/catgeot/Days/pull/418) ready · **병합 금지**
- **조치** 목록 밖 딥링크는 `festivalDetail`로 시트를 연다. 종료일 < 오늘(KST)이면 목록 안·밖 모두 «종료된 축제»와 예매·숙소·투어 숨김(의도된 동작). 라이브 festivalWindow 299건 중 종료 43건(설악문화제 포함). 사진 로드 실패는 깨진 아이콘 대신 빈 칸. Edge 변경 없음.
- **VERIFY** `npm run test:health` 181 pass · `vite build` pass · 로컬 390px `/korea?festival=638576`(기준일 줄) · `/korea?festival=1718491`(사진 6장·종료 배지).
- **다음** 사람 Preview 후 PR #418 병합. 후속(이번 PR 아님): 딥링크 시트 닫으면 지역이 아니라 기본 목록, 딥링크 히어로 없음, 캐시가 오래돼도 경고 없음.
