# 2026-11-01 프로젝트 일지

이전: [`2026-10-26-project-log.md`](./2026-10-26-project-log.md)

## 축제 카드 배열 #1 — A형 masonry + 와이드

- 축제홈 `/korea` 사진 목록: 고정 2열 균일 그리드 → 장소 갤러리형 `columns` masonry + 6번째마다 전폭 와이드(`column-span: all`, 16:9). 썸네일 비율은 인덱스 패턴(3:4·4:3·4:5·1:1·5:4)이라 로드 후 높이 흔들림 없음. 정렬·필터·목록 데이터 순서 무변경, 화면 읽기만 열 방향.
- 브랜치 `cursor/festival-masonry-f535` tip `235dc7c9` · PR [#637](https://github.com/catgeot/Days/pull/637) · **병합 금지(사람 Preview 전)**.
- 검증: `npm run test:health` 934 pass · `npm run build` PASS. eslint set-state-in-effect 오류는 main 기존 건.
- 사람 체크: Preview `/korea`에서 불규칙 높이 흐름 · 6번째 와이드와 그 아래 컬럼 재개 · 와이드 안 세로 포스터 크기.
