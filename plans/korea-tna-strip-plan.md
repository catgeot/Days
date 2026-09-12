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
| **#6** | 클룩 즐길거리·렌터카 링크 연동 | `EventTnaStrip.jsx` 하단에 클룩 "즐길거리 더보기" 및 "렌터카 최저가 비교" 링크 칩 연동, i18n 반영, `smoke:korea-tna-strip` 검증 | ✅ 완료 (`0c77e661` · PR [#230](https://github.com/catgeot/Days/pull/230)) |
| **#7** | Preview OK면 PR 병합 | `/qa/korea-tna-strip`에서 칩·카드 규격 확인 후 PR #230 병합. 레이아웃 피드백이면 칩 스타일만 수정 | ⬜ 다음 세션 |
| **#8** | 해외 이벤트/독립 섹션 확장 검토 | 세계 행사(`EventExecutionStrip`)와의 공통화 검토 | ⬜ 대기 |

---

## 4. 세부 구현 대상 파일

1. **`src/pages/WorldEvents/EventTnaStrip.jsx`**:
   - `getKlookSearchUrl`, `getKlookRentalUrlByLocation` import.
   - `location` 객체 및 `searchKeyword` 기반으로 클룩 즐길거리/렌터카 URL 계산.
   - 카드 영역 하단 및 `empty` 영역에 클룩 아웃링크 칩 렌더링.
2. **`src/i18n/locales/ko.json` & `en.json`**:
   - `worldEventDetail.tnaStrip.klookActivities`: `"{{place}} 즐길거리 클룩에서 더보기"` / `"Explore {{place}} activities on Klook"`
   - `worldEventDetail.tnaStrip.klookRental`: `"{{place}} 렌터카 최저가 비교"` / `"Compare {{place}} rental cars on Klook"`
3. **`scripts/smoke-korea-tna-strip.mjs`**:
   - 클룩 즐길거리 및 렌터카 URL 렌더링 검증 추가.

---

## 5. 다음 에이전트 세션 제시어

사람은 같은 턴 Preview. 다음 채팅 = **Preview OK면 PR 병합**.

```
한국 투어티켓 #7, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-tna-strip-plan.md
브랜치 cursor/korea-tna-strip-ef65 · PR #230 · Preview /qa/korea-tna-strip
금지: UI 리디자인 · 마이리얼트립 카드 규격 파손 · feature에 plans/** 커밋
작업: 경복궁·축제 상세 투어 섹션 하단 클룩 칩이 보이면 PR #230 병합. 레이아웃 피드백이면 칩 스타일만 수정
```

---

## 9. 핸드오프

| | |
|--|--|
| **상태** | **#6 push** · tip `0c77e661` · PR [#230](https://github.com/catgeot/Days/pull/230) |
| **브랜치** | `cursor/korea-tna-strip-ef65` |
| **Preview** | `/qa/korea-tna-strip` → git Preview `/korea/theme/scenic?spot=gyeongbokgung` |
| **VERIFY** | `smoke:korea-tna-strip` · `smoke:korea-scenic-stay` · `vite build` PASS |
| **금지** | UI 리디자인 · 마이리얼트립 카드 규격 파손 · feature에 `plans/**` 커밋 |
| **다음** | #7 Preview OK면 PR 병합. 같은 세션 QA — `사람 Preview QA` 채팅 생략 |
