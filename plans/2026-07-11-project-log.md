# 2026-07-11 프로젝트 일지

**직전**: [`2026-07-09-project-log.md`](./2026-07-09-project-log.md)

---

## MOONi 모바일 독 — 입력 확장

**상태**: ✅ QA 확인 (2026-07-11)

- 주제 칩·입력 가로 분할 시 입력창이 너무 좁음 → **포커스·타이핑 시 칩 숨김 + 입력 전폭**
- 대상: [`ChatModal.jsx`](../src/pages/Home/components/ChatModal.jsx)

---

## MOONi 「가는 방법」— 출발지 검색 (장소카드·Bar 정렬)

**상태**: ✅ QA 확인 (2026-07-11)

- 서울·부산·인천 **고정 L2 칩 제거**
- [`FlightOriginSelector`](../src/pages/Home/components/FlightOriginSelector.jsx) `chat` / `chat-header` (모달 z-index → **inline listbox**)
- 저장된 출발지 표시 · 검색 · 내 위치 · **물어보기** / 선택 시 `「{도시}에서 어떻게 가?」` + `access_origin`
- `gateo.flightOriginIata` — 장소카드·FlightCinemaBar와 **공유**
- 페리 필요 slug만 **페리·배** 칩 유지
- SSOT: [`mooniQuickReplies.js`](../src/pages/Home/lib/mooniQuickReplies.js) · [`mooniChipPrompts.js`](../src/pages/Home/lib/mooniChipPrompts.js) · handoff §2.11.3

### 파일

| 파일 | 역할 |
|------|------|
| `ChatModal.jsx` | access 독 UI · 입력 확장 |
| `FlightOriginSelector.jsx` | `chat` / `chat-header` |
| `mooniQuickReplies.js` | L2 access = 페리만 · `buildAccessRouteAskText` |
| `mooniChipPrompts.js` | `ACCESS_ORIGIN` 지침 |

**releaseNotes**: 초안만 — 합의 후 `releaseNotes.js` 반영 (아래).

---

## MOONi 독 UX — 에이전트 핸드오프

### 이번 세션 완료

| # | 항목 |
|---|------|
| 1 | 모바일 입력 포커스 시 확장 |
| 2 | access L2 → FlightOriginSelector (고정 도시 칩 제거) |

### 다음 세션 잔여 (개선 후보)

| 우선 | 항목 | 노트 |
|------|------|------|
| **P0** | 일반 L1/L2 모바일 **세로 스택** (칩 전폭 → 입력 전폭) | access는 이미 별도 독. 가로 6:4+확장만으로는 칩 wrap이 답답할 수 있음 |
| **P1** | 주제 칩 **터치 영역** `min-h-[40~44px]` · `touch-manipulation` | [`MooniQuickReplyChips.jsx`](../src/components/chat/MooniQuickReplyChips.jsx) |
| **P2** | 대화 시작 후에도 짧은 「다른 주제」 힌트 (선택) | 현재 prompt는 `messages.length === 0`만 |
| **P3** | L2 라벨 이모지 톤 통일 | 페리만 🚢 등 혼재 |

**하지 말 것 (이미 됨 / 범위 밖)**

- access 고정 서울·부산·인천 칩 복구
- `FlightOriginSelector` 로직·`rentalAirportMatch` 임의 변경 (승인 후)
- `travelSpots.js` 전체 스캔 · spots JSON 직접 수정

### 읽을 것 3 · 금지 3

**읽을 것**: `.ai-context` 1·3절 · 본 일지 「MOONi 독 UX」· handoff [`§2.11.3`](./2026-05-22-ai-chat-booking-cta-handoff.md)

**금지**: access 고정 도시 칩 재추가 · PowerShell로 한글 JSX 일괄 수정 · 사용자 승인 없이 releaseNotes 반영

---

## 릴리스 노트 초안 (합의 대기)

```js
{
  id: '2026-07-11',
  category: 'feature',
  title: 'MOONi 「가는 방법」이 출발지 검색과 연결됐어요',
  items: [
    '장소카드·항공 바와 같은 출발지 검색으로 어디서 출발하는지 고를 수 있어요.',
    '모바일에서 직접 입력할 때 검색창이 넓어져 타이핑이 편해졌어요.',
  ],
}
```

---

## 다음 세션 제시어

```
@.ai-context.md @plans/2026-07-11-project-log.md

MOONi 독 UX 이어하기.

일지 「MOONi 독 UX — 에이전트 핸드오프」잔여 표 확인.
우선: P0 모바일 일반 주제 칩·입력 세로 스택 → P1 MooniQuickReplyChips 터치 영역.
access 출발지 검색(FlightOriginSelector chat)은 완료 — 회귀만 확인, 고정 도시 칩 복구 금지.
대상: ChatModal.jsx · MooniQuickReplyChips.jsx.
금지: travelSpots.js 전체 스캔 · spots JSON 직접 수정 · PowerShell 한글 JSX 일괄 수정 · 승인 없는 releaseNotes.
합의되면 일지 릴리스 노트 초안을 releaseNotes.js 맨 앞에 반영.
```
