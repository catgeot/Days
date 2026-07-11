# 2026-07-11 프로젝트 일지

**직전**: [`2026-07-09-project-log.md`](./2026-07-09-project-log.md)

---

## MOONi 「가는 방법」— 출발지 검색 (장소카드·Bar 정렬)

**상태**: ✅ QA 확인 (2026-07-11)

- 서울·부산·인천 **고정 L2 칩 제거**
- [`FlightOriginSelector`](../src/pages/Home/components/FlightOriginSelector.jsx) `chat` / `chat-header`
- `gateo.flightOriginIata` 공유 · 페리 칩만 보조
- SSOT: [`mooniQuickReplies.js`](../src/pages/Home/lib/mooniQuickReplies.js) · [`mooniChipPrompts.js`](../src/pages/Home/lib/mooniChipPrompts.js) · handoff §2.11.3

---

## MOONi 모바일 독 UX

**상태**: ✅ QA 확인 (2026-07-11)

| # | 항목 |
|---|------|
| 1 | 세로 스택 (칩 전폭 → 입력 전폭) · 포커스 시 칩 숨김 · 빈 입력 blur/키보드 닫기 시 칩 복귀 |
| 2 | L1 **가로 스크롤 1줄** · 우측 페이드 · 칩 `min-h-[36px]` |
| 3 | L2 **「다른 주제」 pill** (access 독 동일) |
| 4 | 미사용 입력창 축소(`h-8`) · 포커스 시 확대 |
| 5 | 헤더 Compact + 시인성 (닫기·「MOONi 여행 대화」·「플래너 보기」) |

**파일**: [`ChatModal.jsx`](../src/pages/Home/components/ChatModal.jsx) · [`MooniQuickReplyChips.jsx`](../src/components/chat/MooniQuickReplyChips.jsx)

**releaseNotes**: `2026-07-11` 반영.

---

## MOONi 데스크톱 독·헤더 밀도 (D0)

**상태**: ✅ QA 확인 (2026-07-11)

- 헤더 Compact · 칩·입력·access 독 padding 축소
- dock 칩: **1줄 가로 스크롤** + 우측 페이드 (wrap 제거)
- bound: **칩(왼쪽) + 입력(오른쪽)** 한 줄 · 입력 cyan 테두리·시인성
- 파일: [`ChatModal.jsx`](../src/pages/Home/components/ChatModal.jsx) · [`MooniQuickReplyChips.jsx`](../src/components/chat/MooniQuickReplyChips.jsx)
- **releaseNotes**: `2026-07-11` 데스크톱 항목 추가

---

## MOONi 사이드바 전환 — 장소 바인딩 동기화

**상태**: ✅ QA 확인 (2026-07-11)

- 원인: `mooniPlaceContext` 진입 고정 → 헤더·플래너·토픽독·전송이 활성 trip과 어긋남
- `activeSessionPlace` SSOT (`resolveSessionBoundSpot`) · `onSwitchChat`에서 context 재설정 · `activeChatId` 시 토픽독 리셋
- 파일: [`ChatModal.jsx`](../src/pages/Home/components/ChatModal.jsx) · [`index.jsx`](../src/pages/Home/index.jsx)
- releaseNotes: 버그 수정 · 생략

---

## MOONi 독 UX — 에이전트 핸드오프

### 다음 세션

| 우선 | 항목 | 노트 |
|------|------|------|
| **P2** | 대화 시작 후에도 짧은 「다른 주제」 힌트 (선택) | `messages.length === 0`만 |
| **P3** | L2 라벨 이모지 톤 통일 | 페리만 🚢 등 혼재 |

**하지 말 것**

- access 고정 서울·부산·인천 칩 복구
- `FlightOriginSelector` 로직·`rentalAirportMatch` 임의 변경 (승인 후)
- `travelSpots.js` 전체 스캔 · spots JSON 직접 수정 · PowerShell 한글 JSX

### 읽을 것 3 · 금지 3

**읽을 것**: `.ai-context` 1·3절 · 본 일지 · handoff [`§2.11.3`](./2026-05-22-ai-chat-booking-cta-handoff.md)

**금지**: access 고정 도시 칩 재추가 · PowerShell 한글 JSX · 승인 없는 releaseNotes

---

## 다음 세션 제시어

```
@.ai-context.md @plans/2026-07-11-project-log.md

MOONi 독 UX — P2/P3 이어하기.

D0 데스크톱 밀도 QA Pass. 일지 「다음 세션」 P2·P3.
대상: ChatModal.jsx · MooniQuickReplyChips.jsx · mooniQuickReplies.js.
금지: access 고정 도시 칩 복구 · travelSpots.js 전체 스캔 · PowerShell 한글 JSX.
```
