# 2026-11-02 프로젝트 일지

이전: [`2026-10-26-project-log.md`](./2026-10-26-project-log.md)

## 방문한 여행사 · 제휴 코드 누락 정리

- 브랜치 `cursor/affiliate-links-4ecd` · PR [#645](https://github.com/catgeot/Days/pull/645) · 코드 tip `1d0b182d`.
- 점검: 여행사 목록 홈 11곳은 제휴 코드 정상. 새는 곳은 방문 기록이 클릭 URL을 그대로 저장·재열기하는 경로의 비제휴 링크 5건 — 푸터 Credits 파트너 4건(`mapboxAttribution.js`)과 축제 Korail Trip.com(`TRIP_COM_KORAIL_HREF`).
- 조치: Credits 4건 제휴 URL로 교체, Korail 링크에 `Allianceid`/`SID`/`trip_sub1` 부착(경로 `/trains/korail/` 유지). 회귀 검사는 `smoke-trust-disclosure`·`festival-access-card.test`.
- 알려진 것: `myrealt.rip` 단축 링크는 `travelAgencies.js` MRT hosts에 없어 방문 기록 대상 아님(별도 판단). `smoke-trust-disclosure`(로고 패널 단언)·`festival-access-card` 5·7번은 main에서도 기존 실패.
- 사람 체크: Credits 파트너 링크 클릭 URL과 축제 교통 카드 「외국어 예매 (Trip.com)」 링크에 제휴 파라미터가 붙는지 본다. 보류안: 재열기 시 비제휴 URL을 제휴 홈으로 보정(선택지 A).
