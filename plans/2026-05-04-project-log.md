# 2026-05-04 Project Log

이전 일지: [`plans/2026-04-28-project-log.md`](./2026-04-28-project-log.md)

## 오늘 세션 맥락 (요약)

- **데이터 역할**: `TRAVEL_SPOTS` = 주요 여행지 카드(직접 큐레이션), `citiesData` = 지구본 권역 커버용(전수 여행지 목록 아님), `place_stats` = 방문/채팅/저장 집계 + Unsplash(등) 갤러리 캐시.
- **이슈**: 검색·좌표로 연 장소(`search-…` / `loc-…`)는 URL만으로 표시명을 복구하기 어렵고, `place_stats`는 현재 `place_id`에 **한글 표시명**을 쓰는 경향이 있어 **안정 키**와 어긋날 수 있음.
- **이미 반영된 프론트**: `getPlaceUrlParam`·`placeLocationCache`(sessionStorage)로 써머리/뒤로가기 복원 보완, `ReviewsTab`의 `place_slug`는 `search-`/`loc-`일 때 `id` 우선.

## 실행 예정일

**2026-05-05** — 아래 계획을 순서대로 진행하면 됨.

---

## 내일 실행 계획: `place_stats` 정체성 정렬 (stable key + 메타)

### 목표

1. **단일 불변 키**로 갤러리 upsert, `increment_place_stats` RPC, (선택) 티커 조회가 같은 장소를 가리키게 한다.
2. **표시명·좌표**를 DB에 두어, 세션 밖(재방문·로그인 후·다른 기기)에서도 복구 가능한 기반을 마련한다.
3. 기존 **한글 `place_id` 행**과 병행 가능한 **마이그레이션 경로**를 둔다.

### Phase A — Supabase 스키마 설계·마이그레이션 (우선)

| 단계 | 내용 |
|------|------|
| A1 | **`place_id` 의미 확정**: 새 행부터는 **안정 식별자**만 저장 (`travelSpots.slug`, `city-{lat}-{lng}` 문자열, `search-{lat}-{lng}`, 또는 신규 UUID). 기존 한글 전용 행은 유지 기간 동안 읽기 호환. |
| A2 | **컬럼 추가 (제안)** | `name_ko` (text, nullable), `name_en` (text, nullable), `lat` (double precision, nullable), `lng` (double precision, nullable), `source` (text, nullable; 예: `travel_spot` / `city` / `globe_search` / `globe_click`). 필요 시 `slug` (text, nullable) — 큐레이션 카드 조인용. |
| A3 | **인덱스**: `place_id` PK 또는 unique 유지. 선택적으로 `(lat, lng)` 부분 인덱스(근접 검색은 나중 단계). |
| A4 | **데이터 백필 스크립트 (일회성)**: 기존 `place_id`가 한글만인 행에 대해, 가능하면 `TRAVEL_SPOTS.name` 매칭으로 `slug`·좌표·영문명 채우기. 매칭 불가 행은 그대로 두고 신규 키 전략만 이후 행에 적용. |
| A5 | **`increment_place_stats` RPC 검토**: `p_id`가 한글인지 stable key인지 문서화하고, 클라이언트가 넘기는 값을 **갤러리 upsert와 동일한 키**로 통일. RPC 내부는 `upsert` on conflict `place_id` 유지 가정. |

**산출물**: `supabase/migrations/` SQL 파일, README 한 줄(새 `place_id` 규칙).

### Phase B — 클라이언트 읽기·쓰기 정렬

| 파일 / 영역 | 변경 방향 |
|-------------|-----------|
| `src/components/PlaceCard/hooks/usePlaceGallery.js` | `select`/`upsert`/`update` 시 **`place_id` = stable key** (예: `search-…` 우선, 없으면 slug, 최후 name). `name_ko`/`name_en`은 location 객체에서 채워 upsert. 기존 한글-only 행 조회는 **이중 조회(신 키 실패 시 레거시 한글)** 또는 마이그레이션 완료 후 단일화. |
| `src/shared/api/supabase.js` — `recordInteraction` | `placeId`를 **갤러리와 동일한 stable key 생성 규칙**으로 통일 (헬퍼 함수 한 곳에서 생성 권장). |
| `src/pages/Home/hooks/useTrendingData.js` | 티커는 계속 `TRAVEL_SPOTS`와 조인할지 명시. DB의 `place_id`가 slug가 되면 **`s.slug === row.place_id`** 매칭으로 변경 검토. 한글-only 레거시는 fallback 유지 기간만 두기. |
| `src/pages/Home/lib/getPlaceStatsId.js` (신규 권장) | `location` → `{ placeId, nameKo, nameEn, lat, lng, source }` 한 번에 계산하는 순수 함수로 중복 제거. |

### Phase C — 정책·품질

| 항목 | 메모 |
|------|------|
| RLS | anon `upsert`/`update` 범위 재확인; 악의적 대용량 `gallery_urls` 삽입 완화. |
| `gallery_urls` 크기 | 장기적으로 URL·id 위주 슬림 구조 검토 (별도 이슈 가능). |
| Unsplash | 다운로드/저장 정책은 기존 가이드라인과 충돌 없는지 유지. |

### Phase D — 검증 체크리스트 (출시 전)

- [ ] 검색으로 춘천 등 **미큐레이션 도시** 열기 → 갤러리 로드 후 `place_stats`에 **stable `place_id`** + `name_ko` 저장 확인.
- [ ] 동일 장소 재방문 시 갤러리 **DB 히트** (불필요한 Unsplash 재호출 감소).
- [ ] `recordInteraction('view')` 집계가 동일 행 갱신되는지 확인.
- [ ] 블로그 `/p/…` 후 뒤로가기 + 리뷰 탭: 기존 sessionStorage 캐시와 **충돌 없음** (키 일관성).
- [ ] 티커: 큐레이션 스팟만 노출 정책 유지 시 **slug 매칭** 후 목록 정상.

### 의존성·순서

1. 마이그레이션(A) → 2. 헬퍼·갤러리·interaction(B) → 3. 티커 매칭(B) → 4. RLS·체크리스트(D).  
   RPC 변경이 필요하면 A5와 B를 같은 배포에 묶는 것이 안전함.

### 세션 캐시(`placeLocationCache`)와의 관계

- 단기 복구는 계속 sessionStorage로 가능.
- DB 메타가 채워지면 **장기적으로** `/place/…` 복원 시 서버에서 이름 조회하는 옵션을 열 수 있음 (후속 작업).

---

## 오늘 작업 요약 (코드 변경 없음 본 로그만)

- 위 계획을 내일 실행할 수 있도록 정리함.
