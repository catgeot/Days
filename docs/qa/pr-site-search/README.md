# Site search QA (VITE_GATEO_SITE_SEARCH=1)

Captured from `https://127.0.0.1:5173` · viewport **390px** clip (headless).

## Real-user path (PR #477) — home → explore search → place

| Region | Query | Browser | File | URL |
|--------|-------|---------|------|-----|
| 평창 (흥정계곡) | 흥정계곡 | Chromium | real-user-heungjeong-chromium-390.png | `/` (catalog pin; gallery must load) |
| 평창 (흥정계곡) | 흥정계곡 | WebKit | real-user-heungjeong-webkit-390.png | `/` |
| 강릉 | 경포대 | Chromium | real-user-gangneung-gyeongpodae-chromium-390.png | `/place/gyeongpodae` |
| 강릉 | 경포대 | WebKit | real-user-gangneung-gyeongpodae-webkit-390.png | `/place/gyeongpodae` |
| 제주 | 성산일출봉 | Chromium | real-user-jeju-seongsan-chromium-390.png | `/place/seongsan-ilchulbong` |
| 제주 | 성산일출봉 | WebKit | real-user-jeju-seongsan-webkit-390.png | `/place/seongsan-ilchulbong` |

Script: `node scripts/capture-site-search-real-user-477.mjs` (optional `ONLY_BROWSER=chromium|webkit`).

## Explore / AI-limit regression set

| Scenario | File | URL |
|----------|------|-----|
| 흥정계곡 suggestions · 평창 region | heungjeong-suggest-region-390.png | https://127.0.0.1:5173/explore |
| 흥정계곡 Enter | heungjeong-enter-390.png | https://127.0.0.1:5173/ |
| AI limit + /place/흥정계곡 link | ai-limit-links-390.png | https://127.0.0.1:5173/explore |
| Clicked /place/흥정계곡 | ai-limit-place-open-390.png | https://127.0.0.1:5173/place/%ED%9D%A5%EC%A0%95%EA%B3%84%EA%B3%A1 |
| 경포대 | gyeongpoda-390.png | https://127.0.0.1:5173/place/gyeongpodae |
| 성산일출봉 | seongsan-ilchulbong-390.png | https://127.0.0.1:5173/place/seongsan-ilchulbong |
| 평창 Enter | pyeongchang-county-390.png | https://127.0.0.1:5173/explore |

Script: `node scripts/capture-site-search-qa-docs.mjs`
