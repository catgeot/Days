# 국내 명소 좌표 — TourAPI 보정

**상태**: 클라우드 오케스트레이터 착수용 (2026-07-23)  
**범위**: `cityAttractionHubs.json` **KR만** (약 **210 hub / 1137 명소**)  
**해외**: 대상 아님 (Mapbox/Nominatim §5.4 유지)  
**실행 권장**: **Cursor Cloud** (장시간 TourAPI LIVE · Secrets · Ubuntu bash)

---

## 1. 왜 TourAPI인가

- Mapbox Search Box는 KR POI 공백이 잦고, Nominatim은 **동명 버스정류장·도로**에 붙는 경우가 있음 (김유정문학촌 재현).
- TourAPI `detailCommon` / `searchKeyword`의 **`mapy`·`mapx`**는 한국관광공사 POI 기준이라 국내 명소 핀에 적합.
- 이미 Edge `tourapi-proxy` · Secret `TOUR_API_SERVICE_KEY` · slug 갤러리 SSOT(`tourapi-content-id-overrides.mjs`)가 있음.  
  **다만** 그 SSOT는 **travelSpot slug(갤러리)** 용 — **hub 명소(attraction) 좌표용 매핑은 아직 없음**.

---

## 2. 목표

1. KR tip 명소 중 TourAPI로 **안정 매칭**되는 항목의 `lat`/`lng`를 `mapy`/`mapx`로 스냅.
2. 매칭 실패·모호(동명 다수)·hub 밖 원거리는 **스킵/큐** — 추정 좌표 금지.
3. `audit:city-attraction-hubs` issues **0** 유지 · P0 회귀 금지(양구·김유정·덕풍·진도타워).

---

## 3. 파이프

| 단계 | 산출 |
|------|------|
| A. 매칭 스크립트 | `scripts/verify-city-attraction-tourapi-coords.mjs` (가칭) — hub 근접 + `searchKeyword` → 후보 → `detailCommon` `mapy/mapx` |
| B. 캐시 | `scripts/.cache/attraction-tourapi-coord.json` (gitignore) |
| C. 등급 | `HIT` · `AMBIG` · `MISS` · `FAR` |
| D. 적용 | HIT만 tip 필드 패치 (`apply-attraction-coord-patches.mjs` 재사용/동형) |
| E. 게이트 | `npm run audit:city-attraction-hubs` · smoke P0 · 샘플 스팟체크 |

**매칭 휴리스틱**

- 쿼리: 명소 `name` (hub prefix 제거 가능) + proximity≈hub.
- 수락: 제목 토큰 겹침 + tip/hub 대비 거리 상한 (도시 **≤3km** · 광역/섬 allowlist 완화).
- 거부: 버스정류장·휴게소·도로 only · 타 시군 · AMBIG→수동 큐.

**김유정 고정**: `contentId=127933` → `37.8183632, 127.7176781` (tip `99b8e9b`) — **회귀 금지**.

---

## 4. 건드리는 / 안 건드리는

| 파일 | 역할 |
|------|------|
| [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json) | tip — **여기만** lat/lng 패치 |
| [`tourapi-content-id-overrides.mjs`](../scripts/data/tourapi-content-id-overrides.mjs) | slug **갤러리** — **혼용 금지** |
| [`verify-city-attraction-coords.mjs`](../scripts/verify-city-attraction-coords.mjs) | Mapbox/Nominatim — TourAPI 이후 회귀·해외 |
| Edge `tourapi-proxy` | LIVE 권장 · `VITE_`/`TOUR_API_*` 커밋 금지 |
| UI / `releaseNotes` | 합의 전 변경 금지 |

---

## 5. 클라우드 오케스트레이터 (권장)

방법론: [`orchestrator-method.md`](./orchestrator-method.md) **v2.1** · §1·§3.0·§3.3·§4.2 · 본 문서(**§5.5**에 해당).

### 5.1 Secrets (Cloud 탭 · 값 채팅/커밋 금지)

| 이름 | 용도 |
|------|------|
| `TOUR_API_SERVICE_KEY` | 직접 TourAPI 호출 시 |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Edge `tourapi-proxy` 경유 시 |

둘 중 **하나 경로**면 OK. LIVE 스모크 실패 시 Secret 누락으로 escalate (§3.3 E).

### 5.2 세대 구분

