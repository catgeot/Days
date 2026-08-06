# 2026-08-06 프로젝트 일지

직전: [`2026-08-03-project-log.md`](./2026-08-03-project-log.md)

## 축제 페이지 #3, 사진 스와이프·홈 줌 리셋

**상태**: feature `cursor/korea-photo-swipe-7d94` · PR [#61](https://github.com/catgeot/Days/pull/61) · tip `1b9e1889` · Preview QA 대기 (사람 확인 후 main 반영)

- **요청**: 축제 본문 사진 쓸어 넘기기 · 사진 확대 후 홈 진입 시 지구본이 확대된 채로 남는 문제
- **변경**: `FestivalDetailSheet` 본문·확대보기 가로 스와이프 · 확대보기는 CSS 핀치(페이지 줌 아님) · 닫기/`홈으로`/`/korea` unmount 시 `resetIosZoomAfterInput` + `gateo_reset_viewport`
- **공유**: `https://www.gateo.kr/qa/korea` · git Preview `https://days-git-cursor-korea-photo-swipe-7d94-catgeots-projects.vercel.app/korea`
- **QA**: 로컬에서 본문·라이트박스 TouchEvent 스와이프·화살표·홈 복귀 확인. 사람: Preview에서 실기기 핀치 후 홈 배율 확인

다음 채팅명:

```
축제 페이지 #4, Preview QA 반영
```
