# 2026-07-20 프로젝트 일지

이전: [`2026-07-19-project-log.md`](./2026-07-19-project-log.md)

## place_wiki 매거진 — 잘못된 슬러그·아카이브 복원

**상태**: ✅ DB 복원 적용 · 별칭 우선순위 수정 · 커밋 대기

- **원인**: slug-first 마이그레이션 시 관문 `keywords`(울루루→alice-springs, 친퀘테레→la-spezia, 파타고니아→el-calafate, 하와이→honolulu)가 공식 `spot.name` 별칭을 덮어씀 → 빈 slug 껍데기가 승자, 원본 매거진은 `place_wiki_archive`로 밀림. 탭에서 비어 보여 「매거진 생성」이 돌아감.
- **별칭 수정**: `buildStaticAliasToSlugMap` · `buildSpotLookup` — keywords < 공식명 < 명시 aliases. `travel-spot-place-id-aliases.mjs`에 울루루·친퀘테레·파타고니아·하와이 고정.
- **복원** (`npm run restore:place-wiki-archive -- --apply`): 로마·쿠알라룸푸르·울루루·친퀘테레·파타고니아·아이투타키·포클랜드·하와이 → 공식 slug. 비-SSOT `australia` 행 아카이브 후 삭제.
- **마이그레이션 방어**: `migrate-place-id-to-slug` 승자 선정에 매거진 본문 점수 우선.
- **아직 매거진 없음(신규 생성 대상)**: malta, vatican, ubud, brunei, minneapolis, bahamas, sri-jayawardenapura, el-calafate 등.

## Smart Search — 횡성 저수지 등 Nominatim 미매칭

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시 `6520201`

- **증상**: AI가 「횡성호」로 교정·좌표 파싱해도 연결 실패 · Explore「컬렉션에 없는 키워드」잔류 · `search_dictionary` 406.
- **원인**: Nominatim에 횡성호 없음 → `verifyAndNormalizeCandidate`가 forward 실패 시 null · `.single()` 0건 406 · 한글 쿼리 해외 오탐. (며칠 전엔 캐시·검증이 맞아 동작)
- **조치**: AI 좌표 + 역지오 폴백 · `maybeSingle` · 한글 KR 우선·highway/해외 오탐 필터.
- **문서**: [`travel-spots-management.md`](./travel-spots-management.md) §8 Smart Search 폴백.

## 지구본 자유 탐색 — POI 라벨 + 스냅 완화

**상태**: ✅ 구현 · 사용자 확인 · 커밋·푸시 `6520201`

- **스냅**: 바다·무지명 시 전역 nearest SSOT 스냅 **제거** → tier km curated만, 아니면 클릭 좌표 `uiPlace`(`좌표 탐색`). 줌≥4 마커 hit 32→14px.
- **라벨**: `POI_LABEL_MIN_ZOOM=5.5` — 저줌 깨끗 / 고줌 POI·natural·landmark 표시·클릭 → 기존 uiPlace PlaceCard.
- **역지오**: Nominatim zoom=14 · industrial/natural feature명 우선. 요약 카드 uiPlace 안내 문구.
- **문서**: [`travel-spots-management.md`](./travel-spots-management.md) §8 클릭 우선순위·줌 게이트.

## 검색바 자유 탐색 — 홍천 휴게소→홍천군 스냅

**상태**: ✅ 사용자 QA 통과 · 커밋 `0094711`

- **증상**: 지구본은 세부 POI 클릭 가능하나 검색은 상위 여행지/행정구역으로 묶임 (예: 홍천 휴게소 → 홍천군).
- **원인**: Nominatim 미매칭 → AI·캐시가 군으로 교정 · 검색 성공 시 `resolveTravelSpotFromCoords` 스냅.
- **조치**: Mapbox forward 우선 · 검색 coord 스냅 제거(이름 SSOT만) · `isFacilityQuery` 행정구역 히트/캐시/AI 축소 거부.
- **무드 큐레이션**: AI mood 프롬프트·캐시 로직 미변경. Mapbox가 감정어를 가로채지 않도록 감정 키워드·문장부호는 geocode 스킵 → mood AI 유지.

