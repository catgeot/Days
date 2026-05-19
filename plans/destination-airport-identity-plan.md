# 여행지 정체성·도착 공항 정합 계획

**작성**: 2026-05-18  
**배경**: Trip.com 항공 배너 연동 후, 진입 경로(지구본·검색·지오코딩)마다 `place_id`·slug·IATA가 어긋나는 사례가 확인됨.  
**관련**: [`.ai-context.md`](../.ai-context.md) 6절 · [`travel-spots-management.md`](./travel-spots-management.md) · [`2026-05-18-project-log.md`](./2026-05-18-project-log.md)

---

## 1. 문제 요약

한 여행지가 **여러 키**로 동시에 존재합니다.

| 레이어 | 예시 |
|--------|------|
| SSOT `travelSpots.js` | `slug: borneo`, `name: 보르네오` |
| 런타임 `location` | 검색 시 `name_en: Siem Reap`, `slug: siem-reap` |
| DB `place_toolkit.place_id` | `브루나이`, `앙코르 와트`, `Siem Reap` 등 자유 텍스트 |
| `travelSpotAirports.json` | `spots[slug]` vs `placeIds[지명]` 이중 구조 |

**증상**

- **보르네오**: 플래너 본문이 브루나이로 생성·로드됨 (`Brunei`/`브루나이` → `borneo` 잘못된 별칭 + 툴킷 역조회).
- **앙코르**: 지구본 `Angkor Wat` vs 검색 `Siem Reap` → 서로 다른 `place_toolkit` 행·다른 Trip.com `aAirportCode` 가능.

**공항 배너·Trip.com**은 `resolveRentalPickupBannerInfo` SSOT를 쓰지만, **live `essential_guide`**·`confidence: medium` slug는 툴킷 IATA가 JSON보다 우선될 수 있음.

---

## 2. 목표 상태 (TO-BE)

1. **canonical_slug** — 공식 `travelSpots` slug 하나가 여행지의 주 키.
2. **표기는 별칭** — 한/영·지오코딩명(`Siem Reap` 등)은 `place_id` 별칭·lookup으로만 연결.
3. **`place_toolkit.place_id`** — 저장·조회 시 slug 또는 공식 한글명 **하나**로 수렴(중복 행 통합).
4. **공항 JSON** — `spots[canonical_slug]`가 제휴·배너의 기준; `placeIds`는 동일 IATA와 `linkedSlug` 유지.
5. **런타임** — 검색·핀 생성 직후 TRAVEL_SPOTS로 **정규화**한 뒤 플래너·배너 사용.

---

## 3. 단계별 실행 계획

각 단계는 **별도 Cursor 세션(또는 PR)** 으로 나누는 것을 권장합니다.  
단계마다: 코드/JSON 변경 → (해당 시) DB 스크립트 → `npm run audit:airports` → 수동 QA 3경로(지구본·한글 검색·영문/지오코딩).

### Phase 0 — 알려진 P0 (이번에 먼저)

**범위**: 보르네오·브루나이, 앙코르 와트·시엠립만.

| # | 작업 | 산출물 |
|---|------|--------|
| 0a | 잘못된 별칭 제거·추가 | `travel-spot-place-id-aliases.mjs` — `Brunei`/`브루나이`/`마나도`→`borneo` **삭제**; `Siem Reap`/`시엠립`/`Angkor Wat`→`angkor-wat` **추가** |
| 0b | 공항 오버라이드 | `travel-spot-airport-overrides.mjs` — `angkor-wat`·`angkor-thom`: **SAI**, `high` (구 REP 폐쇄); `placeIds` 키 정리 |
| 0c | JSON 정합 | `travelSpotAirports.json` — `placeIds["보르네오"]`를 `spots.borneo`와 동일 다중공항(BKI·KCH·KUL); `placeIds`에 시엠립 계열 → `linkedSlug: angkor-wat` |
| 0d | DB 정리 스크립트 1차 | `npm run toolkit:reconcile-place-id` (신규, 아래 4절) — `--dry-run` → 적용 |
| 0e | QA | 보르네오 지구본 / 앙코르 지구본·「시엠립」검색 — 플래너 제목·`data-tripcom-arrival-iata` 동일 |

**완료 기준**: 동일 좌표권에서 지구본 vs 검색 시 **SAI(앙코르)**, **BKI 우선 다중(보르네오)** 일치; 플래너·배너·Trip.com IATA 동일; 플래너가 브루나이 문구로 열리지 않음.