| 세대 | 누가 | 하는 일 |
|------|------|---------|
| **G0** | 메인만 (워커 불필요) | 매칭 스크립트 + npm script + 캐시 gitignore + **김유정 127933·P0 smoke PASS** |
| **G1+** | 메인 + **워커 정확히 2** | KR hub 배치표 2개(예: 각 10 hub) · 워커는 HIT/AMBIG/MISS **초안만** · 메인 tip **직렬** A→B 패치 · VERIFY · §4.2 이관 |

- KR 1137 **한 턴 전수 금지**. 세대당 hub **≤20** (워커2×10) 권장 · 같은 메인 1~2 라운드 후 이관.
- tip **필드 패치**만 (append 아님) · 시드 `sokcho`/`paris` 덮어쓰기 금지.
- AMBIG/MISS/FAR는 tip 미적용 · 큐 md에만 누적.
- 커밋·push는 **사람 요청 시**만 · `main` 직접 push 금지(feature 브랜치).

### 5.3 워커 출력 계약 (초안만)

```
[{ hubId, name, lat, lng, contentId?, grade: HIT|AMBIG|MISS|FAR, action: snap|skip, note? }]
```

금지(워커): tip 직접 수정 · 갤러리 overrides 편집 · hub 중심 추정 · 김유정 rename/좌표 임의 변경.

### 5.4 VERIFY (라운드마다)

1. `npm run audit:city-attraction-hubs` → issues **0**
2. TourAPI smoke: 김유정 `127933` 좌표 일치 + P0(`yanggu`/`chuncheon`/`hanam`/`jindo`) 회귀
3. FAIL이면 §3.3 — tip 정상화 전 이관·커밋 금지

### 5.5 완료 정의

- [ ] G0 스크립트 + npm + 캐시 gitignore + 김유정/P0 smoke
- [ ] G1+ KR HIT 배치(또는 전수 HIT) · audit 0
- [ ] P0 tip이 TourAPI와 일치
- [ ] AMBIG/MISS 큐 md · 일지 핸드오프(다음 배치표 2개)
- [ ] 커밋·push (요청 시)

---

## 6. 클라우드 오케스트레이터 제시어 (복붙)

Cloud Agent **첫 메시지**에 그대로:

```
오케스트레이터 · TourAPI-명소좌표
@plans/orchestrator-method.md
@plans/city-attraction-tourapi-coord-plan.md
@plans/2026-07-23-project-log.md 「국내 명소 좌표 — TourAPI 보정」절만
@.ai-context.md

당신은 오케스트레이터(메인). method v2.1 §1·§3.0·§3.3·§4.2 + 본 계획 §5 준수.
환경: Cursor Cloud · Secrets TOUR_API_SERVICE_KEY 및/또는 VITE_SUPABASE_URL+ANON (Edge tourapi-proxy).
범위: cityAttractionHubs.json KR tip만 · mapy/mapx HIT만 스냅 · 해외 제외.

즉시:
1) G0(메인만): verify-city-attraction-tourapi-coords(+적용) 스크립트·캐시·npm · 김유정 contentId=127933 → 37.8183632,127.7176781 smoke PASS · P0 smoke
2) G1부터: KR hub 배치표 2개(각≤10) · Task 워커 정확히 2(초안만) · tip 직렬 A→B · audit issues 0 · §4.2 후임 Task 이관(사람 제시어 대기 금지)
3) 큐 소진 또는 escalate만 사람 보고

금지: tourapi-content-id-overrides에 좌표 혼용 · hub 중심 추정 · tip 병렬 · 시드 sokcho/paris 덮어쓰기 · 김유정 127933 회귀 · VITE_/키 커밋 · UI/releaseNotes · main 직접 push · 솔로 계주(G1+) · VERIFY FAIL tip 방치
커밋은 사람 요청 시에만(한글 메시지).
```

### 로컬 솔로(비권장 · 복구용)

```
TourAPI-명소좌표-이어하기
@plans/city-attraction-tourapi-coord-plan.md
@plans/2026-07-23-project-log.md
@.ai-context.md

국내 cityAttractionHubs 좌표를 TourAPI mapy/mapx로 보정.
갤러리 slug SSOT와 분리. 김유정 127933 회귀 금지.
세대0=스크립트+스모크 → 세대1=KR HIT 배치. VITE_/UI/releaseNotes 금지.
```
