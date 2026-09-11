# 2026-09-11 프로젝트 일지

직전: [`2026-09-10-project-log.md`](./2026-09-10-project-log.md)

## 명승 숙소 #1 — 명소 본문 숙소 섹션 (Cloud)

- **세션** `명승 숙소 #1, 본문 숙소 섹션`
- **브랜치** `cursor/scenic-stay-692c` · tip `31c92c70` · PR [#214](https://github.com/catgeot/Days/pull/214) (OPEN)
- **완료**: 명승 홈에서 숙소를 보려면 지구본 장소 카드를 열어야 했던 흐름을, 축제 `FestivalStayStrip`과 같은 `EventStayStrip`으로 명소 본문(`ThemeSpotDetailModal`)에 넣음. 행사 프리셋 없이 MRT 기본 일정(+14일·3박). 맛집·레포츠·문화 중첩 모달에는 숨김.
- **VERIFY** `smoke:korea-scenic-stay` PASS · `smoke:korea-festival-stay-url` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/scenic-stay → `/korea/theme/scenic?spot=gyeongbokgung`
- **다음** 사람 Preview QA — 본문 숙소 카드·일정·MRT 목록

```
명승 숙소 #2, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
브랜치 cursor/scenic-stay-692c · PR #214 · Preview /qa/scenic-stay
금지: UI 리디자인 · 축제 시트 리팩터 · feature에 plans/** 커밋
작업: /korea/theme/scenic?spot=gyeongbokgung 본문에 축제와 같은 숙소 카드·일정·MRT 목록이 있는지
```

## 팔경 활용 #8 — 빙계팔경 경승별 사진 다양화 (Cloud)

- **세션** `팔경 활용 #8, 빙계 팔경 사진 다양화`
- **브랜치** `cursor/palgyeong-use-e744` · tip `b0f0766e` · PR [#212](https://github.com/catgeot/Days/pull/212) (OPEN)
- **완료**: 빙계팔경 7행이 같은 VisitKorea 계곡 항공 사진(`3542362`)을 쓰던 문제를 고침. 의성군 문화관광(빙혈 입구·절벽 계류·인암 각자·출렁다리·석탑 단풍)과 TourAPI 빙계계곡·빙계서원 갤러리로 8행 썸네일·본문 갤러리를 경승마다 다르게 연결. JSON contentId는 채우지 않음.
- **VERIFY** `smoke:korea-local-scenic-lists` PASS (썸네일 8장 서로 다름 · 갤러리 URL 중복 없음) · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=uiseong`
- **다음** 사람 Preview QA — 8행 썸네일·본문 갤러리가 경승에 맞는지

```
팔경 활용 #9, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #212 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic?hub=uiseong 빙계팔경 8행 썸네일이 서로 다른지 · 행을 열어 본문 갤러리가 경승(빙혈 입구·절벽·바위·서원·다리·석탑·봉우리·용소)에 맞는지
```

## 팔경 활용 #9 — Preview QA 후 PR #212 merge

- 사람 Preview QA 후 PR [#212](https://github.com/catgeot/Days/pull/212) squash merge `25ea5579`
- 피드백: 8행 부제가 모두 「의성 팔경」이라 번호가 필요 → #10

## 팔경 활용 #10 — 팔경 행 부제 번호 (Cloud)

- **세션** `팔경 활용 #10, 팔경 번호`
- **브랜치** `cursor/palgyeong-use-e744` · tip `6e3c4f4b` · PR [#213](https://github.com/catgeot/Days/pull/213) (OPEN)
- **완료**: 멤버 행 부제를 `의성 1경`~`의성 8경`으로 붙임. 그룹 칩은 `의성 팔경` 유지. JSON contentId 없음.
- **VERIFY** `smoke:korea-local-scenic-lists` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=uiseong`
- **다음** 사람 Preview QA — 행 부제 번호 · 그룹 칩 유지

```
팔경 활용 #11, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #213 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic?hub=uiseong 8행 부제가 의성 1경~8경으로 서로 다른지 · 그룹 칩이 의성 팔경인지
```
