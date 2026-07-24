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

## 써머리-이어하기 — 방문 시 intro 자동생성 · 매거진 placeholder · hub fly-to

**상태**: ✅ 사람 QA 확인 · 커밋·push

- `ensurePlaceChatIntroForLocation`: 캐시 hit skip · miss면 AI 생성·`place_chat_intro` 저장 · inflight/실패 키로 재호출 폭주 방지
- 장소 방문·`/place` sync: 빈/합성 desc면 ensure → 홈 써머리·갤러리 overview hydrate
- 매거진 빈 탭: 상단 intro (`lede`) · `place_wiki` 본문 재생성과 분리
- hub fly-to: Explore `fromSearch` + `wakeAfterOverlay` · ✅ 확인
- 홈 써머리: 고정 blurb 대신 실문장 `desc` · `/place` sync intro 유지(`overlaySessionCuration`)
- 양구 갤러리: TourAPI SSOT `yanggu` · curated hub Tour 우선(캐시 v1.14) · ✅ 확인
- **제외**: 미야코지마 intro DB 일괄 삭제

## 명소 확장 카드 부모 붕괴 + 써머리 intro 더보기

**상태**: ✅ 사람 QA · 커밋·push

- 원인: `/place/:slug` sync가 hub 명소보다 TRAVEL_SPOTS fuzzy를 먼저 해석 → `…-sydney` 등이 상위 도시로 리다이렉트
- 수정: `resolvePlaceTargetFromSlug` — exact SSOT → hub/정착지 → cities → fuzzy · fuzzy 접미 부모 붕괴(`before≥4`)도 거부
- 써머리: intro 공통 · 항공 카드 `line-clamp-2`+인라인「더보기」 · 비항공 `line-clamp-3`
- 검증: hub 명소 URL mismatch 102→9 (잔여 9는 slug가 카탈로그 명소와 exact 동일)

## hub 명소 매거진 — 상위 도시 상속 제거

**상태**: ✅ UI 합의 · 커밋·push

- 원인: `buildPlaceDbIdCandidates`가 coords/lookup으로 상위 SSOT를 wiki 후보에 넣음 → 해외 명소가 도시 매거진+명소 제목으로 표시
- 수정: `buildPlaceWikiIdCandidates` — hub 명소는 자체 slug/이름만 · 생성 placeId도 명소 기준
- 빈 탭 순서: 안내 → 「{도시} 여행 스케치 보기」(경쾌 pill) → AI 문구(시인성↑) → 「매거진 생성하기」
- 갤러리/stats 후보는 기존 `buildPlaceDbIdCandidates` 유지

## 스케치 탭 직행·장소카드 뒤로가기

**상태**: ✅ 사람 QA · 커밋·push

- CTA `{ tab: 'wiki' }` · 탭 전환 push(동일 path no-op)
- ArrowLeft: 이전이 `/place`·`/explore`일 때만 `-1` · 홈·미기록이면 `/explore` (홈으로 빠지던 문제 수정)
- 로그북 `←`는 기존 고정(`/blog` 등) 유지 — 장소카드 로직 미적용·변경 불필요(확인)

## MRT 숙소 — hub 명소 parentCity 키워드

**상태**: ✅ 사람 QA · 샘플 LIVE 이상 없음 · 커밋·push (`92b8a97`)

- 원인: `resolveMrtStayQuery`가 `parentCity` 미사용 → 랜드마크명만 검색·CITY 미매칭
- 수정: 국내 hub 명소는 `parentCity` 선두·cityHints · 동·읍·면도 시·군 폴백 (전 hub 명소 공통)
- 스모크: `mungyeong` / `mungyeong-saejae` · 샘플 LIVE(문경·부산·안동·경주·강릉·파리 등) NO_REGION 0
- 릴리스 노트: 사용자 생략

## 오케스트레이터 — 커밋 게이트=검증 (v2.3)

**상태**: ✅ 문서 · Cursor User Rule 추가

