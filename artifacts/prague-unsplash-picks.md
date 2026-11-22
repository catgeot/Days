# 프라하 허브 명소 7곳 — Unsplash 선정 대조표

SSOT: `src/pages/Home/data/cityAttractionHubs.json` (`hubId: prague`). 탐색 카드는 `resolveExploreSearchCardThumbUrl`로 명시 `thumbnail`만 통과, SEO pool·전역 OG는 차단.

**slug↔CDN·작가 확인 방법(한 줄):** Unsplash 사진 페이지를 Playwright로 열어 `__NEXT_DATA__.props.pageProps.photo.urls.regular`의 pathname이 SSOT `thumbnail`과 동일한 `photo-…`인지 대조하고, 같은 객체의 `user.name`·`user.username`으로 크레딧을 맞춘 뒤, `scripts/health/prague-hub-unsplash-bindings.mjs` 표와 SSOT JSON을 `explore-overseas-hub-search-thumb.test.mjs`가 검증하며, 현물은 `images.unsplash.com` GET(800px) 저장본(`artifacts/prague-verify/*.jpg`)으로 화면 내용을 재검수한다.

| 명소 (ko) | page slug | CDN `photo-…` | 작가 (@) | 선정 근거(실물 검수) | 탈락·교체 요약 |
|-----------|-----------|---------------|----------|----------------------|----------------|
| 프라하성 | FRGiwPEH2Cs | 1667853354961-2bd9ae437016 | Eugenia Pan'kiv (@eugeniya_now) | 흐라드차니 광장·궁전 안마당 **외부**: 붉은 지붕·회색 석재 파사드·광장 분수, 성궁 단지 건물이 화면 중심(대성당 내부 성가유리 아님) | **교체:** 82RJm8VETb8/1558370037… — 성가유리·성당 내부 클로즈업이었음 |
| 카를교 | 4AL1OnvWAng | 1719683187673-92559a5c0ab9 | Joshua Kettle (@joshuakettle) | 새벽 카를교 **조각상·연석**과 말라 스트라나 쪽 가로등·첨탑 실루엣 | 유지 |
| 구시가 광장 | fO6a6npF4mg | 1749219346498-2e47d7c50e06 | Sergey Leont'ev (@addictfuji) | **틴 교회** 쌍첨탑이 지붕 위로 올라온 구시가 전망 | 유지 |
| 천문시계 | uHI5ToXVvwo | 1747466403454-d0518287e433 | Sinisa Lekovic (@sinisalekovic) | 구시청사 탑·**오를로이(천문시계)** 원판과 첨탑이 한 프레임 | 유지 |
| 레논 벽 | 0m-Vj_0yFwE | 1573929491484-c151f78d50e5 | Dariusz Sankowski (@dariuszsankowski) | 레논 초상·`ALL YOU NEED IS LÁSKA` 등 **말라 스트라나 그래피티 벽** | 유지 |
| 페트르진 언덕 | rjqrQNWZmNo | 1670784489742-5a8f40a8eda3 | Mattia Spotti (@pockmini) | **컬러** 철골 전망탑이 숲과 함께 보임(에펠 단독 흑백 로우앵글 아님). ※페이지 제목은 오탈자(Eiffel)이나 실물은 페트르진 탑 | **교체:** hW0qD1O0y08/1629514774841… — 흑백·탑 상부만 올려다본 에펠 유사 샷 |
| 요세포프 | USeZeayN_6M | 1761953443006-bad3b9eca39e | Emir Kutluay (@emirkutluay) | **다윗의 별**·회당 지붕·뾰족 창문 — 유대인 지구 회당 외부 디테일 | 유지 |

**미선정(아이콘):** 7곳 모두 SSOT에 `thumbnail` 있음.

**자동 검증:** `node --import ./scripts/register-src-esm.mjs --test scripts/health/explore-overseas-hub-search-thumb.test.mjs` · mock `node --import ./scripts/register-src-esm.mjs scripts/capture-explore-prague-search-thumb-mock.mjs`.

**수동 실물 검수 샘플:** `/opt/cursor/artifacts/prague-verify/*.jpg` (동일 바이너리를 `artifacts/prague-verify/`에 복사해 두면 CI 외에서도 재확인 가능).