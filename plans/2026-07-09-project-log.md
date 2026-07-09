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
