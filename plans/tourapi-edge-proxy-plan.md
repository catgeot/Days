# TourAPI Edge 프록시 (1단계) — 진행 계획

**상태**: 1단계 ✅ (Edge 배포 · LIVE 스모크 PASS) · 2단계 대기  
**일지**: [`2026-07-23-project-log.md`](./2026-07-23-project-log.md) 「TourAPI」절  
**다음**: 2단계 = slug↔`contentId` 배치 · 갤러리 연동 (이 문서 밖)

---

## 완료된 전제

- 공공데이터포털 **계정 공용 키 1개** → `.env.local` · Supabase Secret **`TOUR_API_SERVICE_KEY`**
- Encoding/Decoding UI 없어도 OK — raw 키 `as_is`로 통과
- **추가 일반키·사진 전용 키 불필요** (같은 키 + API별 활용신청)
- 직접 호출 검증 (키 값 로그 금지):
  - `KorService2/searchKeyword2` · `detailCommon2` · `detailImage2` → `0000` (경복궁 `contentId=126508`)
  - `PhotoGalleryService1/gallerySearchList1` → `0000`
- `VITE_` 접두·브라우저 노출 금지

---

## 1단계 범위

**포함**: Edge `tourapi-proxy` · LIVE 스모크 · 배포  
**제외**: `usePlaceGallery` · slug↔contentId SSOT · UI/릴리스 노트

### Edge

- 경로: `supabase/functions/tourapi-proxy/index.ts`
- Secret: `Deno.env.get('TOUR_API_SERVICE_KEY')` only
- 패턴: [`fetch-place-videos/index.ts`](../supabase/functions/fetch-place-videos/index.ts) CORS·JSON body
- action 화이트리스트:

| action | upstream |
|--------|----------|
| `searchKeyword` | `KorService2/searchKeyword2` |
| `detailCommon` | `KorService2/detailCommon2` |
| `detailImage` | `KorService2/detailImage2` |
| `searchPhoto` | `PhotoGalleryService1/gallerySearchList1` |

- 공통 쿼리: `MobileOS=ETC` · `MobileApp=gateo` · `_type=json`
- 응답: `{ ok, action, items[], rawCount }` — items에 `contentId`·`title`·`firstimage`/`galWebImageUrl` 등 정규화
- 배포: `npx supabase functions deploy tourapi-proxy --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`

### 스모크

- `scripts/smoke-tourapi.mjs` · npm `smoke:tourapi`
- 기본: 스키마/가드만
- `TOURAPI_SMOKE_LIVE=1`: Edge invoke — 경복궁 keyword → detailCommon → detailImage (이미지 URL ≥1)

### 완료 정의

Secret 있음 · Edge 배포 · LIVE 스모크 PASS · UI 변경 없음

### 사진 소스 메모 (경복궁 기준 · 2026-07-23)

| action | 역할 | 경복궁 규모 |
|--------|------|-------------|
| `detailImage` | contentId에 묶인 상세 이미지 | **총 ~6장** (적음) |
| `searchPhoto` | 키워드 관광사진 갤러리 | **총 ~532장** (`경복궁`) |

- 스모크 `numOfRows`는 연결 검증용으로 작게 둠 (3~5) — 실제 보유량과 무관
- **2단계 갤러리**: `searchPhoto` 우선 + 페이지네이션/`numOfRows`↑ · `detailImage`·`firstimage`는 보조
- Edge `MAX_ROWS` 현재 50 — 대량 필요 시 상한·페이지 루프 검토

---

## 2단계 예고

국내 hub/명소 slug → TourAPI `contentId` 배치 매핑 → `usePlaceGallery`에서 국내만 TourAPI 우선 (Unsplash/Pexels fallback).

**갤러리 권장 순서**: `searchPhoto`(키워드/공식명) → `detailImage`/`firstimage` 보강 → Unsplash/Pexels fallback.
