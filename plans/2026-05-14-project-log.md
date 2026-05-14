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

## 향후(선택)

- 채팅 API에 **동일 요약을 system 컨텍스트로 주입**하면 대화 시발점으로 활용 가능(별도 작업).
