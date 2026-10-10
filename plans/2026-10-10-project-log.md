# 2026-10-10 프로젝트 일지

직전: [`2026-10-06-project-log.md`](./2026-10-06-project-log.md)

## 축제 딥링크 #1, 목록 밖 상세

- **세션** `축제 딥링크 #1, 목록 밖 상세` · branch `cursor/festival-deeplink-1147` · tip `39c9a833` · draft PR [#418](https://github.com/catgeot/Days/pull/418) · **병합 금지**
- **조치** `/korea?festival=` 가 festivalWindow 목록에 없으면 `festivalDetail`로 시트를 열고 URL을 유지한다. 실패 시에만 쿼리를 지우고 「축제 정보를 찾을 수 없어요」. 종료일 < 오늘(KST)이면 «종료된 축제» 배지, 예매·숙소·투어 CTA 숨김. Edge 변경 없음.
- **VERIFY** `npm run test:health` 178 pass · `vite build` pass · 로컬 프로덕션 빌드 390px `/korea?festival=638576` 시트·URL 유지 (국향대전 10.23–11.08). git Preview는 Vercel SSO.
- **다음** 사람 Preview 후 PR #418 병합. 638576이 TourAPI에 재등록되면 contentId가 바뀔 수 있음.