## 큐레이션 갤러리 써머리 — 고정 desc에 가려짐

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시 `ae4cca8`

- **증상**: 큐레이션 문구가 카드 오픈 직후 잠깐 보이다 `/place/` sync·SSOT hydrate에 덮여 사라짐.
- **조치**: `curationSummary` 분리 · `overlaySessionCuration`(selectedLocation·slug 캐시) · 갤러리에서 큐레이션 블록과 고정 desc를 시각적으로 분리.

## 테마 검색 회귀 — 반딧불·빙하 문장

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시 `ae4cca8`

- **반딧불**: `isConcept`(keywords `includes`)가 null → Explore `onSearch`가 무조건 홈 이동.
- **빙하를 보고 싶어**: `보고싶` 무드 경로로 AI가 비관련 지역(필리핀) 선택.
- **조치**: SSOT 테마 키워드 큐레이션(`pickThemeCurationSpot`) · 테마 있으면 무드 geocode 스킵 안 함 · 검색 실패 시 홈 강제 이동 제거.

## 살타 등 미등록 uiPlace — 즐겨찾기 국가명 Explore 잔존

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시 `a3810c7`

- **원인**: 살타 미등록(SSOT hydrate 불가) + 재즐겨찾기가 `is_bookmarked`만 토글해 옛 `curation_data.country=Explore` 유지 + 마커가 `curation_data` 국가를 상위로 안 올림.
- **수정**: 재북마크 시 curation 갱신 · 마커/heal lift · placeholder 시 역지오 자가치유 · 전진 지오코딩 국가 한글 정규화.
- **범위**: 살타 전용 아님 — 지구본·검색 **미등록 uiPlace 전반** (SSOT 있는 지점은 기존 카탈로그 hydrate).
- **문서**: [`travel-spots-management.md`](./travel-spots-management.md) **§8.0** · `.ai-context` 3절 uiPlace 국가명 규칙.

## 미등록 uiPlace → MOONi 국가·지명 바인딩

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시 `d2ee569`

- **증상**: 무드/검색으로 연 미등록 지점(예: 일본 구시로)에서 MOONi가 좌표·범용 인사만 받고, 하단 주제 칩·장소 소개가 비활성. 카드에 `구시로`/`(구시로시)` 한글 중복.
- **조치**: `buildMooniBoundSpotFromLocation` · `formatPlaceChatLabel`로 국가+지명 전달 · ChatModal은 slug 없이도 소개·프롬프트·대화 칩(`allowNameBound`) · 플래너만 catalog slug · URL 복원 시 역지오 지명 heal · `getPlaceTitleLines` 한글 행정 변형 보조줄 숨김.
- **문서**: [`travel-spots-management.md`](./travel-spots-management.md) §8.0 MOONi · `.ai-context` uiPlace 한 줄.

## Explore 최근 기록 — AI 없이 직연결

**상태**: ✅ 사용자 QA 통과 · 커밋 `28688a8`

- **증상**: 최근 방문지·키워드 매칭 여행지 클릭이 `handleSearchSubmit`→AI로 재진입. 미등록 uiPlace는 이름만 저장돼 검색창만 채워짐.
- **조치**: [`exploreRecentHistory.js`](../src/pages/Home/lib/exploreRecentHistory.js) — compact `{name,slug,lat,lng…}` 저장 · 카탈로그→`/place/` · uiPlace→지구본 홈(`handleLocationSelect`+`fromSearch`) · 키워드(보라)는 입력만 · 목록별 「전체 삭제」.
- **문서**: [`travel-spots-management.md`](./travel-spots-management.md) §8 Explore 최근 기록 · `.ai-context` Smart Search 한 줄.

---

## MRT 숙소 — 최적화 2차 (모바일 전체화면·국가 매칭)

**상태**: ✅ 사용자 QA(피지·아이투타키·모달 UX) · Edge `fetch-mrt-stays` 재배포 · 커밋·푸시

