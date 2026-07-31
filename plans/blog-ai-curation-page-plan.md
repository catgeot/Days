# 블로그 AI 큐레이션 페이지 — 인페이지 콘텐츠 허브

**상태**: Phase B+C tip · Preview QA 대기  
**제시어**: `큐레이션-이어하기` · `@plans/blog-ai-curation-page-plan.md`  
**브랜치**: `cursor/blog-ai-curation-links-5aff` (기반 [#38](https://github.com/catgeot/Days/pull/38) Phase A)

---

## 0. 사람 방향 (고정)

| 합의 | 의미 |
|------|------|
| **연결이 아니라 인페이지 콘텐츠** | 지구본 써머리·장소카드로 **나갔다가 돌아오기 어렵다** → 큐레이션 **페이지 안에서** 실용·숨은 정보를 바로 본다 |
| **재진입** | 마지막 큐레이션이 남아 보임 (이미 `sessionStorage` `gateo_curation_data`) |
| **나의 큐레이션 목록** | 추천받았던 여행지를 나열·다시 열기 |
| **폭넓은·확장 가능** | 도구 카드 1장이 아니라 **큐레이션 전용 페이지**로 성장 |
| **정보 창** | 들어왔을 뿐인데 실용적·덜 알려진 내용을 얻을 수 있을 것 |

**비목표(이번 방향)**: CTA로 홈/장소카드만 보내는 흐름을 주 UX로 유지하는 것. (기존 CTA는 보조·축소 가능 — UI 톤은 사람 QA 후)

---

## 1. 현재 상태 (Phase A — 연결·로직 ✅)

| 항목 | 상태 | 파일 |
|------|------|------|
| 블로그 도구 패널 카드 | ✅ | `AICurationCard.jsx` · Dashboard `showTools` |
| Gemini + Unsplash/Pexels · 비로그인 실행 | ✅ | `useLogbookAI.js` `useCurationAI` · `prompts.js` |
| SSOT/uiPlace 하이드레이트 · 홈 핸드오프 | ✅ | `curationPlaceBridge.js` · Home `consumeCurationHomeOpen` |
| CTA: 지구본·장소카드·무니 | ✅ (다음 Phase에서 **보조**) | `AICurationCard.jsx` |
| session 결과/히스토리 | ✅ 결과 1건 + history **객체** (문자열 하위호환) | `curationHistory.js` · local+session |
| 「나의 목록」구조화 | ✅ upsert·복원 · 상한 24 | `CurationHub` 사이드 목록 |
| 전용 라우트 `/blog/curation` | ✅ | `Curation.jsx` · App `curation` before `:id` |
| 인페이지 리치 (tips 등) | ✅ MVP · 파싱 실패 시 description만 | `getCurationPrompt` · `CurationRichBlocks` |
| 도구 패널 카드 | ✅ 전용 페이지 링크 티저 | `AICurationCard.jsx` |

**사람 QA**: 이전 실패(깨진 사진·가짜 폴백·연결 없음·로그인 강제) **처리 확인됨**.

---

## 2. 제품 스케치 (다음 세션)

### 2.1 IA

```
/blog/curation  (신규 · DailyLayout 안)
├─ Hero / 실행: 낙원 탐색 · 다른 낙원
├─ 현재 추천 (메인 패널)
│   ├─ 사진 · 제목 · 지명
│   ├─ 스토리텔링 (기존 description)
│   └─ 인페이지 리치 블록 ← 핵심 (나가기 전에 읽는 UX)
│       예: 왜 숨은 낙원인지 · 가는 철(계절) · 알아두면 좋은 것 · 비슷한 대안 1~2
├─ 나의 큐레이션 목록 (세션→나중 local/DB)
│   └─ 탭하면 메인 패널에 해당 건 복원 (페이지 이탈 없음)
└─ (보조) 지구본/장소카드/무니 — 명시적 「더 깊게」만, 기본 읽기는 페이지 내
```

### 2.2 「나의 큐레이션」저장 모델 (제안)

`gateo_curation_history`를 **문자열 배열 → 객체 배열**로 승격 (하위호환: string이면 location만).

```json
{
  "location": "아이투타키",
  "locationEn": "Aitutaki, Cook Islands",
  "title": "...",
  "description": "...",
  "imageUrl": "...",
  "slug": "...",
  "lat": 0,
  "lng": 0,
  "country": "...",
  "enrichment": { },
  "savedAt": 1710000000000
}
```

- **1차**: `sessionStorage` / `localStorage` (비로그인 OK · 기기 한정)
- **2차(확장)**: 로그인 시 `saved_trips` `is_ai_curation`와 목록 동기 (이미 북마크 경로 있음)

상한: 세션/로컬 **20~30건** · 동일 `location` 재추천 시 upsert.

### 2.3 인페이지 리치 콘텐츠 (확장 포인트)

| 블록 | 1차(MVP) | 이후 |
|------|----------|------|
| AI 스토리 | 기존 `description` | 섹션 분리(분위기/팁/주의) JSON 스키마 |
| 실용 팁 | Gemini 추가 필드 1회 (`tips[]`, `bestSeason`, `hiddenGem`) | Edge 캐시 |
| 지도 미니 | 페이지 내 정적 좌표/미니맵(이탈 없음) | Mapbox 임베드 |
| 갤러리 | 기존 imageUrl + 실패 플레이스홀더 | `usePlaceGallery` thumbnailOnly |
| 숙소·투어 | — | 써머리 스트립 패턴 **임베드**(라우트 이탈 X) |
| 무니 | 페이지 내 짧은 Q&A 또는 하단 시트 | 풀 채팅은 보조 |

**원칙**: 기본 경로는 **페이지에 머무름**. 홈/장소카드는 「전체 탐색」옵트인.

### 2.4 복귀·이탈 문제 대응

| 문제 | 대응 |
|------|------|
| 써머리/장소카드 후 큐레이션 복귀 어려움 | 1차 UX를 **인페이지**로 · CTA 축소·라벨 「전체 지도에서 보기」 |
| 나가더라도 복귀 | `placeReturnTo` 패턴 확장: `setPlaceReturnTo('/blog/curation')` 허용 경로 추가 (선택) |

---

## 3. 구현 Phase (다음 세션부터)

### Phase B — 전용 페이지 셸 + 목록 ✅

1. ✅ `/blog/curation` → `Curation.jsx` + `CurationHub`
2. ✅ 도구 패널은 링크 티저 · 본문은 허브 페이지
3. ✅ history 객체 · localStorage 우선(+session 마이그레이션)
4. ✅ 목록 클릭 → `selectFromHistory` (페이지 이탈 없음)
5. ✅ `npm run smoke:curation-history`

### Phase C — 인페이지 리치 MVP ✅

1. ✅ `tips` · `bestSeason` · `whyHidden`
2. ✅ `CurationRichBlocks` (글래스/블루 톤)
3. ✅ 필드 없어도 description만으로 성립

### Phase D — 임베드·복귀 (다음 · 사람 합의 후)

- 미니맵 / gallery / 숙소·투어 스트립 임베드
- `placeReturnTo`에 `/blog/curation` 허용
- 로그인 목록 ↔ `saved_trips` 동기

---

## 4. 금지·주의

- `travelSpots.js` 전체 스캔 금지 · 목록은 list/resolve 유틸
- 브라우저에 Gemini/`VITE_` 비밀키 노출 금지 · 프록시 유지
- UI 임의 리디자인 금지 — **연결→인페이지**는 기능·정보 구조 추가 · 톤은 블로그 LogBook 글래스/블루 계열 유지
- 기존 Explore/PlaceCard 흐름을 깨는 전역 변경 금지
- PowerShell로 한글 JSX 일괄 수정 금지

---

## 5. 읽을 것 (다음 세션 · 토큰 절약)

1. 이 파일 §0·§3 Phase D · §4  
2. 일지 [`2026-07-31-project-log.md`](./2026-07-31-project-log.md) 「Phase B+C」·핸드오프  
3. 코드: `Curation.jsx` · `CurationHub.jsx` · `curationHistory.js` · `useCurationAI` · (복귀 시) `placeReturnTo.js`  
4. VERIFY: `npm run smoke:curation-history` · `smoke:curation-place-bridge`

**읽지 말 것**: travelSpots 전체 · travel-spots-management 전체 · 축제/MRT 가이드

---

## 6. 다음 세션 제시어 (복붙)

```
큐레이션-이어하기
@plans/blog-ai-curation-page-plan.md
@plans/2026-07-31-project-log.md

Preview QA 후 Phase D(합의 시): placeReturnTo=/blog/curation · 미니맵/갤러리 임베드.
기존 톤 유지 · 비로그인 유지.
```

---

## 7. 릴리스 노트

- Phase A(연결·비로그인): Preview QA OK — 공지 여부는 사람 합의 후 (`releaseNotes.js` · `.ai-context` 1.7)
- Phase B/C(전용 페이지·인페이지 리치): **새 기능** — Preview QA OK 후 초안 제안 (합의 전 `releaseNotes.js` 미수정)