---

### Phase 1 — 런타임 정규화 (코드만, DB 최소)

**범위**: 새 여행지 없이 진입 경로 통일.

| # | 작업 | 산출물 |
|---|------|--------|
| 1a | 검색·핀 후 canonical화 | `useHomeHandlers` / `enrichLocationWithRentalAirport` 전 — `resolveTravelSpotFromPlaceId`로 공식 spot 병합(slug·name·lat/lng) |
| 1b | 툴킷 후보 축소 | `buildToolkitPlaceIdCandidates` — 역방향 별칭을 **동의어 화이트리스트**만 주입(국가·타 도시 제외) |
| 1c | 플래너 캐시 키 | `usePlannerData` — `placeKey`를 `canonical_slug` 또는 `getPlaceStableKey(location)` |
| 1d | QA 회귀 | Phase 0 사례 + 검색 `search-*` URL 복귀 |

**완료 기준**: 지오코딩으로 `siem-reap` slug가 생겨도 카드·플래너는 `angkor-wat` spot 객체 사용.

---

### Phase 2 — DB·툴킷 일괄 정리 (스크립트 중심)

**범위**: `place_toolkit` 전수 또는 감사 리포트 기반 배치.

| # | 작업 | 산출물 |
|---|------|--------|
| 2a | 감사 스크립트 | `npm run toolkit:audit-place-id` — slug 미매칭·중복 place_id·지리 불일치 목록 JSON |
| 2b | 병합·리네임 | `toolkit:reconcile-place-id --apply` — canonical `place_id`로 upsert, 구 행 삭제(또는 deprecated 플래그) |
| 2c | 공항 JSON 재동기화 | `npm run sync:airports-from-toolkit` (DB 읽기) + `npm run audit:airports` |
| 2d | Edge 저장 규칙 | `update-place-toolkit` — 요청 시 `slug` 필수, 저장 `place_id` = slug 또는 SSOT 한글명 |

**완료 기준**: 감사 리포트 `unmapped`·`duplicateCanonical` P0/P1 0건 목표(전수는 점진).

---

### Phase 3 — 공항·툴킷 SSOT 강화

| # | 작업 | 산출물 |
|---|------|--------|
| 3a | `medium` slug curated 승격 | angkor-wat 등 검수 완료 slug → `curated-override` / `high` |
| 3b | 허브·검증 | `rentalAirportHubs` — BWN 등 누락 허브; Edge `HUB_COORDS`에 REP·BKI 등 확대 |
| 3c | `npm run audit:airports` 전수 | `inferNearestMismatch`·`none: 0` 유지 |
| 3d | (선택) `place_stats` stable key | [`2026-05-04-project-log.md`](./2026-05-04-project-log.md) Phase A와 정렬 |

---

### Phase 4 — 장기 (별 프로젝트)

- 지오코딩 서버 프록시 (`.ai-context` 6절 백로그).
- 브루나이 등 **별도 공식 여행지** 추가 여부 제품 결정.
- `update-place-toolkit` 응답에 `primary_arrival_airports_iata` 필수화.

---

## 4. DB 스크립트 (신규 예정)

기존 `sync:airports-from-toolkit`은 **DB 읽기만** 합니다.  
`place_toolkit` 수정용 스크립트를 **Phase 0d / 2** 에 추가합니다.

### 4.1 `scripts/audit-place-toolkit-place-id.mjs`

```text
npm run toolkit:audit-place-id [-- --json]
```

- `.env.local` + `SUPABASE_SERVICE_ROLE_KEY`
- `place_toolkit` 전체 `place_id` 조회
- `resolveTravelSpotFromPlaceId`로 slug 매칭 여부 분류
- 출력: `scripts/outputs/place-toolkit-place-id-audit.json`
  - `wrongAlias`: Brunei→borneo 등 정책 위반
  - `unmapped`: travelSpots에 없는 place_id
  - `duplicateSlug`: 한 slug에 여러 place_id
  - `geoMismatch`: essential_guide IATA vs spot 좌표

### 4.2 `scripts/reconcile-place-toolkit-place-id.mjs`

```text
npm run toolkit:reconcile-place-id -- --dry-run
npm run toolkit:reconcile-place-id -- --apply
npm run toolkit:reconcile-place-id -- --apply --only=borneo,angkor-wat
```

