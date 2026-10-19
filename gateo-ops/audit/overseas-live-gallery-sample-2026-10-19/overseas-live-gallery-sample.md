# Overseas live TourAPI gallery sample (main legacy gate vs branch)

Generated: 2026-10-19T12:26:54.208Z
Overseas spots in list: **271**
Main (legacy) would enable TourAPI despite explicit overseas: **269**
(Hangul name heuristic on places that already have non-Korea country or coords)

## Venice identification

- SSOT name: **베니스** (Hangul display name triggers legacy main gate)
- country: **이탈리아 / Italy** → `hasExplicitNonKoreaCountry` = true
- coords: **45.4408,12.3155** → outside Korea bbox → `isExplicitlyOverseasForTourApi` = true
- Branch gate TourAPI: **false** · Main legacy: **true**

## Gate policy (branch / CEO P1)

Block TourAPI only when **explicitly overseas** (non-Korea country or coords outside peninsula).
Missing country/coords → **not** blocked (domestic curated hubs keep TourAPI).

## 10-place live credit sample (PROD main vs local fix, search path)

| slug | continent | main gate | branch gate | prod credit (KTO?) | local credit (KTO?) |
|------|-----------|-----------|-------------|---------------------|---------------------|
| cairo | africa | true | false | yes — 사진: 한국관광공사 | no — Unsplash · Pexels · 30초에 한 번 |
| venice | europe | true | false | yes — 사진: 한국관광공사 | no — Unsplash · Pexels · 30초에 한 번 |
| paris | europe | true | false | no — Unsplash · Pexels · 30초에 한 번 | no — Unsplash · Pexels · 30초에 한 번 |
| london | europe | true | false | no — Unsplash · Pexels · 30초에 한 번 | no — Unsplash · Pexels · 30초에 한 번 |
| dubai | middle-east | true | false | yes — 사진: 한국관광공사 | no — Unsplash · Pexels · 30초에 한 번 |
| bangkok | asia | true | false | no — Unsplash · Pexels · 30초에 한 번 | no — Unsplash · Pexels · 30초에 한 번 |
| tokyo | asia | true | false | no — Unsplash · Pexels · 30초에 한 번 | no — Unsplash · Pexels · 30초에 한 번 |
| sydney | oceania | true | false | no — Unsplash · Pexels · 30초에 한 번 | no — Unsplash · Pexels · 30초에 한 번 |
| rio-de-janeiro | south-america | true | false | no — Unsplash · 30초에 한 번 | no — Unsplash · 30초에 한 번 |
| new-york | north-america | true | false | no — Unsplash · 30초에 한 번 | no — Unsplash · 30초에 한 번 |

**PROD live TourAPI/KTO today (this sample):** cairo, venice, dubai

