# 2026-07-25 프로젝트 일지

직전: [`2026-07-24-project-log.md`](./2026-07-24-project-log.md)

## 오키나와 ↔ 미야코지마·SHI 정체성 P0

**상태**: ✅ audit PASS · 브랜치 커밋 (`38582a0`) · 사람 QA 대기

- **증상**: 오키나와 플래너가 미야코 정보·항공 SHI로 바뀜 (시네마는 OKA처럼 보이다가 플래너 후 변경)
- **원인**: (1) SSOT에 `okinawa` slug 없음 (2) 별칭 `오키나와`→`ishigaki` (3) `placeIds["오키나와"].linkedSlug=miyakojima` → curated SHI 우선
- **수정**: slug `okinawa`(OKA) 추가 · 별칭/툴킷동의어→okinawa · placeIds linkedSlug=okinawa · 미야코/이시가키 keywords에서「오키나와」제거
- **검증**: `npm run audit:airports` none:0 · resolve 오키나와→OKA / 미야코→SHI / 이시가키→ISG
- **QA**: 검색「오키나와」→ 플래너 제목·본문 본섬 · Trip/배너 `OKA` 유지 · 미야코·이시가키 회귀 · 옛 툴킷이면 Force Update Toolkit
- **머지**: `main` `d9b6491` (gh 미인증으로 PR 대신 merge-push) · Vercel 배포 트리거됨
- **재발 가드**: `audit:airports` — `linkedSlugIataClash` WARN + 류큐 identity smoke FAIL(OKA/SHI/ISG)

## linkedSlug IATA clash WARN 정리

**상태**: ✅ `linkedSlugIataClash: 0` · `none: 0` · 류큐 smoke OK · `main` 머지·푸시

- **브랜치 규약 명시**: `.ai-context` **1.5.2** — 짧은 수정은 `main` 직행 · 대형/장기만 feature+PR

| placeId | 조치 |
|---------|------|
| 구마모토 / kumamoto | spots+placeId override **KMJ** (toolkit OIT 오탐) |
| 다윈 / Darwin | 호주 **DRW** hub 추가 · placeIds-only · galapagos에서 분리(다윈섬만 유지) |
| 맥머도·맥머도기지 | antarctica allow에 **CHC** (USH 크루즈 + CHC 기지) |
| 일룰리사트 | alias/override → **greenland**(CPH/GOH) · iceland(KEF) 해제 |

**검증**: `npm run generate:airports` → `npm run audit:airports`

## 일룰리사트 장소카드 — greenland 편입 해제

**상태**: ✅ audit PASS · `citiesData` slug `ilulissat`로 검색 진입

- **증상**: 검색「일룰리사트」가 그린란드(`greenland`) 장소카드로 열림
- **원인**: `f5bc1e7` 공항 clash 정리 때 place-id alias·toolkit synonym·reconcile `mergeFrom`이 일룰리사트→greenland로 강제(장소카드 slug까지 붕괴). `linkedSlug`는 공항만 영향.
- **조치**(다윈 분리와 동일): alias/synonym/merge 제거 · 공항은 placeIds-only CPH/GOH(KEF 금지, `linkedSlug` 없음) · `citiesData` `ilulissat`가 Enter 경로에서 선택
- **검증**: `generate:airports` · `audit:airports` none:0 · linkedSlugIataClash:0 · resolve 일룰리사트→cities/`ilulissat` · 그린란드→`greenland` · 아이슬란드→`iceland`
- **QA**: 검색「일룰리사트」/Ilulissat → 아이스피오르드 설명 카드 · 「그린란드」는 기존 국가 카드 · 배너 공항 CPH/GOH(아이슬란드 KEF 아님)

## 다윈 — 「다윈섬」별칭 strip으로 galapagos 잔존

**상태**: ✅ resolve 검증 · 커밋

- **f5bc1e7 대상 목록**: 구마모토(KMJ) · 다윈(DRW·galapagos 분리) · 맥머도(CHC·antarctica) · 일룰리사트(당시 greenland·이후 장소카드 분리)
- **증상**: 별칭 `다윈` 제거 후에도 검색「다윈」→갈라파고스
- **원인**: 별칭 `다윈섬`→galapagos 등록 시 `placeIdVariants`가 `섬` strip으로 **`다윈`까지 force 매핑**
- **조치**: 별칭 등록만 `stripGeoSuffix: false` (`travelSpotResolve` · scripts lib)
- **검증**: 다윈/Darwin→cities/`darwin` · 다윈섬·갈라파고스→`galapagos` · 일룰리사트 회귀 OK

