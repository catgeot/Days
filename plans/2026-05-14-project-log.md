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
- **플래너 UI**: `PlannerTab` 상단 **「렌터카 · 픽업 기준」** 배너(로딩·툴킷 없음·본문 공통, 매칭될 때만). `utils.js` `airport_transfer`, `ToolkitCard`, `JourneyTimeline`은 `getKlookRentalUrlByLocation(location)` 전달.

## 향후(선택)

- 채팅 API에 **동일 요약을 system 컨텍스트로 주입**하면 대화 시발점으로 활용 가능(별도 작업).