- **모바일**: 「숙소 찾기」→ 즉시 전체화면 모달(일정+목록). 카드 안 일정·가로 스트립·「N곳 보기」제거. 제목 `{여행지} 근처 숙소`.
- **PC**: 좌측 포털 유지 · 날짜는 버튼+`showPicker`(투명 input만으로는 Chromium 미동작).
- **Edge/클라**: `countryHintAlts`(한·영) · 해외 cityHints 하드거절 완화·state 미포함 — 피지·아이투타키(쿡 제도) 복구.

## MRT 숙소 — UX·size 상한·릴리스 (단일 기간 달력)

**상태**: ✅ 사용자 QA · 커밋·푸시 · 릴리스 `2026-07-20-2`

- **일정**: 체크인·아웃 **한 달력** 기간 선택(1탭 인·2탭 아웃·최대 30박) · OS `type=date` 이중 달력 제거.
- **일정 바 1열**: 아이콘 · 체크인 · **N박** · 체크아웃 · 라벨·MyRealTrip 건수 가독성 상향.
- **모바일 모달**: 목록 스크롤 시 **맨 위** FAB.
- **건수**: `size: 20`(MRT API·Edge 상한) · 클라 캐시 `v6`(12건 캐시 무효화). Edge 재배포 불필요(이미 min(20)).
- **릴리스**: `내 주변·여행지 숙소를 찾고 예약할 수 있어요`.

## MRT 숙소 — 캐시·인원·정렬·가용 우선 목록

**상태**: ✅ 사용자 QA · Edge 재배포 · 커밋·푸시

- **Edge**: region autocomplete **6h** · search **10m** · in-flight dedupe · 가격 있는 숙소 우선·없는 숙소도 유지.
- **클라**: 캐시 `v8` · 기본 성인 2·아동 0 · 일정·인원 **변경하기** 시에만 재조회.
- **UI**: 보름/박수 칩 없음 · 인원 스테퍼 축소 · 정렬(추천·가격·평점) · 「일정 조정 시 예약」 섹션.
- **릴리스**: `2026-07-20-3`.

## MRT 숙소 세션 — 에이전트 핸드오프

**상태**: ✅ **캐시·변경하기·가용 우선·정렬 · Edge 재배포 · 커밋·푸시**  
**선행**: 4.1 ✅ · 1차 ✅ · 2차 ✅ · UX/size ✅ · 본 세션 ✅

### 유지 (현재 기준)

- Summary **「숙소 찾기」** · 펼칠 때만 fetch (`v8` · `size` 20).
- **PC** 좌측 포털 · **모바일** 전체화면 모달.
- Edge: countryHint(+Alts) · cityHints · **region 6h / search 10m / dedupe** · **가용(가격) 우선 · 비가용도 유지**.
- 일정·인원: 기본 +14·2박 · 성인 2·아동 0 · 초안 편집 후 **변경하기** 1회 재조회.
- 목록: 클라이언트 정렬(추천·낮은/높은 가격·평점) · API 재호출 없음.

**파일**: `GlobeStayStrip` · `fetchMrtStays` · `fetch-mrt-stays` · `releaseNotes.js`.

### 금지 3

1. `VITE_` MRT 키 · 브라우저 직호출
2. TripLink · `mrt-link-generator` 병행 · 다날짜 자동 가용성 스캔
3. 호텔 핀/지오코딩 · `travelSpots.js` 전체 스캔 · spots 직접 수정

### 다음 세션 (선택)

빈 결과 CTA 보강 · 그리드/이미지 밀도 · PC 패널 inset · 배포 후 지속 QA.

## 지구본 3D 투어 — 종료 시 top-down 카메라 전환 제거

**상태**: ✅ 사용자 QA 통과 · 커밋

- **증상**: 3D 투어 마지막에 카메라가 위에서 내려다보는 각도로 바뀜.
- **원인**: `TOUR_READY` 진입 시 `loadReachBoundaries` → `easeCameraForReachReveal`(pitch↓).
- **조치**: 투어 종료 reach 로드에 `{ easeCamera: false }` — 마지막 오빗 pitch/bearing 유지.