## 리마·아디스아바바·맥머도 — 상위 여행지 카드 편입 해제

**상태**: ✅ audit PASS · resolve 검증 · 커밋

- **증상**: 리마→마추픽추(~500km) · 아디스→랄리벨라(~335km) · 맥머도→남극 대륙 — 관문/권역 별칭으로 장소카드 붕괴
- **조치**: place-id alias·toolkit synonym·reconcile merge 제거 · placeIds-only 공항 LIM/ADD/CHC · cities 단축명 매칭(`맥머도`↔기지, `McMurdo`↔Station strip)
- **검증**: 리마/Lima→`lima` · 아디스→`addis-ababa` · 맥머도→`mcmurdo-station` · 마추픽추·랄리벨라·남극 대륙 본명 유지 · `audit:airports` none:0 · clash:0
- **잔여**: 「남극해」→antarctica 별칭은 유지(이번 요청 범위 외)
- **QA**: 검색 세 도시 = 각 cities 설명 카드 · 마추픽추/랄리벨라/남극 대륙 검색은 기존 SSOT

### 후속 — 맥머도 검색 불가

**상태**: ✅

- **원인**: UI Enter는 `requireChoice`인데 cities 단축명 매칭·suggestions에 cities 미포함 → 「맥머도」미스
- **조치**: `citiesSearch.js`(`findCityBySearchQuery`) · requireChoice/일반 경로 공용 · `buildLocalSearchSuggestions`에 cities 제안 추가

## 관문 별칭 5곳 장소카드 분리

**상태**: ✅ audit PASS · resolve 검증

| 검색 | 이전 | 이후 |
|------|------|------|
| 파타야 | phuket | cities `pattaya` (BKK) |
| 시엠립 | angkor-wat | hub `siem-reap` (SAI) |
| 앵커리지 | alaska | hub `anchorage` (ANC) |
| 나하 | okinawa | cities `naha` (OKA) · hub alias·spot keywords에서 나하 제거 |
| 다윈섬 | galapagos | cities `darwin-island` (GPS/GYE) |

- reconcile: miyakojima←오키나와 merge 제거 · 상위 mergeFrom 정리
- **QA**: 각 검색어=독립 카드 · 푸켓/앙코르/알래스카/오키나와/갈라파고스 본명 유지

## 국내 「투어 찾기」→ MyRealTrip TNA

**상태**: ✅ Edge 배포 · LIVE 스모크 PASS · `main` `ca96f77` (push는 사람 요청 시)

- **증상**: 국내 명소 GYG 오탐(해외 투어)
- **조치**: 국내=`fetch-mrt-tnas`(`tna/search`) 카드 목록 · 해외=GYG 유지 · 플래너 map_poi 동일 분기
- **파일**: Edge `fetch-mrt-tnas` · `mrtTnaQuery.js` · `fetchMrtTnas.js` · `MrtTnaActivitiesWidget` · `GlobeTourStrip` · `ToolkitCard`
- **검증**: `npm run smoke:mrt-tna` · `MRT_TNA_SMOKE_LIVE=1` (제주·부산·성산·경복궁·문경 `n>0`)
- **배포**: `npx supabase functions deploy fetch-mrt-tnas --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`
- **QA**: 국내 명소「투어 찾기」= MRT 한국 상품 · 오사카 등 해외=GYG · 숙소 탭과 상호배타

## 국내 TNA — 양구·두타연 오탐 + 인근 확장

**상태**: ✅ 사람 QA · UI 확정 · push

- **원인**: MRT에 양구/두타연 실재고 거의 없음 · `두타연`→「연」부분일치 · `양구`→중국 노산 동명 · 영문 `Valley`→해외 와인투어
- **조치**: Edge 관련도 필터·해외 노이즈 거절 · 국내 영문 name_en 래더 제외 · hub `yanggu` 인근(춘천·인제·설악·속초) 확장 + UI 안내
- **검증**: `MRT_TNA_SMOKE_LIVE=1 npm run smoke:mrt-tna` · yanggu-dutayeon `used=춘천`
- **QA UI**: 인근 안내 문구·더보기 여백 · 써머리「투어 찾기」탭 시인성 한 단계 상향

## 국내 명소 항공 경로 — ICN↔GMP·PVG↔SHA 오탐

**상태**: ✅ smoke PASS · `main` `c0660a5` · 후속 본토 국내선 억제

- **증상**: 가평·이천 등 수도권 명소에 `ICN→GMP`(및 PVG↔SHA) 항공 경로 노출
- **원인**: rental hub 최근접이 GMP/SHA로 잡히고, 동일 메트로 OD를 시네마가 허용
- **조치**: `areMetroCoterminalAirports` — coterminal OD는 `canPreviewFlightRoute` false

