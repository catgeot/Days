# 2026-08-03 프로젝트 일지

직전: [`2026-08-02-project-log.md`](./2026-08-02-project-log.md)

## 축제 페이지 #2, 칩 아이콘 통일

**상태**: feature `cursor/korea-time-list-16a3` · SHA `7eb5dbf9` · Preview QA 대기

- **요청**: 시간·지역·테마 대분류와 하위 칩이 같은 아이콘으로 종속 관계가 보이게
- **변경**: `CalendarDays` / `MapPin` / `Sparkles` — 대분류·하위(전국·테마 전체 포함) 동일 아이콘
- **검증**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea` · git Preview `https://days-git-cursor-korea-time-list-16a3-catgeots-projects.vercel.app/korea`
- **QA**: `/korea` — 시간 대분류·지금/주말/이번 달 달력 아이콘 · 지역 핀 · 테마 스파클

## 지구본 나라 목록 #6, 이스라엘 하이라이트 fill

**상태**: feature `cursor/globe-neighbor-list-15b3` · PR [#55](https://github.com/catgeot/Days/pull/55) · SHA `25c8092` · Preview QA 대기

- **이슈**: 중동 편입 후 이스라엘 선택 시 노란 외곽만 크고 보라 fill이 비어 보임
- **원인**: 나라 하이라이트 halo가 분쟁 admin선까지 포함 · 소권역 바(모바일·PC) 중복 sync가 동일 id로 `clearRegionFocus`
- **변경**: halo/solid = 비분쟁만 · 분쟁은 dashed 유지 · 동일 소권역 재선택 시 clear 스킵
- **검증**: `npm run smoke:globe-face-neighbor-order` · `smoke:place-label-slug` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/globe` · git Preview `https://days-git-cursor-globe-neighbor-list-15b3-catgeots-projects.vercel.app/`
- **QA**: 홈→휴양→중동→이스라엘 — 보라 fill이 국경 안에 채워지는지(요르단과 비교)

## 지구본 나라 목록 #5, 중동 이스라엘·요르단

**상태**: feature `cursor/globe-neighbor-list-15b3` · PR [#55](https://github.com/catgeot/Days/pull/55) · SHA `b918094` · Preview QA 대기

- **이슈**: 중동 리스트에 이스라엘 없음 — `il`/`jo`가 아프리카「북아프리카·레반트」에 있었음
- **변경**: 아시아 면·중동 소권역으로 이동 · 북아프리카 라벨에서 「레반트」 제거
- **검증**: `npm run smoke:globe-face-neighbor-order` · `smoke:place-label-slug` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/globe` · git Preview `https://days-git-cursor-globe-neighbor-list-15b3-catgeots-projects.vercel.app/`
- **QA**: 홈→도시(아시아)→중동에 이스라엘·요르단 · 아프리카→북아프리카에 없음

## 지구본 나라 목록 #4, 중분류 좌우 스크롤

**상태**: ✅ `main` 머지 · PR [#54](https://github.com/catgeot/Days/pull/54)

- **이슈**: 중분류 좌우 스크롤 불가 → 이어 좌측 ~1/2 폭에 치우침
- **변경**: 스크롤포트 `min-w-0` 복구 · 중분류 바만 `100vw` 거의 전체 폭(나라·카테고리는 좌측 유지)
- **검증**: `npm run smoke:globe-face-neighbor-order` · `smoke:place-label-slug` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/globe` · git Preview `https://days-git-cursor-globe-neighbor-list-15b3-catgeots-projects.vercel.app/`
- **QA**: 홈(모바일)→도시→중분류 바가 화면 가로로 넓고, 좌우로 「소국·공국」까지 스크롤되는지

## 지구본 나라 목록 #3, 중분류·소국 재편

**상태**: ✅ `main` 머지 · PR [#53](https://github.com/catgeot/Days/pull/53)

- **이슈**: 인접국 연쇄만으로는 소국·공국이 본토 흐름 중간에 끼고, 「서·남유럽」 등 큰 중분류가 직관을 해침
- **변경**: `GLOBE_FACE_SUBREGIONS` — 유럽을 서/영국/남/북/중부/발칸·동/소국·공국/북극으로 분할 · 아시아는 동남아·남아시아·중동·중앙아시아 · 아프리카는 동·남·인도양·북·서·중부
- **유지**: 5대면(대분류) · 중분류 안 nearest-neighbor 연쇄 · 면 배타
- **검증**: `npm run smoke:globe-face-neighbor-order` · `smoke:place-label-slug` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/globe` · git Preview `…-git-cursor-globe-neighbor-list-15b3-….vercel.app/`
- **QA**: 홈→도시→「소국·공국」·「서유럽」 칩 · 아시아·아프리카 중분류 라벨·나열 흐름

## 푸터 법적 공지 #3, 아동 개인정보 문구

**상태**: ✅ `main` 머지·푸시 `a823292` · PR [#52](https://github.com/catgeot/Days/pull/52) MERGED · PROD 배포 SUCCESS

- Privacy §8: 14세는 **콘텐츠 금지**가 아니라 **회원 개인정보·보호자 동의**(개인정보보호법) 이슈로 구분
- 공개 여행 정보 열람은 나이 제한 없음 · 만 14세 미만 계정 개인정보는 보호자 동의 필요·현재 동의 UI 없음·확인/요청 시 이메일 삭제
- **PROD**: https://www.gateo.kr — 로고 패널 → Privacy → 「8. 아동의 개인정보」

## 푸터 법적 공지 #2, Privacy·제휴라벨

**상태**: ✅ `main` 머지·푸시 `719d868` · PR [#51](https://github.com/catgeot/Days/pull/51) MERGED · PROD 배포 SUCCESS

- Privacy: 「서비스 내 계정 삭제 기능」→ 이메일(`admin@gateo.kr`) 요청으로 정정
- UI: 사용자 노출 「제휴링크」·툴킷 Sponsored 뱃지 → 「제휴광고」 통일 (GYG/MRT 등 파트너 브랜드·Sponsored 병기는 약관 「또는 제휴사 브랜드」로 유지)
- Preview 장애 해결: 긴 브랜치 DNS 라벨 초과 → `cursor/footer-legal-edfa` · 구 PR #50 폐기
- **PROD**: https://www.gateo.kr — 로고 패널 → Privacy / 플래너 제휴광고 뱃지

## 푸터 법적 공지 #1, About·Terms·Privacy 정합

**상태**: ✅ `main` 머지·푸시 `c305b8a` · PR [#49](https://github.com/catgeot/Days/pull/49)

- **리스크**: About「비상업적」·「Project Days」·약관「중개·판매 없음」이 실제 제휴 수수료·GATEO 브랜드·GA/Mapbox 수집과 불일치
- **변경**: `footerData.js` About/Terms/Privacy/Contact 개정 · LogoPanel 저작권 · `index.html` author · TripLinkModal「중개」표현 정리
- **PROD**: https://www.gateo.kr — 로고 패널 → About Us / Terms / Privacy
- **사람 후속(선택)**: 사업자등록번호·대표자 실명 표기 · Updates `notice` 릴리스 노트

## 축제 페이지 #1, 시간 탭 실제 건수

**상태**: ✅ `main` 머지·푸시 `1cf2156` · PR [#48](https://github.com/catgeot/Days/pull/48) MERGED

- **이슈**: 지금·주말·이번 달·시즌이 모두 48건처럼 보임 (UI `PANEL_LIMIT` 상한 + 메타가 잘린 건수 표시)
- **변경**: 목록 상한 제거 · 메타·시간 칩에 실제 건수 · 리스트 시작일 순 · 지도 클러스터 leaf 1000
- **PROD**: `/korea` · 공유 `https://www.gateo.kr/qa/korea` (redirect는 main 배포 후)
