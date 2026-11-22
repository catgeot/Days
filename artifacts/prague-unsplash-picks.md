# 프라하 허브 명소 7곳 — Unsplash 선정 대조표

SSOT: `src/pages/Home/data/cityAttractionHubs.json` (`hubId: prague`). 탐색 카드는 `resolveExploreSearchCardThumbUrl`로 명시 `thumbnail`만 통과, SEO pool·전역 OG는 차단.

**slug↔CDN·작가 확인 방법(한 줄):** Unsplash 사진 페이지를 Playwright로 열어 `__NEXT_DATA__.props.pageProps.photo.urls.regular`의 pathname이 SSOT `thumbnail`과 동일한 `photo-…`인지 대조하고, 같은 객체의 `user.name`·`user.username`으로 크레딧을 맞춘 뒤, `scripts/health/prague-hub-unsplash-bindings.mjs` 표와 SSOT JSON을 `explore-overseas-hub-search-thumb.test.mjs`가 검증하며, 썸네일 있는 6곳은 `images.unsplash.com` GET(800px) 저장본으로 화면 내용을 재검수한다.

| 명소 (ko) | page slug | CDN `photo-…` | 작가 (@) | 선정 근거(실물 검수) | 탈락·교체 요약 |
|-----------|-----------|---------------|----------|----------------------|----------------|
| 프라하성 | — | **(없음 · 아이콘)** | — | 성·비투스 대성당 **외관이 주제인 확실한 사진 없음**. FRGiwPEH2Cs는 토스카나 궁전·마리아 기둥 광장(성 단독 아님) → 제거 | 82RJm8VETb8(내부 유리)·FRGiwPEH2Cs(궁전 광장) 모두 불합격 |
| 카를교 | 4AL1OnvWAng | 1719683187673-92559a5c0ab9 | Joshua Kettle (@joshuakettle) | 새벽 카를교 **조각상·연석**과 말라 스트라나 쪽 가로등·첨탑 실루엣 | 유지 |
| 구시가 광장 | fO6a6npF4mg | 1749219346498-2e47d7c50e06 | Sergey Leont'ev (@addictfuji) | **틴 교회** 쌍첨탑이 지붕 위로 올라온 구시가 전망 | 유지 |
| 천문시계 | uHI5ToXVvwo | 1747466403454-d0518287e433 | Sinisa Lekovic (@sinisalekovic) | 구시청사 탑·**오를로이(천문시계)** 원판과 첨탑이 한 프레임 | 유지 |
| 레논 벽 | 0m-Vj_0yFwE | 1573929491484-c151f78d50e5 | Dariusz Sankowski (@dariuszsankowski) | 레논 초상·`ALL YOU NEED IS LÁSKA` 등 **말라 스트라나 그래피티 벽** | 유지 |
| 페트르진 언덕 | rjqrQNWZmNo | 1670784489742-5a8f40a8eda3 | Mattia Spotti (@pockmini) | **컬러** 철골 전망탑+숲 (페이지 제목 Eiffel 오탈자, 실물은 페트르진) | **검수 통과** |
| 요세포프 | USeZeayN_6M | 1761953443006-bad3b9eca39e | Emir Kutluay (@emirkutluay) | **다윗의 별**·회당 지붕·뾰족 창문 — 유대인 지구 회당 외부 | 유지 |

**아이콘(미선정):** 프라하성 — `thumbnail`·`thumbnailCredit` 없음 (`PRAGUE_ICON_ONLY_ATTRACTIONS`).

**자동 검증:** `node --import ./scripts/register-src-esm.mjs --test scripts/health/explore-overseas-hub-search-thumb.test.mjs` · mock 390 Chromium: `node --import ./scripts/register-src-esm.mjs scripts/capture-explore-prague-search-thumb-mock.mjs --only-390-chromium`.

**수동 실물 검수 샘플:** `artifacts/prague-verify/*.jpg` (프라하성 제외 6장).