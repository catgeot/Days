# 2026-07-24 프로젝트 일지

직전: [`2026-07-23-project-log.md`](./2026-07-23-project-log.md)

## 갤러리 — 호출 순서 DB 우선 (국내/해외 구분)

**상태**: ✅ 사람 QA 확인 · 커밋·push

- 순서: session → **DB** → TourAPI(`contentId` 국내만) → Unsplash/Pexels → soft Tour(국내·스톡0)
- 해외: TourAPI 미호출 (`isDomesticKoreaLocation` · curated SSOT만 국내)
- soft Tour 우세 DB 스킵(공지천) 유지 · 공식 contentId DB는 재사용 · **DB 히트 시 기존 사진 미갱신**
- 캐시 `v1.13` · 문서: `.ai-context` 갤러리 절 · [`tourapi-edge-proxy-plan.md`](./tourapi-edge-proxy-plan.md) §2

## 갤러리 — 모바일 확장 카드 스켈레톤 고착

**상태**: ✅ 사람 QA 통과 · 커밋·push

- 원인: (1) 캐시·모바일에서 `img.onLoad` 누락으로 타일 pulse 스켈레톤 유지 (2) `place_stats`/전체 fetch hang·early return 시 `isImgLoading` 미해제
- 대응: `GalleryGridTile` complete/rAF 동기화·6s hang→드롭 · paint chrome 3.5s · `usePlaceGallery` early-return 해제·DB 8s·전체 28s safety
- QA: 재현지 **케이프타운** · 스켈레톤 정상 해제 확인

## 써머리 장소카드 — uiPlace 안내 문구 제거

**상태**: ✅ 커밋·push

- `PlaceCardSummary`: 「큐레이션 여행지가 아닙니다…」 문구 삭제 (의미 약한 노이즈)

## 숙소 empty/error 문구 + Smoke P0-4/P0-5

**상태**: ✅ 커밋·push · `npm run smoke:health` PASS

- API 실패(`error`)와 결과 0건(`empty`) 문구 분리 · Trip.com CTA 공통 (`getTripcomHotelErrorCopy`)
- error subtitle: 「잠시 후에 다시 시도해 주세요…」
- Smoke Health: **P0-4** `fetch-mrt-stays` · **P0-5** `tourapi-proxy` · `smoke:mrt-stay` 별칭

### Smoke #194 실패 후속 (P0-4/P0-5 완화)

**상태**: ✅ 커밋·push · 이후 Smoke PASS

- 원인 추정: MRT Edge 일시 **502** `accommodation/search failed` → 프로브 즉시 fail · CI `SMOKE_FAIL_ON_WARN=1`
- 대응: Edge 프로브 **28s·3회 재시도** · upstream 열화는 **warn(exit 0)** · Gemini(P0-3) warn만 CI fail
- Actions: `checkout`/`setup-node` **v5**(Node 24) · Node 20 deprecation 경고 제거 · 사람 확인 PASS

## 검색 선택 카드 — 다크모드·모바일 시인성

**상태**: ✅ 사람 QA 확인 · 커밋·push

- 모바일(갈색 모달): 카드 배경 `#32281f` · 보조문구 대비 상향
- 위치 줄과 겹치는 합성 desc 숨김 · 명소/정착지 합성 desc 제거
- 도시 카드에 SSOT 여행지 `desc` 이식 · 이름에 포함된 상위 도시는 위치 줄에서 생략
- 선택 카드: `line-clamp` 제거·높이 `h-auto`/`items-start` · 설명 13~14px·`amber-50/90`
- 제목 구분: em dash(`—`) → 화살표(`→`) — 「으」 연상 방지

## 무니 인트로 → 장소 써머리 재사용

**상태**: ✅ 사람 QA · 가독성 확인 · 커밋·push

- 원인: `resolveFuzzy` `core.includes(sn)` + ChatModal이 uiPlace draft를 부모 SSOT로 승격 → 「미야코지마 요네하라비치」가 섬 설명으로 생성·캐시됨
- 수정: uiPlace/비카탈로그는 entrySeed 유지 · fuzzy는 spot명 뒤 잔여≥2면 부모 붕괴 거부
- 재사용: `place_chat_intro` 본문 strip → 빈/합성 `desc` hydrate (확장 갤러리 overview · 검색 선택 카드 · 장소 선택 시 캐시 hit)
- 가독성: `PlaceOverviewProse` — 문장 단위 문단 · `break-keep` · 행간 1.8~1.85 · 자간 0.01em · intro는 `desc`만(큐레이션 보라 박스 오인 방지)
- **제외**: 잘못 캐시된 `미야코지마` intro 일괄 삭제(불필요)

### 다음 세션 — 에이전트 핸드오프

| 읽을 것 | |
|---------|--|
| 1 | `.ai-context.md` 1절·3절(금지) · 본 일지 절 |
| 2 | [`placeChatIntro.js`](../src/pages/Home/lib/placeChatIntro.js) · [`PlaceOverviewProse.jsx`](../src/components/PlaceCard/common/PlaceOverviewProse.jsx) |
| 3 | 매거진: [`useWikiData.js`](../src/components/PlaceCard/hooks/useWikiData.js) · [`PlaceWikiDetailsView.jsx`](../src/components/PlaceCard/views/PlaceWikiDetailsView.jsx) |

| 금지 3 | |
|--------|--|
| 1 | `place_wiki`/`place_chat_intro` 스키마 무단 변경 · 매거진 본문 전체 재생성과 혼동 |
| 2 | 방문 시 AI를 매 재진입마다 호출(캐시 hit면 skip · rate 제한) |
| 3 | 미야코지마 intro 일괄 삭제 재시도 |

**제시어** (복사):

```
써머리-이어하기
@plans/2026-07-24-project-log.md 「무니 인트로 → 장소 써머리 재사용」핸드오프
1) 빈/합성 desc 방문 시 place_chat_intro 없으면 AI 생성·저장·hydrate (무니 클릭 없이 · 캐시 hit skip)
2) 매거진 없을 때 place_wiki.summary 상단에 동일 intro 시너지 (매거진 생성 전 placeholder)
3) 별건: 신규 지역(명소 hub) 홈 써머리 카드 fly-to/focus 미동작 조사·수정
제외: 미야코지마 intro DB 일괄 삭제
```