- 원인: 「요청 시만 commit」이 Cloud에서 VERIFY PASS 후에도 미커밋 이관·PR 부재를 유발
- **의도 재확인**: 스모크/테스트 없이 깨진 로직 커밋·푸시 방지. **이상 없으면 요청 없이 커밋 OK**
- Cursor User Rules: 「verification gate」·「release notes major only」·「Code comments — sparse」 추가
- 릴리스 노트 **1.7**: 새 기능·중대 업데이트만 초안 제안
- **§4.0 폐기 명시**: git 이력상 초기 Core Rules = 「논리적 구조 제안→승인 대기→전체 코드 제공」(제미나이 복붙). 주석 남발은 그 잔재. 현재 §4.2 희소 주석 · 사람에게는 동작·QA
- SSOT: `.ai-context` **1.5.1**/**1.7**/**4** · method **v2.3 §3.4** · Rules

## 세션 종료 (2026-07-24) — 에이전트 규칙 정리

- 스케치 wiki 직행·장소카드 ← · hub 명소 숙소 `parentCity` — QA 완료 · `main` `92b8a97`
- **규칙**: 커밋=검증 게이트 · Cloud 오케 §3.4 커밋·PR · 릴리스=중대만 · §4.0 제미나이 Core Rules 폐기 · 주석 희소
- Cursor User Rule: verification gate · release notes major only · comments sparse
- 릴리스 노트 생략(문서/규칙만) · 다음: 여행 스케치 매거진 탭 QA / 항공 Heuristic Phase 0

## 규칙 정합 검증·반영 (Cursor)

**상태**: ✅ 문서·User Rule

- 클로드/Roo 전용(`.ai-claude-context`·§7) **재도입 불필요** — 이미 삭제·흡수됨
- §4.0 **압축**(표·Claude 역사 문구 제거) · §4.1에 **오류 루프 2회 중단·범위 고정** · 커밋은 **게이트 우선**
- User Rule: verification gate가 「요청 시에만 commit」**SUPERSEDES** · 신규「Stop loops / no scope creep」· comments sparse 동기화
- SSOT: `.ai-context` **1.5.1**/**4** · `AGENTS.md` · `gateo-project-context.mdc`
- **보류(낮음)**: `.ai-context` 3·5·6절 분량 trim(~381→목표250)

## GYG 투어 위젯 — 다음 세션 핸드오프 (검토만 · 미구현)

**상태**: ⏳ 제시어로 이어하기 · 코드 변경 없음

- 클룩 Play 배너(`KlookTourBannerWidget`)는 검색 매칭이 자주 빗나감 → GYG **Manual Activities + Search**로 교체 방향 합의
- 라로통가 확정 embed: `data-gyg-q="Rarotonga, Cook Islands"` · `ko-KR` · items `3` · `cmp=gateo_planer_rarotonga` · partner `LRKVVU4`
- 시티 ID(참고): Rarotonga **`2689`** · Auto/`data-gyg-widget="auto"` · Specific URLs · City 전면 매핑은 **비추천**
- analyzer 스크립트는 `index.html`에 이미 있음 — 재삽입 금지
- 기존: `GetYourGuideCityWidget` + `GYG_CITY_CONFIGS`(소수 location-id 폴백) · `ToolkitCard` `map_poi`

## GYG Activities 위젯 — 플래너 map_poi

**상태**: ✅ 사람 QA 통과 (미야코지마·라로통가)

- `GetYourGuideActivitiesWidget` — Manual Activities + Search (`ko-KR` · items 3 · `cmp=gateo_planer_{slug}`)
- `ToolkitCard` map_poi: q 가능 → Activities 우선 · City/`GYG_CITY_CONFIGS` · Klook 최후
- **q**: 영문 도시명만 (`Miyakojima` / `Rarotonga`) — `"…, Japan"` 형태는 인기 투어 혼입
- QA: 미야코지마(거북이·니모 스노클링, SUP, 입문 스쿠버) · 라로통가(거북이 수영·서핑·거북이 투어)
- 복사: iframe 본문 선택 불가 · 검색어 버튼으로 `q` 복사
- 참고 시티 ID: Rarotonga `2689` · Miyakojima `160504`
