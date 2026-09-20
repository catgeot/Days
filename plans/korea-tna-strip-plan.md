# 한국 축제·명승 투어·티켓(TNA) 및 클룩·렌터카 연계 실행 계획

**제품명**: 축제·명승 본문 투어·티켓(TNA) 및 클룩 즐길거리·렌터카 연계  
**세션 표기**: `한국 투어티켓 #{N}, {단계}` (고정 접두)  
**고정 브랜치 (구현)**: `cursor/korea-tna-strip-ef65` (또는 신규 기능 브랜치)  
**공유 slug**: `/qa/korea-tna-strip` → Preview `/korea/theme/scenic?spot=gyeongbokgung`  
**관련 플랜**: [`korea-theme-travel-plan.md`](./korea-theme-travel-plan.md) · [`klook-rental-search-data.md`](./klook-rental-search-data.md)  
**규약**: [`docs-on-main-workflow.md`](./docs-on-main-workflow.md) (로직=feature, 문서=main)

---

## 1. 개요 및 배경

현재 축제 상세 바텀시트(`FestivalDetailSheet.jsx`)와 명승 상세 모달(`ThemeSpotDetailModal.jsx`) 본문에 마이리얼트립 기반 투어·티켓 카드 섹션(`EventTnaStrip`, `FestivalTnaStrip`, `ScenicTnaStrip`) 1차 구현 및 PR #223 병합이 완료되었습니다.

그러나 다음 후속 과제들을 체계적으로 연결하고 에이전트 간 연속성을 보장하기 위해 전용 계획서를 수립합니다:
1. **클룩(Klook) 연계 필요성**:
   - 클룩 제휴 규정상 계약 후 6개월 무실적 시 자동 해지 조항이 있어, 실적 발생 경로를 축제·명승 본문으로 확대해야 함.
   - 클룩은 REST 상품 조회 API를 제공하지 않으므로, 마이리얼트립 카드 아래에 **"즐길거리 클룩에서 더보기"** 검색 딥링크를 보완 배치하여 양사 제휴 트래픽을 상호보완.
2. **렌터카(Rental Car) 연계 필요성**:
   - 국내 축제/명소 탐방 시 렌터카는 핵심 이동 수단임.
   - 클룩 및 마이리얼트립 모두 렌터카 상품 API는 없으나, 클룩 렌터카 검색 딥링크(`getKlookRentalUrlByLocation`)가 이미 시스템에 구축되어 있음.
   - 투어 섹션 하단에 **"렌터카 클룩에서 예약하기"** 바로가기 칩을 나란히 배치하여 이동 수단 탐색 편의와 클룩 실적을 동시에 확보.

---

## 2. UI/UX 및 아키텍처 원칙

1. **위치 및 계층 구조**:
   - 상단: `EventStayStrip` (숙소 카드 스트립)
   - 중단: `EventTnaStrip` (마이리얼트립 투어·티켓 카드 스트립)
   - TNA 섹션 하단(푸터 영역):
     - `[클룩] {지역명} 즐길거리 클룩에서 더보기 ↗`
     - `[클룩] {지역명} 렌터카 최저가 비교 ↗`
2. **반응형 및 가독성**:
   - 상품 카드가 가로 스크롤로 매끄럽게 흐른 뒤, 카드 영역 하단에 깔끔한 보조 아웃링크 칩 그룹으로 배치.
   - 모바일 뷰포트에서 본문 스크롤에 부담을 주지 않도록 텍스트 칩 형태로 가볍게 제공.
   - 상품이 없는 `empty` 상태에서도 클룩 즐길거리 및 렌터카 검색 링크를 대체 수단으로 자연스럽게 안내.
3. **URL 생성 SSOT**:
   - 클룩 즐길거리: `getKlookSearchUrl(searchKeyword, locale)` (`src/utils/affiliate.js`)
   - 클룩 렌터카: `getKlookRentalUrlByLocation(location)` (`src/utils/affiliate.js`)

---

## 3. 세션별 세분화 로드맵