**동작(안)**

1. `RECONCILE_RULES` (또는 aliases + SSOT)로 `old_place_id` → `canonical_place_id` 목록.
2. `--dry-run`: 병합·삭제·upsert 예정만 로그·JSON.
3. `--apply`:
   - 동일 canonical에 여러 행 → `essential_guide`가 더 풍부한 행 유지, 나머지 삭제 또는 canonical으로 merge.
   - `place_id`만 다른 행 → `UPDATE place_id` (또는 insert + delete).
4. **필수**: `--apply` 전 백업 권장(`SELECT` 덤프 또는 Supabase Table Editor export).

**Phase 0 초기 규칙 예시**

| old `place_id` (예) | canonical |
|---------------------|-----------|
| 브루나이, Brunei | (삭제 또는 `brunei` 전용 slug 생기 전까지 **병합 안 함** — 보르네오 툴킷과 분리) |
| 보르네오, Borneo | `보르네오` 또는 `borneo` (하나로 통일) |
| Siem Reap, 시엠립, Angkor Wat | `앙코르 와트` (SSOT `name`) |

> 브루나이 전용 콘텐츠는 보르네오로 합치지 말고, 잘못 매핑된 행만 삭제·재생성 대상으로 표시.

### 4.3 package.json (추가 예정)

```json
"toolkit:audit-place-id": "node scripts/audit-place-toolkit-place-id.mjs",
"toolkit:reconcile-place-id": "node scripts/reconcile-place-toolkit-place-id.mjs"
```

---

## 5. 세션별 권장 진행 (Cursor)

| 세션 | Phase | 사용자가 할 일 |
|------|-------|----------------|
| **1** | 0a–0c | 별칭·오버라이드·JSON만 (DB 없이 로컬 QA) |
| **2** | 0d + 스크립트 골격 | `audit` + `reconcile --dry-run` 구현, 리포트 확인 |
| **3** | 0d apply | `--apply --only=…` 로 P0 DB 반영, 플래너 재확인 |
| **4** | 1 | 런타임 정규화 코드 |
| **5** | 2 | DB 전수 감사·배치 병합 |
| **6** | 3 | audit:airports·curated 승격 |

한 세션에서 **Phase 0 코드 + 0d dry-run**까지가 현실적인 상한입니다. **apply는 사용자 확인 후** 다음 세션.

---

## 6. 수동 QA 체크리스트 (매 Phase)

- [ ] 지구본 공식 아이콘 클릭 → 플래너 제목·툴킷 내용·배너 IATA
- [ ] 한글 정확 검색 (예: 앙코르 와트, 보르네오)
- [ ] 영문/지오코딩 유도 검색 (예: Siem Reap)
- [ ] Trip.com 배너 `data-tripcom-arrival-iata` = 공항 배너 IATA
- [ ] `npm run audit:airports` — `none: 0` 유지

---

## 7. 알려진 P0 파일 목록 (빠른 참조)

| 파일 | Phase 0 변경 |
|------|----------------|
| `scripts/data/travel-spot-place-id-aliases.mjs` | Brunei/마나도→borneo 제거, Siem Reap→angkor-wat 추가 |
| `scripts/data/travel-spot-airport-overrides.mjs` | angkor-wat curated |
| `src/pages/Home/data/travelSpotAirports.json` | borneo placeIds·angkor placeIds |
| `scripts/reconcile-place-toolkit-place-id.mjs` | 신규 (0d) |
| `src/utils/toolkitPlaceIdResolve.js` | Phase 1b |

---

## 8. 진행 상태

| Phase | 상태 | 비고 |
|-------|------|------|
| 0 | ✅ 완료 | 0a–0c · 0d apply(angkor) |
| 1 | ✅ 완료 | 세션 1(1a–1c) · gateo.kr P0 QA |
| 2 | ✅ 완료 | P1·P2·P3 reconcile apply(295행) · **duplicateSlug 0** · sync·audit `none:0` |
| 2d | ✅ 완료 | `update-place-toolkit` canonical `place_id` · `PlannerTab` slug 전달 |
| 3 | ✅ 1차 | 3a curated 승격 · 3b 허브·DB IATA 패치 · **geoMismatch 0** |
| 4 | ⬜ 백로그 | |

*완료 시 이 표와 [`2026-05-18-project-log.md`](./2026-05-18-project-log.md)에 2~3줄만 갱신.*
