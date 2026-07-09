# 2026-07-09 프로젝트 일지

**직전**: [`2026-07-07-project-log.md`](./2026-07-07-project-log.md)

---

## 플래너·위키 스마트 링크 → 제휴 홈

**상태**: **✅ QA 통과 (2026-07-09)**

### 내용

- AI `[@브랜드@]` / `한글('English')` 스마트 링크가 제휴 브랜드면 Google 검색 대신 **제휴 홈**으로 연결
- 미매칭(명소·식당 등)은 기존 Google 검색 유지
- 적용: 플래너 `ToolkitCard` · 위키 `PlaceWikiDetailsView` (공통 `CopyableText`)

### 구현

| 파일 | 역할 |
|------|------|
| [`affiliateBrandMatch.js`](../src/utils/affiliateBrandMatch.js) | 별칭 정확 매칭 · `클룩(Klook)` 괄호 병기 분해 |
| [`affiliate.js`](../src/utils/affiliate.js) | Bounce/BikesBooking/GYG/Airalo/Holafly/Trip/Klook 홈 SSOT |
| [`CopyableText.jsx`](../src/components/PlaceCard/common/CopyableText.jsx) | 제휴 홈 우선 · tooltip 분기 |

### 매칭 파트너

Klook · Trip.com · 12Go · Direct Ferries · Airalo · Holafly · Tiqets · GetYourGuide · Bounce · BikesBooking · MyRealTrip  
(Agoda/Booking/GYG short-link 비활성 제외 — GYG는 `partner_id` 직접 홈)

### QA

- [x] `[@Klook@]` · `클룩(Klook)` → 클룩 제휴 홈
- [x] Airalo / Holafly / GetYourGuide → 제휴 홈
- [x] 일반 명소명 → Google 검색 유지

---

## 위키 탭 → 「여행 스케치」(URL `/wiki` 유지)

**상태**: ✅ 구현·문서·커밋 (2026-07-09)

- UI·SEO 표시명만 「여행 스케치」로 교체 (`WIKI` 키·사이트맵 `/wiki` 유지)
- 위키 포토 **클릭 확대(라이트박스)** 를 갤러리 탭 개별 사진 UI와 동일 톤으로 맞춤 (그리드는 기존 비정형 aspectRatio 유지)
- 릴리스 노트 `2026-07-09-2` 반영
- 대상: `PlaceMobileSecondaryNav` · `PlaceChatPanel` · `PlaceCard/index` TAB_METADATA · `SEO` · `PlaceWikiDetailsView`

---

## 여행 스케치 Mapbox → Wikidata 로케이터 지도

**상태**: ✅ P242 1차 커밋 · QA 후 Static 교체로 전환 (아래)

- 요약 아래 `PlaceMiniMap`(Mapbox GL) 제거 → Wikidata **P242** 정적 이미지(1차)
- **QA 피드백**: “어디인지” 안 읽힘 → **Mapbox Static Images**로 교체

---

## 여행 스케치 Mapbox Static 지도

**상태**: ✅ QA 통과 · 커밋·푸시

- [`placeStaticMap.js`](../src/utils/placeStaticMap.js) — `lat/lng` → Static URL · outdoors-v12 · zoom 4.75 · 1200×800@2x · amber 핀
- [`PlaceWikiLocatorMap.jsx`](../src/components/PlaceCard/common/PlaceWikiLocatorMap.jsx) — 매거진 풀폭 Static · 하단 캡션 · 탭 시 **전체화면 GL**(확대·이동) · 확대 시 Mapbox 기본 attribution만
- `wikiLocatorMap.js` **삭제** (P242 폴백 없음) · 홈 지구본 무변경
- 복구: Static `onError`/탭 복귀 시 블록 유지 · [`useWikiData.js`](../src/components/PlaceCard/hooks/useWikiData.js) 같은 placeKey면 wiki 비우지 않음(깜박임 수정)
- Credits: Static 반영 ([`mapboxAttribution.js`](../src/data/mapboxAttribution.js)) · explorer CSS [`index.css`](../src/index.css)

**releaseNotes**: ✅ `2026-07-09-3` 반영 (`releaseNotes.js`)

---

## Cursor 설정 · 로컬 스모크

- User Rule: Thinking/diff 항상 펼침 설정이 생기면 즉시 켜기 · Git Bash 선호
- Cursor `settings.json`: 기본 터미널 **Git Bash** (+ `automationProfile`) — Agent는 Windows에서 PS 강제 가능(알려진 제한)
- `smoke:health` 로컬 실패 원인: Vite **HTTPS(basic-ssl)** 인데 `http://localhost:5173` 호출 → self-signed TLS 거부
- 수정: `scripts/smoke-health.mjs` 로컬 HTTPS 허용·HTTP→HTTPS 폴백 · `npm run smoke:health:local`

## Windows Agent git commit (2026-07-09)

