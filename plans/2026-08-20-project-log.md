# 2026-08-20 프로젝트 일지

직전: [`2026-08-19-project-log.md`](./2026-08-19-project-log.md)

## 영문화 #21, 플래너 배너·UI EN — Preview push

- **범위** `place.planner.banners` · timeline · flight/rental hint · 비자 링크 `labelEn` — RentalPickup · Trip.com · 12Go · Klook · GYG · MRT TNA · JourneyTimeline · FlightSearchCta · cinema notice
- **유틸** `getFlightDestinationSearchHint` · `getRentalCarHomeSearchSubtext` · `getFlightTripDisclaimer` — i18n 연동
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — 장소 카드 플래너 탭 배너·제휴 UI
- **다음** #22 플래너 AI 본문 EN (`essential_guide_en`)

## 영문화 #22, 플래너 AI 본문 EN — Preview push

- **DB** `place_toolkit.essential_guide_en` · en 없으면 ko 폴백
- **Edge** `update-place-toolkit` — `locale=en` EN 프롬프트·컬럼 분리 저장
- **클라** `getEssentialGuide`·PlannerTab·MOONi CTA locale 연동
- **VERIFY** `smoke:essential-guide-locale` · `smoke:place-label-slug` · `build` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — 플래너 탭 AI 본문(타임라인·카드 advice)
- **남은 일** Edge `update-place-toolkit` deploy(사람) · Preview QA

## 영문화 #22, Edge·DB 배포

- **Edge** `update-place-toolkit` — `phdjnbfitvmrguqzverm` · `--no-verify-jwt` 배포 완료
- **DB** migration `20260820120000_place_toolkit_essential_guide_en.sql` 적용 (`essential_guide_en`)
- **Preview QA** `/qa/en` · `?lang=en` — Planner → Run AI toolkit → EN 본문 저장·표시
