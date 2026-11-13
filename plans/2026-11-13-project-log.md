# 2026-11-13 프로젝트 일지

이전: [`2026-11-12-project-log.md`](./2026-11-12-project-log.md)

## 명승 본문 #1, 넓은 본문

- 명승 명소 본문을 넓은 화면에서 명승 홈과 같은 너비로 연다. 대표 사진은 가로로 넓어지고, 인근 카드는 넓은 화면에서 네 칸이다.
- 경복궁 인근 여행지는 선정 명소가 없는 종로 대신 구리·고양·과천·광명으로 간다. 선정 0건 hub는 국가유산 명승과 관광지를 펼친다.
- 코드 `688da29c` · 브랜치 `cursor/scenic-body-wide-fddc` · PR [#783](https://github.com/catgeot/Days/pull/783). `node scripts/smoke-korea-theme-cross-links.mjs` PASS.
- Preview 배포가 본문과 무관하게 엣지 컴파일에서 실패했다. `926797b3`에서 기행문 메타가 `locationDisplay`를 묶지 않게 했다. 생성된 기행문 메타 파일은 그대로다.
- Preview `/qa/scenic-body-wide` · git `https://days-git-cursor-scenic-body-wide-fddc-catgeots-projects.vercel.app/korea/theme/scenic?spot=gyeongbokgung`.
- 다음 제시어 없음. 같은 턴 Preview에서 본문 너비와 인근 시·군을 확인한다.
- 코드 PR [#783](https://github.com/catgeot/Days/pull/783) main `5db98255` · 2026-11-13 19:54 KST. 주제 종료. 확인은 `https://www.gateo.kr/korea/theme/scenic?spot=gyeongbokgung`.
