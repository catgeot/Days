# 2026-08-03 프로젝트 일지

직전: [`2026-08-02-project-log.md`](./2026-08-02-project-log.md)

## 푸터 법적 공지 #1, About·Terms·Privacy 정합

**상태**: feature `cursor/footer-legal-review-a8a5` · Preview QA 대기

- **리스크**: About「비상업적」·「Project Days」·약관「중개·판매 없음」이 실제 제휴 수수료·GATEO 브랜드·GA/Mapbox 수집과 불일치
- **변경**: `footerData.js` About/Terms/Privacy/Contact 개정 · LogoPanel 저작권 · `index.html` author · TripLinkModal「중개」표현 정리
- **브랜치**: `cursor/footer-legal-review-a8a5` · git Preview: `https://days-git-cursor-footer-legal-review-a8a5-catgeots-projects.vercel.app`
- **QA**: 로고 패널 → About Us / Terms / Privacy / Contact · 「비상업적」없음 · 제휴광고·수수료 고지 · GA/Mapbox/Supabase 명시
- **사람 확인 권장**: 사업자등록번호·대표자 실명 표기 여부(개인 운영이면 미기재 유지 OK) · Updates `notice` 릴리스 노트 넣을지

## 축제 페이지 #1, 시간 탭 실제 건수

**상태**: ✅ `main` 머지·푸시 `1cf2156` · PR [#48](https://github.com/catgeot/Days/pull/48) MERGED

- **이슈**: 지금·주말·이번 달·시즌이 모두 48건처럼 보임 (UI `PANEL_LIMIT` 상한 + 메타가 잘린 건수 표시)
- **변경**: 목록 상한 제거 · 메타·시간 칩에 실제 건수 · 리스트 시작일 순 · 지도 클러스터 leaf 1000
- **PROD**: `/korea` · 공유 `https://www.gateo.kr/qa/korea` (redirect는 main 배포 후)
