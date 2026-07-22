# 2026-07-21 프로젝트 일지

이전: [`2026-07-20-project-log.md`](./2026-07-20-project-log.md)

## 지구본 — 권역 클러스터 2D 고줌

**상태**: ✅ QA 확인 · 커밋·푸시

- 2D 고줌에서도 권역 경계선·리스트 유지 사용.
- 면 채움(hull fill) 제거 — 점선 경계·POI만.
- PC 권역 리스트 박스·텍스트 `md:` 확대.
- PC 권역 박스를 연관 키워드 좌측 레일 **아래** 슬롯으로 이동 (하단 밀착 해소).

## 지구본 — 몰입 버튼·포커스 자전 지연

**상태**: ✅ 코드 · 릴리스 노트 · 커밋·푸시 · **줌 8.5(시가지) 추가 조정**

- 카드 오픈은 `flyZoom` 지향만 유지(자동 깊은 확대 없음). 플라이 후 자전 재개 **~2.8초** 지연.
- 써머리 액션「이 지역 보기」↔「넓게 보기」(`immerseZoom` **8.5** · pitch 35). 닫기·장소 전환·투어/시네마 시 몰입 해제.
- 조절바는 도입하지 않음(고정 몰입 줌).

### 몰입·항공 버튼 이슈

**상태**: ✅ 코드 · QA 통과 · 커밋·푸시

- 채팅 닫은 뒤 「이 지역 보기」무반응 — `immerseToPin` **pause 가드 제거** · 잔여 `tourActiveRef` 정리 · `wakeAfterOverlay`
- 줌마다 「항공 경로」준비 중 — **레이어 latch** · 폴링에서 `isStyleLoaded` 제거 · flight label POI 제외

### 모바일 써머리 — 숙소 그리드·몰입 컴팩트

**상태**: ✅ QA 확인 · 커밋·푸시

- 「숙소 찾기」모바일 `col-span-2` 해제 → PC와 동일 1칸 2열 그리드
- 「이 지역 보기」시 모바일만 TourMobileBar형 컴팩트 바 · 스크림 끔

### 몰입 줌 ×2 / ×4

**상태**: ✅ QA 확인 · 커밋·푸시

- 「이 지역 보기」진입 zoom **6** · ×2/×4는 **현재 줌 누적**(+1/+2) · 재클릭 후퇴 없음
- 카드 닫기(모바일·PC): 줌 유지(`clearImmerseState`) · 「넓게 보기」로만 원상복구
- 모바일 몰입 바: ×2/×4 확대 · 장소명·버튼 간격 여유 · X→장소카드 복귀 · 카드에는 ×2/×4 없음·「넓게 보기」만

## 홈 검색 — POI 포커스 + 그 지점 숙소

**상태**: ✅ 코드 · 릴리스 노트 반영 · 커밋·푸시

- **증상**: 성산일출봉→제주/서귀포 · 신라호텔→시청 · 대명콘도 숙소→부산
- **조치**: 검색 SSOT 엄격 · 테마 후순위 · uiPlace 풀머지 금지 · 숙박 별칭 geocode · 시청 교정 거부 · 숙소 `비발디파크`+`홍천` cityHints
- **릴리스 노트**: `2026-07-21` 「검색으로 세부 장소까지 찾고, 그곳 숙소도 볼 수 있어요」

## MRT 숙소 — 일부 여행지 빈 결과·미매칭

**상태**: ✅ 클라·Edge 수정 · Edge 재배포 · LIVE QA 통과

- **증상**: 하와이·괌·발리·사이판 등에서 숙소 없음/호출 실패처럼 보임. MRT에는 재고 있음.
- **원인**
  1. `countryMatches` `startsWith` — `인도네시아`↔`인도` 오탐(발리→라자스탄)
  2. gateo 영토 국가(`하와이`) vs MRT head(`미국, 하와이`) 불일치
  3. `북마리아나 제도`↔`북마리아나제도` 공백
  4. 괌 키워드→망길라오(재고 0) · 발리 동명 · 파타고니아 박물관 POI
  5. 일부 지역 `totalCount>0`인데 `productUrl` 없어 items 전부 탈락(레위니옹·바릴로체 등) — Edge 매핑 폴백
- **조치**: `mrtStayQuery.js` 국가 별칭·slug 키워드 오버라이드 · 캐시 `v9` · Edge compact/세그먼트 매칭·startsWith 제거·URL 합성 · `scripts/smoke-mrt-stay-queries.mjs`
- **배포**: `npx supabase functions deploy fetch-mrt-stays --project-ref phdjnbfitvmrguqzverm --no-verify-jwt` ✅ (2026-07-21)
- **LIVE(배포 후)**: 하와이·호놀룰루·괌·발리·사이판·레위니옹·파타고니아(바릴로체)·그린란드 모두 `n>0`

### 에이전트 핸드오프