- **증상**: Agent Shell이 PS라 bash HEREDOC·`bash -lc`·메시지 내 `<…>`가 실패할 수 있음 (커밋 자체 손상 아님 — 재시도로 성공).
- **검증**: `418059f` 한글 제목·본문 OK · working tree clean.
- **SSOT**: `.ai-context` 3절 「Windows Agent `git commit`」— UTF-8 메시지 파일 권장.
- **추가**: 메시지 제목에 리터럴 `git commit -F` 쓰면 Cursor trailer 주입과 섞임 → 제목은 「UTF-8 커밋 메시지 파일」처럼 우회 표현.

---

## 탐색「섬여행」가상 테마

**상태**: ✅ 구현·문서·커밋 (2026-07-09)

- 탐색 테마 탭에 **섬여행** 추가 (`/explore/island`) — `primaryCategory` 재분류 없음
- SSOT: [`islandExploreSpots.js`](../src/pages/Home/lib/islandExploreSpots.js) slug allowlist · `isIslandExploreSpot`
- 필터·대륙×섬 교차필터 · 에디터스 픽 **상단** 「섬으로 떠나는 여행」(숨겨진 섬 위주) · SEO 히든 링크
- **아이투타키(`aitutaki`)** 기본 여행지 승격 · AIT/RAR · `audit:airports` none:0
- **releaseNotes**: `2026-07-09-4` 반영

---

## 마이리얼트립 패키지 연동 (핸드오프 · MVP 합의)

**상태**: 📋 설계·합의 완료 · **구현은 다음 세션**

### 조사 요약 (유지)

- 트립링크 `TRIPLINK_PACKAGES_ENABLED=false` · 모달/iframe **재사용 안 함** (사이트·관리 불가 · 규격 억지 맞춤 폐기).
- 홈 단축 `https://myrealt.rip/dUxR7d` (`mylink_id=2282829` → `/pkc`) 정상.
- 공식 파트너 API: 항공·숙소·TNA·마이링크만. **`/pkc` 패키지 목록·검색 API 없음**.
- 패키지 운영 패턴(힌트): `www.myrealtrip.com/pkc/search?q={키워드}` → 제휴 포털 마이링크 → `myrealt.rip/…`.
- Edge `mrt-link-generator` 깨짐(옛 API) · secret은 로컬 검증 실키로 재설정 필요 · `VITE_` 키 브라우저 금지.
- 숙소는 추후 `region-autocomplete`→`regionId`→search + 칩(플래너 1차·지구본 2차). **이번 MVP 범위 밖**.

### MVP (다음 세션 구현)

탐색 **에디터스 픽** 테마 subtitle 패키지 문구 → MRT 단축 **새 탭**. 트립링크 카드/모달 on 하지 않음.

| 섹션 | CTA | shortUrl |
|------|-----|----------|
| 가족(아시아 단거리) | 동남아 | `https://myrealt.rip/dVDy3a` |
| **일본 (신규 섹션)** | 일본 특가 | `https://myrealt.rip/dVEgd5` |
| 유럽 & 장거리 | 유럽 | `https://myrealt.rip/dVE182` |
| 휴양(에어텔) | 동남아 | `https://myrealt.rip/dVDy3a` |

SSOT 보관만: 지방 출발 `dVEE92`, 홈쇼핑 `dVEo96`.

**구현 포인트**

1. `src/pages/Home/data/mrtPackageThemeLinks.js` — shortUrl SSOT + 테마 매핑.
2. `CurationSection.jsx` — `packageLinkUrl`, 실제 subtitle과 키워드 정합, `scrollToAd`/트립링크 스크롤 제거 → `window.open`.
3. `SearchDiscoveryModal.jsx` — `japanTargets`·일본 `CurationSection` (가족 다음·유럽 앞). 가족 `familyTargets`에서 일본 도시 분리 권장. `promotedPackages` 트립링크 미전달.
4. 금지: `travelSpots.js` 전체 스캔 · spots JSON 직접 수정 · `VITE_` MRT 키 · TripLinkModal 재사용.

**후속(별 세션)**: Edge mylink 공식화 · 숙소 region 칩 · TNA 상품 프록시.

**제시어**: 아래 「다음 세션 제시어」 절.

---

## 다음 세션 제시어

```
@.ai-context.md @plans/2026-07-09-project-log.md
MRT 패키지 MVP 이어하기 — 일지 「마이리얼트립 패키지 연동」핸드오프·MVP 표 확인.
목표: 탐색 에디터스 픽 테마 subtitle → MRT /pkc 단축 새 탭.
매핑: 가족·휴양=동남아 dVDy3a · 장거리=유럽 dVE182 · 일본 신규 섹션=dVEgd5.
구현: mrtPackageThemeLinks.js + CurationSection packageLinkUrl + SearchDiscoveryModal 일본 섹션.
금지: travelSpots.js 전체 스캔 · spots JSON 직접 수정 · VITE_ MRT 키 · TripLinkModal/iframe · TRIPLINK_PACKAGES_ENABLED=true.
Edge mylink·숙소 region은 이번 범위 밖.
```