## 국내 명소 항공 경로 — 본토 국내선(YNY/PUS/WJU) 오탐

**상태**: ✅ smoke PASS · `main` `f4a27ca`

- **증상**: 동해 무릉계곡·영금정·고성통일전망타워·화진포=`ICN→YNY` · 민둥산=`ICN→WJU` · 창원 주남=`ICN→PUS`
- **조치**: `isKoreaMainlandDomesticFlightOd` — 본토↔본토 국내선 시네마 숨김 · **제주(CJU)만 유지** · 해외출발(PVG→PUS) 유지
- **검증**: `npm run smoke:flight-route-baseline` 23/23
- **QA**: 위 명소·부산 = ICN 출발 시 항공 경로 없음 · 성산일출봉 = ICN→CJU

---

## 장소카드 관문 편입 분리 — 세션 종료 핸드오프

**상태**: ✅ `main` push (`f32fd06..facc1d4`) · 세션 종료

| SHA | 내용 |
|-----|------|
| `4f54847` | 일룰리사트 ← greenland 해제 |
| `2e59446` | 다윈섬 strip → 호주 다윈 오매핑 방지 |
| `6e74a8d` | 리마·아디스·맥머도 상위지 해제 |
| `a269b6e` | 맥머도 requireChoice·cities 제안 |
| `a2571ba` | 파타야·시엠립·앵커리지·나하·다윈섬 분리 |
| `f316836` | 나하→오키나와 좌표스냅 회귀 — hub `naha` + cities `uiPlace` |

**원칙**: 장소카드 정체성 ≠ 공항 관문. 공항은 placeIds-only 유지.

**잔여(범위 외)**: 「남극해」→`antarctica` 별칭 유지.

## 나하→오키나와 좌표스냅 회귀

**상태**: ✅ audit PASS · `f316836` · **push 완료** (`facc1d4`)

- **증상**: alias/keywords 제거 후에도 검색「나하」장소카드가 오키나와로 바뀜
- **원인**: cities·`/place/naha` hydrate에 `uiPlace` 없음 → `mergeCanonicalTravelSpot`이 coords(~24m)로 `okinawa` 풀머지
- **조치**: hub `naha` · cities hydrate `uiPlace:true` · city Enter `uiPlace:false` 제거
- **검증**: `audit:city-attraction-hubs` issues:0 · `/place/naha`→나하 · OKA
- **세션 종료**: `main` push `f32fd06..facc1d4` (관문 분리 일괄 + 나하 회귀)

## 로고패널 버킷리스트 → 홈 써머리 카드

**상태**: ✅ `4e08f22` · 사람 QA OK · push 포함

- **변경**: 버킷리스트 클릭이 `navigateToPlace`(/place 확장) 대신 `handleLocationSelect`(홈 써머리) — 숙소·투어·항공·3D투어 진입

## 써머리 CTA 2티어 시인성

**상태**: ✅ 사람 QA 확정 · push

- **Tier A**: 숙소 fill/border/shadow 상향 · 투어 글로우 소폭 완화(동급)
- **Tier B**: 항공 = 가까이보기와 동일 패턴(sky) · 3D Cuboid·테두리 상향
- **세션 종료**: `main` push (버킷리스트 + 써머리 CTA)

## 숙소·투어 모달 UI (헤더·4열·닫기·경계)

**상태**: ✅ 사람 QA OK · `09314f3` · **push 완료** (`f70be98`)

- 투어 안내 띠·국내 API 툴바(MRT 보기·정렬·그리드) · 숙소/투어 PC 기본 4열
- 닫기 흰 테두리·PC `mr-10` · 모달 전체 테두리 · 열림 시 써머리 z↑·닫기 탭(숙소·투어)
- **세션 종료**: `main` push `2563dce..f70be98`

## 써머리·검색 — 무니 인트로 통일

**상태**: ✅ 사람 QA OK · `3a3d082` · **push 완료**

- **통일**: SSOT 하드코딩 desc도 `place_chat_intro` hydrate (`placeChatIntroApplied`) · URL sync overlay가 intro 유지
- **검색 카드**: intro 3줄 클램프·고정 높이·시인성 더보기 (정렬)
- **세션 종료**: `main` push `d16c738..3a3d082`

## 국내 TNA 인근 확장 — 스펙 합의 · 다음 세션

**상태**: ⏳ 문서만 · **미구현** · 계획 [`mrt-tna-nearby-expand-plan.md`](./mrt-tna-nearby-expand-plan.md)

