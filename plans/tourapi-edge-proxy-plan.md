# TourAPI Edge 프록시 — 진행 계획

**상태**: 1단계 ✅ · **2단계 ✅** (매핑 SSOT · `usePlaceGallery` 국내 우선 · UI 합의 전)  
**일지**: [`2026-07-23-project-log.md`](./2026-07-23-project-log.md) 「TourAPI」절

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

## 1단계 (Edge) ✅

**포함**: Edge `tourapi-proxy` · LIVE 스모크 · 배포  
**제외**(당시): `usePlaceGallery` · slug↔contentId · UI

- 경로: `supabase/functions/tourapi-proxy/index.ts`
- Secret: `Deno.env.get('TOUR_API_SERVICE_KEY')` only
- action: `searchKeyword` · `detailCommon` · `detailImage` · `searchPhoto`
- 공통 쿼리: `MobileOS=ETC` · `MobileApp=gateo` · `_type=json`
- 응답: `{ ok, action, items[], rawCount }`
- 배포: `npx supabase functions deploy tourapi-proxy --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`
- 스모크: `npm run smoke:tourapi` · `TOURAPI_SMOKE_LIVE=1`

### 사진 소스 (경복궁 기준)

| action | 역할 | 규모 |
|--------|------|------|
| `detailImage` | contentId 상세 이미지 | ~6장 |
| `searchPhoto` | 키워드 관광사진 | ~532장 |

→ 갤러리는 **searchPhoto 우선** · detailImage/`firstimage` 보조

---

## 2단계 (매핑 + 갤러리) ✅

**포함**: slug↔contentId SSOT · `usePlaceGallery` 국내 TourAPI 우선 · attribution  
**제외**: UI 대규모 변경 · 릴리스 노트(합의 전)

### SSOT

| 파일 | 역할 |
|------|------|
| [`scripts/data/tourapi-content-id-overrides.mjs`](../scripts/data/tourapi-content-id-overrides.mjs) | 수동 시드 |
| [`src/pages/Home/data/travelSpotTourApi.json`](../src/pages/Home/data/travelSpotTourApi.json) | 생성물 (`spots` + `byName`) |
| [`src/utils/tourApiMatch.js`](../src/utils/tourApiMatch.js) | resolve · soft 국내 |

```bash
npm run generate:tourapi
npm run audit:tourapi
```

- hub: `photoKeyword` 필수 · `contentId` 선택(도시명은 searchKeyword 노이즈↑ → null OK)
- 명소: 검증 `contentId` + `photoKeyword` + aliases
- 미등록 국내(`country=한국`): soft — 이름=keyword · contentId 없음

### 갤러리 순서 (국내)

1. sessionStorage (`CACHE_VERSION` v1.6)
2. **TourAPI** ([`fetchTourApiGallery.js`](../src/utils/fetchTourApiGallery.js))
   - contentId 있으면 **`detailImage` 선두** (공식 POI)
   - `photoKeywords`(전경·야경·근정전 등) → 기본 `photoKeyword`
   - 제목 랭킹 · 국립민속박물관·교대의식·상점 등 **오프트픽 드롭**
3. `place_stats` · Unsplash · Pexels · fallback

출처: [`galleryImageAttribution.js`](../src/components/PlaceCard/common/galleryImageAttribution.js) `source=tourapi` → 한국관광공사 / visitkorea

### Edge 재배포 (photographer 필드)

normalize에 `galPhotographer` 추가 시:

```bash
npx supabase functions deploy tourapi-proxy --project-ref phdjnbfitvmrguqzverm --no-verify-jwt
```

(미배포여도 URL·갤러리 동작 OK · 촬영자명은 기본 「한국관광공사」)

---

## 다음 (3단계 · 합의 후)

필수에 가깝음:
- **UI QA**: 경복궁·서울·해운대 등 국내 TourAPI 노출 · 해외 Unsplash 회귀 · 캐시 v1.6 반영 확인

선택:
- 시드 확장(추가 hub/명소 `contentId`·`photoKeywords`)
- 오프트픽/랭킹 규칙 보정 (`tourApiPhotoRank.js`)
- 릴리스 노트 초안 **합의 후** `releaseNotes.js`

코드 필수는 아님(Edge·매핑·갤러리 경로 완료).
