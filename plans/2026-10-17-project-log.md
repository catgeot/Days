# 2026-10-17 프로젝트 일지

이전: [`2026-10-16-project-log.md`](./2026-10-16-project-log.md)

## 축제 허브 기본 기간

- draft [#486](https://github.com/catgeot/Days/pull/486) `305b6a53` · [#487](https://github.com/catgeot/Days/pull/487) `12359046` — `main`(#488) 병합. WebKit 390 전국·서울·강릉·제주 캡처 갱신. **병합 금지** (순서 #486 → #487).
- draft [#489](https://github.com/catgeot/Days/pull/489) `2f3471cf` — 플래그 on일 때 기본 목록은 서울 30일 창(오늘~+29). 기간 칩은 비선택이고 GATEO 추천 줄은 유지. 제목은 지역명만, 기간은 메타(`~11.15`, «한 달 이내»를 고르면 `까지`). 리스트·추천 썸네일은 디코드 전까지 시머. **#487 다음 병합**.
- **검증:** date-chip e2e 9 pass · health 단위 · CI `lint-and-build` · `e2e-youtube-session` 세 PR PASS.
- draft [#489](https://github.com/catgeot/Days/pull/489) `817e2733` — 플래그 on 기본 화면의 시간 대분류를 «기간»(en «Dates»). 칩을 고르면 그 라벨. 플래그 off는 «이번 달». `nationwide.png` 재캡처. CI PASS.
- draft [#489](https://github.com/catgeot/Days/pull/489) `3dcbeeb5` — `main` `10fe3267`(#486·#487 squash) 위로 병합. 제목과 같은 지역 접두는 메타에서 뺌(`~11.15 · 219건 · 시·도별`). WebKit 390 전국·서울·강릉·제주 재캡처.
- [#491](https://github.com/catgeot/Days/pull/491) `f9edabb1` → `main` `b8b54955`. 플래그 on 메타 줄은 모든 상태에서 `text-xs font-medium text-stone-700`. WebKit 390 전국·제주 기본. CI `lint-and-build` · `e2e-youtube-session` PASS.
- draft [#494](https://github.com/catgeot/Days/pull/494) `586c644a` — Cos 조건: TourAPI 목록 밖 맛집명 polish 제거·초대형 chip 프롬프트(festival_sights/access/nearby). `test:health` 436 pass · Edge 미배포.
- draft [#494](https://github.com/catgeot/Days/pull/494) `cbb0be7e` — 축제 MOONi 볼거리 장식·맛집 주차·맛집 목록 대기·가는 법 중복. 클라 polish + prompt mirror(Edge 미배포). `test:health` 434 pass.
