# TourAPI 미등재 명소 자체 큐레이션(curated) 작업 지침서

**문서 버전**: v1.0.0 (2026-09-10)  
**관련 플랜**: [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) · [`curated-scenic-spots-queue.md`](./curated-scenic-spots-queue.md)  
**고정 브랜치**: `cursor/curated-scenic`  
**담당 도구**: `scripts/report-curated-scenic-candidates.mjs` · `scripts/search-tourapi-photos.mjs`

---

## 1. 배경 및 목적

1. **TourAPI의 한계와 미등재 명소**:
   - 한국관광공사 TourAPI(KorService2)에는 주요 명소라 하더라도 단독 관광지(`contentTypeId: 12`) 엔티티로 등록되지 않은 곳이 존재합니다.
   - 예시: **양구 수목원**은 산림청 제35호 공립 수목원이자 양구9경 제1경임에도 단독 `contentId`가 없고 여행코스(`contentId: 2987538`) 내 하위 경유지로만 기록되어 있었습니다.
2. **GATEO 자체 큐레이션 메커니즘**:
   - `koreaScenicSpots`에 `contentId: null`이라 하더라도, 자체 `overview`, `addr1`, `homepage`, `imageUrl`, `galleryUrls`가 구비되어 있으면 상세 모달(`ThemeSpotDetailModal`)이 **`curated: true` 모드로 자동 전환**되어 풍부한 본문과 갤러리를 렌더링합니다.
3. **목표**:
   - TourAPI `contentId: null`로 종결된 50개 잔여 명소(및 사진 미보유 명소)에 대해 양구 수목원과 동일한 고품질 자체 큐레이션 정보를 단계별로 채워 넣습니다.

---

## 2. 자체 큐레이션 필드 규격 (SSOT)

| 필드명 | 타입 | 필수 | 규격 및 가이드 |
|---|---|:---:|---|
| `id` | `string` | 필수 | 기존 kebab-case ID (예: `yanggu-arboretum`) |
| `overview` | `string` | 필수 | **150~350자** (최대 600자). 지자체 공식 웹사이트, 산림청, 국가유산포털, TourAPI 코스 경유지 설명(`subdetailoverview`) 등 신뢰성 있는 공공 소스를 바탕으로 요약 서술. <br>⚠️ **주의**: "TourAPI 부재", "상세가 없어", "GATEO 선정 안내" 등의 시스템 안내 문구는 작성 금지 (`stripCuratedOverviewMeta`에 의해 삭제됨). 순수 여행지 안내문으로 작성. |
| `addr1` | `string` | 권장 | 도로명 주소 (예: `'강원특별자치도 양구군 동면 숨골로310번길 131'`) |
| `homepage` | `string` | 권장 | 공식 웹사이트 또는 지자체 관광 안내 페이지 URL (예: `'https://www.yanggu.go.kr/arboretum/'`) |
| `imageUrl` | `string` | 필수 | 대표 썸네일 고화질 URL (`https://...`). 한국관광공사 사진갤러리(`tong.visitkorea.or.kr`) 또는 지자체 공공누리(KOGL) 사진 |
| `galleryUrls` | `string[]` | 권장 | 3~5장의 고화질 사진 배열 |

---

## 3. 정보 수집 및 작업 절차 (5단계 프로토콜)

### Step 1: 후보군 확인
```bash
# 전체 후보 및 현재 큐레이션 완성도(DONE/PARTIAL/TODO) 조회
node scripts/report-curated-scenic-candidates.mjs

# 마크다운 표 형식으로 조회
node scripts/report-curated-scenic-candidates.mjs --markdown
```

### Step 2: 사진 및 갤러리 검색
```bash
# 한국관광공사 사진갤러리(searchPhoto) 실시간 검색
node scripts/search-tourapi-photos.mjs "대통령기록관"
node scripts/search-tourapi-photos.mjs "금강소나무숲길"
```
- 검색 결과 나오는 `https://tong.visitkorea.or.kr/cms2/website/...` 고화질 사진 중 대표 1장과 갤러리용 3~5장을 확보합니다.
- 사진갤러리에 없는 경우: 지자체 문화관광 공식 홈페이지 공공누리(제1유형) 사진 또는 공공기관 공식 사이트 사진 활용.

### Step 3: 공식 개요(본문) 및 주소·홈페이지 조사
- 지자체 공식 문화관광 포털, 산림청, 국립공원공단, 지자체 대표 포털의 관광지 안내를 참조합니다.
- 만약 해당 명소가 TourAPI 여행코스(`contentTypeId: 25`)의 하위 경유지로 있는 경우 `detailInfo`의 `subdetailoverview`를 추출하여 정제합니다.

### Step 4: SSOT 데이터 등록
1. `scripts/data/korea-scenic-spots-overrides.mjs`:
   해당 `id` 객체에 `overview`, `addr1`, `homepage`, `imageUrl`, `galleryUrls` 기입.
2. `scripts/data/korea-scenic-spot-images.json`:
   `"byId"` 매핑에 `"명소id": "대표이미지URL"` 기입.
3. 생성 스크립트 실행:
   ```bash
   npm run generate:korea-scenic-spots
   ```

### Step 5: 검증 및 게이트
```bash
npm run audit:korea-scenic-spots
npm run smoke:korea-scenic-spots
npm run build
```
- 후보 보고서로 상태가 `DONE`으로 변경되었는지 확인:
  ```bash
  node scripts/report-curated-scenic-candidates.mjs
  ```

---

## 4. 커밋 및 핸드오프 규칙
- **로직/데이터**: 고정 브랜치 `cursor/curated-scenic`에서 작업 및 커밋, 매 턴 push.
- **핸드오프 문서**: `main`에서 `plans/curated-scenic-spots-queue.md` 및 일지 갱신 후 push.
- **금지**:
  - 임의의 상상/허구 본문 작성 금지 (반드시 공공/지자체 공식 팩트 기반)
  - 저작권 위반 비공식 블로그 불펌 이미지 사용 금지
  - `generate:korea-scenic-spots` 없이 JSON 직접 편집 금지
