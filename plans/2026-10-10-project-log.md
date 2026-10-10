# 2026-10-10 프로젝트 일지

직전: [`2026-10-06-project-log.md`](./2026-10-06-project-log.md)

## 축제 딥링크 #1, 목록 밖 상세

- **세션** `축제 딥링크 #1, 목록 밖 상세` · branch `cursor/festival-deeplink-1147` · tip `e7773a21` · PR [#418](https://github.com/catgeot/Days/pull/418) ready · **병합 금지**
- **조치** `/korea?festival=` 가 festivalWindow 목록에 없으면 `festivalDetail`로 시트를 열고 URL을 유지한다. 실패 시에만 쿼리를 지우고 「축제 정보를 찾을 수 없어요」. 종료일 < 오늘(KST)이면 «종료된 축제» 배지, 예매·숙소·투어 CTA 숨김. 목록 밖 시트만 날짜·장소 아래에 기준일(`fetchedAt` 등) 또는 「최신 일정은 공식 홈페이지에서 확인해 주세요」를 보인다. Edge 변경 없음.
- **VERIFY** `npm run test:health` 179 pass (기준일 줄은 deepLinkItem만) · `vite build` pass · 로컬 프로덕션 빌드 390px `/korea?festival=638576` 시트·URL 유지 (국향대전 10.23–11.08, 기준일 줄 이전 커밋). git Preview는 Vercel SSO.
- **다음** 사람 Preview 후 PR #418 병합. 638576이 TourAPI에 재등록되면 contentId가 바뀔 수 있음.
