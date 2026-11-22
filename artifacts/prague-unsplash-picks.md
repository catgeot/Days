# 프라하 허브 명소 7곳 — Unsplash 선정 대조표

SSOT: `src/pages/Home/data/cityAttractionHubs.json` (`hubId: prague`). 탐색 카드는 `resolveExploreSearchCardThumbUrl`로 명시 `thumbnail`만 통과, SEO pool·전역 OG는 차단.

| 명소 (ko) | name_en | Unsplash 사진 페이지 | 작가 | CDN thumbnail (`images.unsplash.com`) | 선정 근거 | 탈락 후보 요약 |
|-----------|---------|----------------------|------|----------------------------------------|-----------|----------------|
| 프라하성 | Prague Castle | https://unsplash.com/photos/82RJm8VETb8 | Polina Podlesnaya | `photo-1558370037-9fe7f8e589f1` | 설명·위치에 Prague Castle / St. Vitus Cathedral 명시, 성 외관이 프레임 중심 | 성 없는 붉은 지붕 일반 시티뷰(QxWaATN9P5w)는 성 단독 샷이 아니어서 보류 |
| 카를교 | Charles Bridge | https://unsplash.com/photos/4AL1OnvWAng | Joshua Kettle | `photo-1719683187673-92559a5c0ab9` | «the famous Charles Bridge at dawn», Prague · 조각상·다리 타워 가시 | 강 건너 성+다리 원경(mf_VRQTNycc)은 교 단독 앵커로는 모호해 보류 |
| 구시가 광장 | Old Town Square | https://unsplash.com/photos/fO6a6npF4mg | Sergey Leont'ev | `photo-1749219346498-2e47d7c50e06` | 태그 old town square, Tyngothic towers over square | 시계 클로즈업만 있는 uHI5ToXVvwo는 광장 전경 대신 천문시계에 배정 |
| 천문시계 | Astronomical Clock | https://unsplash.com/photos/uHI5ToXVvwo | Sinisa Lekovic | `photo-1747466403454-d0518287e433` | 제목·태그 prague astronomical clock, Orloj 타워 | 야간 일반 시계탑(Jms1rfh56CI)은 오를로지 특정 불명 |
| 레논 벽 | John Lennon Wall | https://unsplash.com/photos/0m-Vj_0yFwE | Dariusz Sankowski | `photo-1573929491484-c151f78d50e5` | 위치 John Lennon Wall, Malá Strana, Prague 1 | 제목만 graffiti·Prague 미기재(E1UQ32yIds0), 홍콩 Lennon 터널(Ip2t2sHL8E4) |
| 페트르진 언덕 | Petřín Hill | https://unsplash.com/photos/hW0qD1O0y08 | Thomas Peham | `photo-1629514774841-ee1fe98203ee` | Petřín Lookout Tower 정면, Prague | 도시 전경만 있고 탑 미표시 스카이라인 샷 다수 |
| 요세포프 | Josefov | https://unsplash.com/photos/USeZeayN_6M | Emir Kutluay | `photo-1761953443006-bad3b9eca39e` | Synagogue, Star of David, Prague Jewish Quarter 건물 디테일 | Pinkas 내부 등 특정 회당 불명확 시 synagogue 일반 외관만 확정 |

**미선정(아이콘)**: 이번 7곳 모두 위 표로 채움. 확신 없을 때는 `thumbnail` 비움 → 카드 아이콘.

**검증**: `node --import ./scripts/register-src-esm.mjs --test scripts/health/explore-overseas-hub-search-thumb.test.mjs` · mock 캡처 `scripts/capture-explore-prague-search-thumb-mock.mjs`.