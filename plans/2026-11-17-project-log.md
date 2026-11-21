# 2026-11-17 프로젝트 일지

이전: [`2026-11-13-project-log.md`](./2026-11-13-project-log.md)

## 여행사 홈 #1, 방문 줄 홈 링크

- «방문한 여행사» 줄 오른쪽에 «홈»을 넣었다. 주소는 제휴 홈이고, 줄 본문은 마지막 URL이다. «홈» 클릭은 저장된 href를 덮어쓰지 않고 방문 시각만 갱신한다.
- «연결된 여행사»는 방문한 여행사도 포함해 전체를 보여 준다. panel·explore·planner 공통.
- 코드 `59e4fae7` · 브랜치 `cursor/agency-home-link-e918` · draft PR [#837](https://github.com/catgeot/Days/pull/837).
- 검증: `npm run test:travel-agency-home-link` · `npm run smoke:travel-agencies` · `npm run test:e2e:agency-home-link` PASS. 외부 제휴 사이트로 이동하지 않음.
- 이번 요청은 머지 금지. docs PR은 열어 두고 auto-merge는 켜지 않는다.
