# 2026-11-28 프로젝트 일지

이전: [`2026-11-27-project-log.md`](./2026-11-27-project-log.md)

## 탐색 검색 — «수원 화성»

- «수원 화성»이 `수원`+`화성`으로 쪼개져 화성시 선택 카드 12건만 나왔다. 공백을 지운 정식명 수원화성은 이미 맞았는데, 지역 토큰 분리가 먼저였다.
- 전체 구문(공백 제거) 명소·별칭이 지역 분리보다 우선. 단독 «화성»은 도시 선택을 유지하고 수원화성을 후보로 넣는다. «화성행궁»·«경주 불국사»·«강릉 경포대»·«부산 해운대»는 기존 1순위.
- 코드 `8dded898f` · `cursor/search-phrase-alias-3af1` · PR [#967](https://github.com/catgeot/Days/pull/967). 헬스 `scripts/health/explore-search-phrase-landmark.test.mjs`. lint·build PASS.
- 사람 확인: 390에서 «수원 화성»·«수원화성» 1순위가 `/place/hwaseong-fortress`인지, «화성» 목록에 수원화성이 있는지.
