# TourAPI Edge 프록시 — 진행 계획

**상태**: 1단계 ✅ · 2단계 ✅ · **3단계 ⏳** (시드·랭킹 보정 ✅ · 브라우저 UI QA·릴리스 합의 대기)  
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

**포함**: slug↔contentId SSOT · `usePlaceGallery` 국내 TourAPI( DB 이후 ) · attribution  
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

### 갤러리 순서 (`usePlaceGallery` · 캐시 v1.14)

**국내** (`isDomesticKoreaLocation` · curated SSOT)

1. sessionStorage
2. **`place_stats`** — 히트 시 LIVE 생략 · **기존 갤러리 덮어쓰기 없음**  
   - soft: TourAPI 우세 DB → 스킵 후 스톡 재수집(공지천)  
   - curated hub: 스톡 고착 DB → 스킵 후 Tour 우선(양구 Unsplash 오매칭 방지)
3. **TourAPI** ([`fetchTourApiGallery.js`](../src/utils/fetchTourApiGallery.js)) — **`contentId` 공식 POI** 또는 **curated hub `photoKeyword`** (DB miss 시)  
   - `detailImage` 선두(있을 때) · `photoKeywords` ≤3 병렬 searchPhoto · 랭킹·프로브
4. Unsplash · Pexels · soft Tour(스톡 0·비curated) · fallback

**해외**: session → DB → Unsplash/Pexels (**TourAPI 미호출**)

출처: [`galleryImageAttribution.js`](../src/components/PlaceCard/common/galleryImageAttribution.js) `source=tourapi` → 한국관광공사 / visitkorea

### Edge 재배포 (photographer 필드)

normalize에 `galPhotographer` 추가 시:

```bash
npx supabase functions deploy tourapi-proxy --project-ref phdjnbfitvmrguqzverm --no-verify-jwt
```

(미배포여도 URL·갤러리 동작 OK · 촬영자명은 기본 「한국관광공사」)

---

## 3단계 (QA · 시드) — 진행 중

**코드 ✅** (합의 전 UI/릴리스):
- SSOT **40 spots / 19 contentId** — hub 전경 키워드(서울·부산·제주) · 창경궁·광화문·흥인지문·롯데월드타워·오죽헌·창덕궁
- 랭킹: 공항·축제·상품관 등 강등 · 캐시 **v1.7**
- 검증: `npm run audit:tourapi` · `npm run smoke:tourapi` (+ LIVE)

**남은 일** (사람·브라우저):
- 로컬 `https://localhost:5173` UI QA — 경복궁·서울·해운대 · 해외(파리) Unsplash 회귀 · 출처「한국관광공사」
- (Agent 브라우저 MCP는 로컬 self-signed HTTPS 인증서 우회 승인 필요)
- 릴리스 노트 **합의 후** `releaseNotes.js`
- main에 TourAPI 커밋 **push** 후 Vercel 배포 확인