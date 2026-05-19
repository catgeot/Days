# 2026-05-19 Project Log

이전 일지: [`plans/2026-05-18-project-log.md`](./2026-05-18-project-log.md)

## Phase 1 배포 스모크 QA + Phase 2 감사·apply (진행)

### 프로덕션 스모크 QA (gateo.kr)

- **앙코르 와트** `/place/angkor-wat/planner`: 플래너·공항 배너·Trip.com **SAI**, ICN→SAI 문구 일치.
- **보르네오** `/place/borneo/planner`: 툴킷 보르네오(코타키나발루·MDAC) 정상, 연동 **BKI**·후보 KCH/KUL, 브루나이 문구 없음.
- **Siem Reap** `/explore` 검색 → 홈 카드 **앙코르 와트**(`Angkor Wat`)로 정규화 확인(Phase 1 `mergeCanonicalTravelSpot`).

### Phase 2 — `toolkit:audit-place-id` (313→312행)

- 전수: `mapped 261` · `unmapped 52` · `duplicateSlug 16` · `geoMismatch 11` · `wrongAlias 0`.
- **P0**: `duplicateSlug 0`(apply 후) · `unmapped 1`(브루나이, `flag_only` 유지) · `geoMismatch 0`.
- 리포트: `scripts/outputs/place-toolkit-place-id-audit.json`.

### reconcile apply

- `npm run toolkit:reconcile-place-id -- --apply --only=angkor-wat`: **`앙코르와트`** 중복 행 merge+delete 1건(5/18 재생성분).
- 보르네오·브루나이: dry-run 기준 DB 변경 없음(보르네오 단일 행 OK, 브루나이 `flag_only`).

### Phase 2 P1·P2 reconcile apply (312→301행)

- `place-toolkit-reconcile-rules.mjs`: P1 6 slug + P2 4 slug 규칙 추가.
- **P1 apply** (`bali,kuala-lumpur,uyuni-salt-flat,plitvice-lakes,everest-base-camp,alaska`): 중복 6행 delete — `우붓`→`발리`, `쿠알라셀랑고르`→`쿠알라룸푸르`, `우유니`→`우유니 소금사막`, `플리트비체 국립공원`→`플리트비체 호수`, `에베레스트`→`에베레스트 베이스캠프`, `앵커리지`→`알래스카`.
- **P2 apply** (`banff-national-park,galapagos,phuket,iceland`): 5행 delete — `로키 산맥`, `다윈`, `태국 파타야`, `일룰리사트`, `일루리삿` → 각 canonical.
- 브루나이 `flag_only`·보르네오 병합 없음 유지.

### 재감사·공항 sync

- `toolkit:audit-place-id`: `duplicateSlug 15→5` · `geoMismatch 11→8` · P0 `wrongAlias 0` · `unmapped 1`(브루나이).
- `sync:airports-from-toolkit` + `audit:airports` **`none: 0`** — `phuket` BKK→HKT, `galapagos` SIN→GPS/GYE, `iceland` CPH→KEF 등 JSON 반영.
- 잔여 `duplicateSlug`: `lalibela`, `antarctica`, `raja-ampat`, `miyakojima`, `reykjavik`.

### gateo.kr 스모크 QA (변경 slug)

- **발리** `/place/bali/planner`: 제목·툴킷 **발리**, 공항·Trip.com **DPS** 일치.
- **갈라파고스** `/place/galapagos/planner`: 제목·본문 GPS/SCY 정상; 배너 **SIN** 잔존 — DB audit는 GPS/GYE, `travelSpotAirports.json` sync 완료 → **배포 후** 배너 재확인.

### Phase 2 P3 reconcile apply (301→295행)

- `place-toolkit-reconcile-rules.mjs`: P3 5 slug 규칙 추가.
- **apply** (`lalibela,antarctica,raja-ampat,miyakojima,reykjavik`): 6행 merge+delete — `아디스아바바`→`랄리벨라`, `맥머도 기지`·`남극해`→`남극 대륙`, `라자암팟`→`라자 암팟`, `오키나와`→`미야코지마`, `레이니스퍄라`→`레이캬비크`.
- 브루나이 `flag_only` 유지.

### 재감사·공항 sync (P3 후)

- `toolkit:audit-place-id`: **`duplicateSlug 0`** · `geoMismatch 8→6` · `unmapped 1`(브루나이).
- `sync:airports-from-toolkit` + `audit:airports` **`none: 0`**.

### gateo.kr 스모크 QA (P3 slug)

- **레이캬비크** `/place/reykjavik/planner`: 제목·툴킷 **레이캬비크**, 공항·Trip.com **KEF** 일치(레이니스퍄라 중복 행 제거 반영).
- **랄리벨라** `/place/lalibela/planner`: 제목·툴킷 **랄리벨라**, 배너 **ADD+LLI**, Trip.com **ADD** — 아디스아바바 별도 행 없음.

### Phase 3 + 2d (이번 세션)

- **2d** `update-place-toolkit`: slug→SSOT 한글 `place_id` 정규화(`canonicalPlaceIdMap.json`·`PlannerTab` canonical 전달). Edge `HUB_COORDS` GPS/GYE/KEF/HKT/CUZ/USH/PUQ/ADD/MDY 추가.
- **3a** `travel-spot-airport-overrides.mjs`: galapagos·iceland·phuket·reykjavik·lalibela·ushuaia·cusco·patagonia curated `high`; midway·kerguelen·antarctica 승격. `rentalAirportHubs` LLI 추가.
- **3b** DB `toolkit:patch-guide-iata --apply` 4건(우수아이아·쿠스코·남극·파타고니아 primary IATA). `generate:airports` + `sync:airports-from-toolkit`.
- **감사**: `toolkit:audit-place-id` **`duplicateSlug 0`** · **`geoMismatch 0`** · `audit:airports` **`none: 0`**.

### 다음

1. `travelSpotAirports.json`·규칙·Edge Function **배포** (`update-place-toolkit` 재배포 필수).
2. gateo.kr 스모크: 갈라파고스 GPS/GYE·파타고니아 USH/PUQ 배너.
3. `unmapped` 52·툴킷 IATA 없음 37건 점진 검수.
