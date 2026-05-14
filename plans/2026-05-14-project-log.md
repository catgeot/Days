# 2026-05-14 Project Log

이전 일지: [`plans/2026-05-10-project-log.md`](./2026-05-10-project-log.md)

## 써머리 장소카드(홈)

- **지명**: 복사 버튼 제거. 지명은 상단 블록의 `onExpand`와 동일하게 동작해 **확장 장소카드**로 진입(`PlaceCardSummary.jsx`).
- **보조 지명**: 복사·「보조 지명 복사됨」 피드백 유지.

## 홈 · AI에게 장소 묻기(채팅 모달)

- **빈 화면 보완**: 모달 오픈 시 여행지별 **짧은 AI 요약**을 상단 카드(「이 장소 한눈에 보기」)로 표시. 동일 `destination` 재진입 시 **Supabase 캐시** 우선, 없으면 생성 후 저장.
- **`src/pages/Home/lib/placeChatIntro.js`**: `destination_key`(trim·연속 공백 정리), `fetchPlaceChatIntroSummary` / `persistPlaceChatIntroSummary` / `generatePlaceChatIntroWithAi`, Supabase 실패 시 **로컬 스토리지** 보조.
- **`src/pages/Home/lib/prompts.js`**: `getPlaceChatIntroSystemPrompt()` — 요약 전용 짧은 시스템 프롬프트.
- **`ChatModal.jsx`**: `introDestinationRaw`(draft 또는 `activeChatId` 트립의 `destination`) 기준 로딩·에러·본문 UI.

## Supabase

- **`supabase/migrations/20260514120000_place_chat_intro.sql`**: 테이블 `place_chat_intro`(`destination_key` UNIQUE, `summary`, 타임스탬프), RLS(select/insert/update, `anon`·`authenticated`), `DROP POLICY IF EXISTS`로 재실행 안전, `GRANT`로 PostgREST 접근.
- **운영 확인**: SQL Editor 적용 후 테이블 생성·첫 AI 진입 저장·재진입 시 기존 요약 노출 확인됨.

## 플래너 · 클룩 렌터카 공항 매칭

- **목적**: “여행지명 + 렌터카” 검색만으로는 Klook 결과와 여행지가 잘 맞지 않던 문제를 줄이고, AI가 공항명을 명시하지 않아도 **공식 공항(한글 표기)** 기준으로 링크·배너를 맞춤.
- **`src/utils/rentalAirportHubs.js`**: IATA, `officialKo`, 대략 좌표, `radiusKm`, `aliases`(짧은 별칭 오탐 주의). 이집트는 **룩소르 `LXR`** 별도 허브, **`CAI` 별칭에서 `luxor`/`룩소르` 제거**(룩소르 여행지가 카이로로 잡히던 버그 수정).
- **`src/utils/rentalAirportMatch.js`**: `resolveRentalAirport`(좌표 최근접 → 별칭), `enrichLocationWithRentalAirport`로 `rental_airport_official_ko` / `rental_airport_iata` 주입.
- **`src/utils/affiliate.js`**: `getKlookRentalUrlByLocation`이 **문자열 또는 `location` 객체**를 받음. 기존 홍콩·도쿄 등 **`city_id` 딥링크** 키워드 매칭은 유지, 그 외는 매칭된 **공항 한글명 + 「렌터카」** 검색 URL.
- **홈 진입**: `useHomeHandlers`(지구본·`handleLocationSelect`)·`Home/index.jsx`(`/place` URL 동기화·세션 `mergeCachedPlaceIfCoordsMatch` 복원 시)에서 enrich.
- **플래너 UI**: `PlannerTab`에서 **상단 「렌터카 · 픽업 · 항공권 기준」배너는 비노출**(경유·도착 공항 오표기 방지). `utils.js` `airport_transfer`, `ToolkitCard`, `JourneyTimeline`은 `getKlookRentalUrlByLocation(location, { essentialGuide })` 등으로 제휴 URL 정합.

## 플래너 상단 「렌터카 · 픽업 · 항공권 기준」배너 비노출 (2026-05-14 배포)

- **배경**: 자동 매칭·툴킷 타임라인의 경유 공항이 **도착 공항으로 잘못 표기**되는 등 신뢰하기 어려워, 플래너 탭에서는 해당 **배너 블록 전체를 렌더하지 않음**.
- **`PlannerTab.jsx`**: 로딩·툴킷 없음·본문 어디에도 `resolveRentalPickupBannerInfo` 기반 배너를 두지 않음. 제휴 렌터카 링크는 **`ToolkitCard` / `JourneyTimeline` / `getKlookRentalUrlByLocation`** 등 기존 경로만 유지.

## 플래너 툴킷 UX 보강 (렌터카·항공·픽업·복잡도, 동일일 후속)

