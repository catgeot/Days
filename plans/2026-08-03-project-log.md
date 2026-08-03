# 2026-08-03 프로젝트 일지

직전: [`2026-08-02-project-log.md`](./2026-08-02-project-log.md)

## 푸터 법적 공지 #2, Privacy·제휴라벨

**상태**: ⏳ PR [#51](https://github.com/catgeot/Days/pull/51) · `99a4a90` · feature `cursor/footer-legal-edfa`

- Privacy: 「서비스 내 계정 삭제 기능」→ 이메일(`admin@gateo.kr`) 요청으로 정정
- UI: 사용자 노출 「제휴링크」·툴킷 Sponsored 뱃지 → 「제휴광고」 통일 (GYG/MRT 등 파트너 브랜드·Sponsored 병기는 약관 「또는 제휴사 브랜드」로 유지)
- **Preview 장애**: 긴 브랜치 git 호스트 첫 라벨 69자(DNS 상한 63) → `ERR_NAME_RESOLUTION_FAILED` → `cursor/footer-legal-edfa`로 이전 · 구 PR #50·긴 브랜치 삭제
- Preview: `https://days-git-cursor-footer-legal-edfa-catgeots-projects.vercel.app` (DNS·Vercel SUCCESS)
- QA: Privacy · 플래너 제휴광고 뱃지

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
