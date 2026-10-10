# 2026-10-10 프로젝트 일지

직전: [`2026-10-06-project-log.md`](./2026-10-06-project-log.md)

## 축제 딥링크 #1, 목록 밖 상세

- **세션** `축제 딥링크 #1, 목록 밖 상세` · branch `cursor/festival-deeplink-1147` · tip `72397e1f` · PR [#418](https://github.com/catgeot/Days/pull/418) ready · **병합 금지**
- **조치** 목록 밖 딥링크는 `festivalDetail`로 시트를 연다. 종료일 < 오늘(KST)이면 목록 안·밖 모두 «종료된 축제»와 예매·숙소·투어 숨김(의도된 동작). 라이브 festivalWindow 299건 중 종료 43건(설악문화제 포함). 사진 로드 실패는 깨진 아이콘 대신 빈 칸. Edge 변경 없음.
- **VERIFY** `npm run test:health` 181 pass · `vite build` pass · 로컬 390px `/korea?festival=638576`(기준일 줄) · `/korea?festival=1718491`(사진 6장·종료 배지).
- **다음** 사람 Preview 후 PR #418 병합. 후속(이번 PR 아님): 딥링크 시트 닫으면 지역이 아니라 기본 목록, 딥링크 히어로 없음, 캐시가 오래돼도 경고 없음.

## 축제 MOONi 후속 #1, 사실·숙소·대화

- **세션** `축제 MOONi 후속 #2, 첫 답 유지·언어` · branch `cursor/mooni-festival-followup` · tip `9f01c4dd` · draft PR [#419](https://github.com/catgeot/Days/pull/419) · **병합·배포 금지**
- **조치** 첫 답은 질문 뒤에도 스레드 맨 위에 남는다. main `37035580`도 질문이 있으면 첫 답을 숨긴다(#416 라이브). 저장 대화는 축제+언어. 영어 목적지 줄과 반복 제목을 정리. prod gemini-proxy는 v25 (`05679653`).
- **VERIFY** `npm run test:health` 202 pass.
- **다음** Preview에서 2930716 첫 답 유지, `?lang=en` 재오픈, 영어 제목 한 번. Edge 배포는 사람 요청 때만.
- **추가** `3bdddf01` 영어 숙소 앞문장은 English (한글), 링크는 Gangneung lodging guide. `npm run test:health` 202 pass. 클라이언트만.