- **다중 도착 공항**: `rentalAirportMatch.js`의 `RENTAL_MULTI_AIRPORT_DESTINATIONS`·`resolveRentalPickupBannerInfo`로 카파도키아(ASR·NAV)·도쿄·방콕·파리 등 **공항을 줄바꿈** 나열, `resolveRentalAirport(..., { ignoreStoredRentalAirport })`로 링크 허브 보정. `affiliate.getKlookRentalUrlByLocation`은 배너 `linkHub`와 정합.
- **상단 배너**: ~~「렌터카 · 픽업 · **항공권** 기준」+ 공항 정식명 / (IATA) 클릭 복사~~ → **2026-05-14 후속으로 배너 전체 비노출**(위 §플래너 상단 … 참고). 당시 안내 문장 길이는 아래 **§플래너 툴킷·여정 UX 후속**에서 한 번 더 줄임.
- **복잡도**: 빨간 경고 단락 제거 → `PlannerTab` 제목 옆 `(복잡도 n/100)`만 (`is_complex`일 때).
- **항공권 검색**: `getFlightDestinationSearchHint(location)` — 다중 공항 시 짧은 문장으로 도시명·코드 권장; `PreTravelChecklist`·`ToolkitCard`(flight) 부제에 사용.
- **공항 픽업**: `PreTravelChecklist`·`ToolkitCard` 안내를 **항공편명 검색**·`utils.js` 링크 텍스트 `공항 픽업 검색`으로 정리(여행지명 자동 매칭 기대 완화). **공항 이동 카드**는 하단 부연 제거, 픽업 링크에 `subtext`로 항공편명 안내.

## 플래너 툴킷·여정 UX 후속 (2026-05-14 동일일)

- **`rentalAirportMatch.js`**: `getFlightDestinationSearchHint` 다중 공항 분기 문구를 한 줄로 축약(예: 도착 공항 도시명·(ASR, NAV) 형태).
- **`ToolkitCard.jsx`**, **`utils.js`**: `airport_transfer` 카드 렌터카 배너 위 회색 부연 제거. 공항 픽업 링크에 `subtext` 필드 추가·렌더 시 두 줄 버튼(항공편명 안내).
- **`PlannerTab.jsx`**: 상단 「렌터카 · 픽업 · 항공권 기준」배너 — 항공·일정 자동 반영 안내·다중 공항 시 허브 기준 문장·단일 공항 한 줄을 모두 짧게 정리.
- **`WhiteLabelWidget.jsx`**: 항공권(`flight`)은 기본 **새 탭**으로 화이트라벨 URL 열기(플래너 탭 유지). `openInNewTab`로 모달 유지 가능, 숙박(`hotel`)은 기존 전체 화면 모달.
- **`JourneyTimeline.jsx`**: STEP 제목 문자열에서 `\(([A-Z]{3})\)`마다 앞쪽 **도착 지명 토큰**과 **IATA 코드**를 각각 클릭 복사(정식 공항명으로 치환하지 않음; 코드 버튼 표시는 `(ASR)`·클립보드는 `ASR`). 이름 없이 코드만 있으면 `copyCode` 단일 버튼.

## 플래너 공항·클룩 제휴·로포텐 (2026-05-14 동일일 후속)

- **`rentalAirportHubs.js`**: **PDL**(아조레스)·**FAE**(페로) 허브 추가. **DEN** 별칭 `den` 제거(덴마크·`denmark` 부분 문자열 오탐 방지). 노르웨이 북부 **BOO·EVE·LKN·SVJ** 추가.
- **`rentalAirportMatch.js`**: DB `rental_airport_*`와 좌표 허브가 대륙 단위로 어긋나면 **좌표 허브 우선**. **IATA만** 저장된 경우 허브에서 정식 한글명 보강. **`getFlightDestinationSearchHint`**: IATA 코드 검색 우선 문구로 통일. **`getRentalCarHomeSearchSubtext`**: 클룩 홈에서 세자리 코드 입력 안내. **`RENTAL_MULTI_AIRPORT_DESTINATIONS`**: 로포텐(BOO·EVE·LKN·SVJ) + 선택 필드 **`bannerNote`**(지역 설명). **`resolveRentalPickupBannerInfo`**: `multi`일 때 `bannerNote` 전달.
- **`affiliate.js`**: **`getKlookRentalHomeUrl()`** — 렌터카 `/ko/car-rentals/` 랜딩, **`KLOOK_RENTAL_HOME_AD_ID`(`1277252`)**. 검색 폴백 **`getKlookRentalUrlByLocation`** 의 일반 검색은 **`KLOOK_DEFAULT_AD_ID`(`1256120`)** 로 통일(대시보드에 없던 `1256121` 제거). 제휴 마크·`aid=118544` 정합.
- **`planner/utils.js`** · **`ToolkitCard.jsx`** · **`KlookCarBannerWidget.jsx`**: 공항 이동 카드 **「렌터카 홈」**은 홈 딥링크 + `subtext` 안내; **배너**는 기존처럼 **공항명 검색 URL**(`getKlookRentalUrlByLocation`). 배너 영역 **`pointer-events-none`** + 오버레이 **`pointer-events-auto`·`z-20`** 으로 iframe이 클릭을 가로채지 않게 함.
- **`KlookTourBannerWidget.jsx`**: 렌터카 배너와 동일한 **클릭 → 제휴 리다이렉트** 처리; 외곽 래퍼 구조 정리.
- **`PlannerTab.jsx`**: 다중 공항이 **`bannerNote`** 를 가지면 공항 목록 아래 **왼쪽 세로 강조 + 긴 안내 문단**으로 표시(로포텐 전용 카피).

## 향후(선택)

- 채팅 API에 **동일 요약을 system 컨텍스트로 주입**하면 대화 시발점으로 활용 가능(별도 작업).
