# 2026-08-25 project log

이전: [`2026-08-24-project-log.md`](./2026-08-24-project-log.md)

## 영문 검색 SEO — 여행지 메타·써머리

- **문제**: `?lang=en` UI는 있으나 PlaceCard meta·써머리가 한글 `desc`·제네릭 탭 문구, place sitemap hreflang 없음
- **조치**: `placeSeoEnOverrides`(tier1+phuket+galapagos) · `placeSeoText` · Helmet keywords · index EN 크롤러 링크 · sitemap `/place/*` hreflang
- **VERIFY**: `npm run smoke:place-seo-en` · `npm run build` PASS
- **커밋**: `3cd50468` main (push는 사람 요청 시)

**사람 QA**: PROD 배포 후 `/?lang=en` · `/place/phuket/gallery?lang=en` · `/korea?lang=en` 페이지 소스에서 title/description/keywords·써머리 영문 확인