### 조사 요약 (문경석탄박물관)

- 상위지 우선 래더는 이미 동작(`문경` 먼저). Edge는 **관련도 >0이면 중단** → 문경 **1건**에서 끝.
- LIVE: `문경` 관련도 1 · 클룩「문경 투어」4건 중 유의미≈경북투어패스 1 · 트립「90」은 POI 안내 위주 → OTA 목록 대체 비권장.
- 숙소 `MRT_STAY_LOW_COUNT=5`는 Trip **CTA** · 투어 인근과 별개.

### 합의

| 항목 | 결정 |
|------|------|
| 게이트 | 상위 결과 **≤3**일 때만 인근 |
| 효율 | 명소명 연쇄보다 **인근 키워드** (상위 1회 → 첫 인근 → 더보기로 다음) |
| 더보기 | **앱 안** 다음 인근 fetch (외부 링크 아님) |
| 선택 UI | 후속 칩 — 같은 SSOT |
| **다음 세션 첫 일** | **인근 도시 목록(Phase 0)부터** — 구현(1+2)은 목록 후 |

시드 예: `mungyeong: ['안동','단양']` · 기존 `yanggu` 유지.

### 에이전트 핸드오프 — 다음 세션

**읽을 것 3**: 본 절 · [`mrt-tna-nearby-expand-plan.md`](./mrt-tna-nearby-expand-plan.md) · `mrtTnaQuery.js`의 `MRT_TNA_NEARBY_EXPAND`  
**금지 3**: 전국 자동 이웃 · 클룩/트립 목록 API 대체 · 숙소 CTA(`5`)와 임계 혼동  
**제시어**: 아래 「MRT-TNA-인근확장-이어하기」 블록.

---

## 국내 TNA 인근 확장 — Phase 0 초안 → Phase 1

**상태**: ✅ Phase 1 · Edge `fetch-mrt-tnas` 재배포 · B표·Phase 2 더보기 후속

### Phase 0 LIVE 요약

- 문경 → `['안동','단양','상주']` (예천 n=0 제외) · 양구 시드 유지 · n≈0 키워드 금지(계획 §D)
- A표(~24 hub) 1차 반영 · B표 미반영 · 원주=인근만

### Phase 1 구현

- `MRT_TNA_NEARBY_EXPAND` A표 · 인근은 상위 래더와 **분리**
- Edge: 상위 관련도 **≤3**이면 `nearbyKeywords[0]` 검색·gid 머지 · `nearbyExpanded`
- 클라 `fetchMrtTnas` v3 캐시 · `nearbyKeywords` 전달
- **검증**: `npm run smoke:mrt-tna` · LIVE 문경 `used=안동 nearbyExpanded primary=1` · 양구 `used=춘천 primary=0`
- **배포**: `npx supabase functions deploy fetch-mrt-tnas --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`

### 다음 (Phase 2)

- 「인근지역 더보기」앱내 다음 인근 키워드 · 칩 후속 · B표는 필요 시 추가

### 에이전트 핸드오프 — Phase 2

**읽을 것 3**: 본 절 · [`mrt-tna-nearby-expand-plan.md`](./mrt-tna-nearby-expand-plan.md) §1 UX C · Phase 1 커밋 `814d5bb`  
**금지 3**: 전국 자동 이웃 · 클룩/트립 목록 대체 · Phase 3 칩 선행 · 숙소 CTA(`5`)와 임계 혼동  
**제시어**:

```text
MRT-TNA-인근확장-이어하기

@plans/mrt-tna-nearby-expand-plan.md
@plans/2026-07-25-project-log.md

목표: Phase 1(≤3·첫 인근 자동보강) 위에 Phase 2 「인근지역 더보기」만.

읽을 것:
1) 계획 §1 UX C·문경 시드 · §2 Phase 2
2) 일지「국내 TNA 인근 확장 — Phase 0 초안 → Phase 1」
3) MrtTnaActivitiesWidget · fetchMrtTnas · mrtTnaQuery MRT_TNA_NEARBY_EXPAND

이번 턴:
- nearbyExpanded일 때 「인근지역 더보기」버튼 (앱 내 다음 nearbyKeywords[i] fetch·목록 append/교체)
- 소진 시 숨김/비활성 · 문경: 안동 보강 → 더보기→단양→상주
- 스모크(+LIVE) · 양구 회귀 · n≥4 hub는 버튼 없음
- 디자인·카피는 사람 QA 후 커밋(검증 게이트)

금지: 칩(Phase 3) · B표 일괄 · OTA 목록 API · Edge 불필요 재설계(이미 nearbyKeywords[0] 보강됨)
```