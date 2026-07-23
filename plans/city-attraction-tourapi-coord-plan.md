# 국내 명소 좌표 — TourAPI 보정

**상태**: 다음 세션 착수 대기 (2026-07-23 준비)  
**범위**: `cityAttractionHubs.json` **KR만** (약 **210 hub / 1137 명소**)  
**해외**: 대상 아님 (Mapbox/Nominatim §5.4 유지)

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

## 3. 제안 파이프 (다음 세션 구현)

| 단계 | 산출 |
|------|------|
| A. 매칭 스크립트 | `scripts/verify-city-attraction-tourapi-coords.mjs` (가칭) — hub 근접 + `searchKeyword2` → 후보 → `detailCommon2` `mapy/mapx` |
| B. 캐시 | `scripts/.cache/attraction-tourapi-coord.json` (gitignore, Nominatim 캐시와 동일 취지) |
| C. 등급 | `HIT` (이름·거리 OK) · `AMBIG` (동명) · `MISS` · `FAR` (hub/기존 tip 대비 과대) |
| D. 적용 | HIT만 tip 필드 패치 (`apply-attraction-coord-patches.mjs` 재사용 또는 동형) |
| E. 게이트 | `npm run audit:city-attraction-hubs` · smoke P0 · 샘플 hub 사람/스크립트 스팟체크 |

**매칭 휴리스틱 (초안)**

- 쿼리: 명소 `name` (hub prefix 제거 가능: `양구 박수근미술관` → `박수근미술관`) + proximity≈hub.
- 수락: 제목 토큰 겹침 + tip 또는 hub 대비 거리 상한 (도시 **≤3km** 권장 · 광역/섬 hub는 allowlist 완화).
- 거부: 버스정류장·휴게소·도로 only · 타 시군 주소 · AMBIG는 수동 큐.

**김유정 고정 사례**: `contentId=127933` → `37.8183632, 127.7176781` (이미 tip 반영 `99b8e9b`).

---

## 4. 기존 파일 (건드리는 / 안 건드리는)

| 파일 | 역할 |
|------|------|
| [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json) | tip — **여기만** 명소 lat/lng 패치 |
| [`tourapi-content-id-overrides.mjs`](../scripts/data/tourapi-content-id-overrides.mjs) | slug **갤러리** SSOT — 명소 좌표와 **분리** (혼용 금지) |
| [`verify-city-attraction-coords.mjs`](../scripts/verify-city-attraction-coords.mjs) | Mapbox/Nominatim — TourAPI 보정 **이후** 회귀·해외용 |
| Edge `tourapi-proxy` | LIVE 호출 권장 · 키 브라우저/`VITE_` 커밋 금지 |
| UI / `releaseNotes` | 합의 전 변경 금지 |

---

## 5. 배치 운영

- KR 1137은 한 턴 전수 금지 → hub 배치(예: 20) 또는 HIT 큐 배치.
- tip append/패치 **직렬** · 시드 `sokcho`/`paris` 덮어쓰기 금지.
- 오케스트레이터를 쓸 경우 method **§5.4 확장**(TourAPI HIT 소스) 또는 본 문서만으로 솔로 배치 가능.
- Secret: Cloud/로컬 `TOUR_API_SERVICE_KEY` (또는 Edge 경유).

---

## 6. 완료 정의

- [ ] 스크립트 + npm script + 캐시 gitignore
- [ ] KR HIT 패치 1차(또는 전수 HIT) · audit 0
- [ ] P0 4곳 tip이 TourAPI/사람 QA와 일치
- [ ] AMBIG/MISS 큐 md 1장 · 일지 핸드오프
- [ ] 커밋·push (요청 시)

---

## 7. 다음 세션 제시어

```
TourAPI-명소좌표-이어하기
@plans/city-attraction-tourapi-coord-plan.md
@plans/2026-07-23-project-log.md
@.ai-context.md

국내 cityAttractionHubs 좌표를 TourAPI mapy/mapx로 보정.
갤러리 slug SSOT(tourapi-content-id-overrides)와 분리.
김유정 127933 회귀 금지 · VITE_/UI/releaseNotes 금지.
세대0=매칭 스크립트+스모크 → 세대1=KR HIT 배치 패치.
```