- **유지**: Summary「숙소 찾기」·펼칠 때만 fetch · `v11` · PC 포털/모바일 전체화면 · 빈 결과 Trip.com CTA · `npm run audit:mrt-stays`
- **금지**: `VITE_` MRT 키 · TripLink · 호텔 핀/지오코딩 · `travelSpots.js` 전체 스캔 · Trip.com 스크래핑
- **다음**: 써머리 TNA 스트립 (Edge 재시도는 전수 감사 절에서 배포)

## MRT 제휴 — 마이링크 URL 파라미터 재정립

**상태**: ✅ 코드 · 사용자 QA 확인 · 커밋·푸시

- 홈 단축 `fOey96` → `mylink_id=2640202` SSOT (`mrtPackageThemeLinks.js`)
- 플래너「숙소 실시간 검색」: `getMrtSearchUrl` (www `/search` + mylink)
- 플래너 숙소 툴킷(지역별·한인민박): `getMrtAccommodationSearchUrl` → `accommodation…/union/products` + mylink
- 숙소 카드 상세 `productUrl`에도 `buildMrtMylinkUrl` 부착. 탐색 패키지 단축 유지.
- Edge `mrt-link-generator` 클라 호출 제거(파일 미삭제 · 후속 폐기).

## 다음 세션 — 써머리 TNA 스트립 + 패키지 딥링크 (합의만)

**상태**: 📋 계획 확정 · 미구현

- **혼합**: 써머리「투어·티켓」카드 스트립 = Partner `tna/search`(분당 200, 숙소 50과 **별도**) + 패널 내「패키지 더보기」=`/pkc/search?q=` + mylink (`/pkc` 목록 API 없음).
- 숙소찾기 UX 미러 · 펼칠 때만 fetch · `VITE_` 키 금지 · 탐색 테마 단축 유지.
- 계획: Cursor plan `tna_스트립_혼합` · 제시어는 세션 종료 메시지 참고.

## 홈 검색 — 에펠탑→파리·동명 도로 오탐

**상태**: ✅ QA 확인 · 커밋·푸시

- **증상**: 에펠탑 → 파리 SSOT · 이후 `Eiffel Tower Street`(필리핀)
- **원인**: `KEYWORD_SYNONYMS` 명소→도시 · Mapbox 동명 도로 우선
- **조치**: 명소→도시 동의어 제거 · `resolveLandmarkGeocodePlan`(`Tour Eiffel, Paris`+`country=fr`) · Street 페널티 · `types=poi`
- **파일**: `keywordData.js` · `geocoding.js`
- **릴리스 노트**: `2026-07-21-3`

## 숙소 찾기 목록 그리드 밀도 토글

**상태**: ✅ QA 확인 · 커밋·푸시

- 정렬 옆 `LayoutGrid` 아이콘 토글 — 모바일 2↔1열 · PC 5↔3열(확대)
- **파일**: `GlobeStayStrip.jsx`

## MRT 숙소 — 우유니·라자암팟·버뮤다·베네수엘라 + 전수 LIVE 감사

**상태**: ✅ 클라·스크립트 · PR #3 머지 · 전수 오버라이드 main 반영 · Edge 재배포 · LIVE 통과

- **PR #3 (모바일 머지, 문제 없음)**: 우유니·라자암팟·버뮤다 매칭 + 빈 결과 Trip.com CTA + Edge 재고 0 region 재시도 — squash `1c66407`
- **머지 누락분(클라우드 tip `a20bf16`)**: travelSpots **272곳** LIVE 감사 스크립트·오버라이드 보강 — 데스크톱에서 main 반영
- **증상·조치 (1차)**
  1. 우유니: 「우유니 소금사막」autocomplete 미매칭 → CITY「우유니」
  2. 라자 암팟 → 와이사이 · 버뮤다 → 패짓 · 베네수엘라 MRT 미취급 → Trip.com CTA
- **전수 감사**: `scripts/audit-mrt-stay-coverage.mjs` · `npm run audit:mrt-stays` (+ `MRT_STAY_AUDIT_LIVE=1`)
  - 1차 OK 235/272 → 오버라이드 후 **257/272**(Fail 15·원격·미취급)
  - 홍콩·마카오·바티칸·튀르키예·피피·시밀란·안다만·갈라파고스·사하라 등 · 캐시 `v11`
- **배포**: `npx supabase functions deploy fetch-mrt-stays --project-ref phdjnbfitvmrguqzverm --no-verify-jwt` ✅ (2026-07-22)
- **LIVE(재배포 후)**: 하와이·괌·발리·사이판·레위니옹·파타고니아·우유니·라자암팟·버뮤다·홍콩·마카오·보드룸 `n>0` · 베네수엘라 `NO_REGION`(CTA)

### 에이전트 핸드오프

- **유지**: Summary「숙소 찾기」·펼칠 때만 fetch · `v11` · 빈 결과 Trip.com CTA · `npm run audit:mrt-stays`
- **금지**: Trip.com 스크래핑·호텔 목록 API 가장 · `VITE_` MRT 키 · `travelSpots.js` 전체 스캔
- **다음(선택)**: Fail 15용 `PLANNER_TRIPCOM_HOTEL_OVERRIDES` city ID · 써머리 TNA 스트립