| 세션 | 단계명 | 주요 작업 | 상태 |
|---|---|---|---|
| **#1~#5** | 본문 TNA 섹션 구축 및 크게보기 | `EventTnaStrip`, `FestivalTnaStrip`, `ScenicTnaStrip` 신설, 축제/명승 상세 연동, 20개 로드 및 가로 카드 확대 지원, PR #223 병합 | ✅ 완료 (`0071d2cb`) |
| **#6** | 클룩 즐길거리·렌터카 링크 연동 | `EventTnaStrip` 하단 클룩 즐길거리·렌터카 칩, PR [#230](https://github.com/catgeot/Days/pull/230) 병합 | ✅ 완료 (MERGED) |
| **#7** | 국내 렌터카·기차표 | 렌터카 문구 「{{place}} 렌터카 보기」 · 국내 렌터카 마이리얼트립 `/rentalcars?category=domestic` · 기차표 트립닷컴 `/trains/` · 클룩 즐길거리는 유지 | ✅ 완료 (`593fd59f` · PR [#234](https://github.com/catgeot/Days/pull/234)) |
| **#8** | 왕가의 산책 인천 폴백 | Preview에서 인천공항 행사가 옹진 숙소·행사명 투어(룩소르)로 나옴. 시도 대표 인천·인접 칩·행사명 TNA 제외 | ✅ 완료 (`beb65f1a` · PR [#234](https://github.com/catgeot/Days/pull/234)) |
| **#9** | 명승·축제 숙소·투어 시도 폴백 | 대청도처럼 시드 군·섬은 재고 0인데 명승이 칩·알트를 안 넘김. 시도 시드 폴백·cityHints | ✅ 완료 (`e885df64` · PR [#234](https://github.com/catgeot/Days/pull/234)) |
| **#10** | Preview OK면 PR 병합 | 대청도 숙소·투어·왕가의 산책 인천·경복궁 렌터카/기차표 확인 후 PR #234 → `origin/main` | ✅ 완료 (merge `2374db5f`) |
| **#11** | 해외 이벤트/독립 섹션 확장 검토 | 세계 행사(`EventExecutionStrip`)와의 공통화 검토 | ⬜ 대기 (별도 요청) |

---

## 4. 세부 구현 대상 파일

1. **`src/pages/WorldEvents/EventTnaStrip.jsx`**:
   - `getKlookSearchUrl` · `getMrtDomesticRentalUrl` · `getTripcomTrainUrl`.
   - 카드 하단 칩: 클룩 즐길거리 · **마이리얼트립 국내 렌터카** · **트립닷컴 기차표**.
2. **`src/utils/affiliate.js`**:
   - `getMrtDomesticRentalUrl` → `https://www.myrealtrip.com/rentalcars?category=domestic` + mylink.
   - `getTripcomTrainUrl` → `kr.trip.com/trains/` + Alliance/SID. (12Go는 동남아·외국인 KR Pass 중심 — 국내 명승·축제 칩에는 쓰지 않음.)
3. **`src/i18n/locales/ko.json` & `en.json`**:
   - `worldEventDetail.tnaStrip.klookActivities`: `"{{place}} 즐길거리 클룩에서 더보기"`
   - `worldEventDetail.tnaStrip.rental`: `"{{place}} 렌터카 보기"` (최저가 비교 없음)
   - `worldEventDetail.tnaStrip.train`: `"{{place}} 기차표 보기"`
4. **`scripts/smoke-korea-tna-strip.mjs`**:
   - 렌터카 MRT · 기차표 Trip.com · 카피 검증.

---

## 5. 다음 에이전트 세션 제시어

**다음 제시어 없음** (주제 종료 · main `2374db5f`). 해외 이벤트 TNA 공통화(#11)는 별도 요청 시.

---

## 9. 핸드오프

| | |
|--|--|
| **상태** | **#10 merge ✅ · 주제 종료** · main `2374db5f` · PR [#234](https://github.com/catgeot/Days/pull/234) |
| **브랜치** | `cursor/korea-tna-strip-ef65` · merge `2374db5f` |
| **PROD** | `https://www.gateo.kr/korea/theme/scenic?spot=gyeongbokgung` · `/qa/korea-tna-strip` → PROD |
| **VERIFY** | `smoke:korea-tna-strip` · `smoke:korea-theme-cross-links` · `smoke:korea-scenic-stay` · `smoke:korea-festival-personal` · `smoke:mrt-stay` · `smoke:travel-agencies` PASS |
| **금지** | UI 리디자인 · 마이리얼트립 카드 규격 파손 |
| **다음** | 없음. 해외 이벤트 TNA 공통화(#11)는 별도 요청 |
