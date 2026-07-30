# 국내 동명 리 검색 — 지역 명시 다후보 (대화리)

**상태**: ⏳ 다음 세션  
**제시어**: `동명리-검색-다후보-이어하기`  
**일지**: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)  
**선행**: GPS 대화리→평창 ✅ (#32) · 검색 천안 오탐 완화 임시 ✅ ([#35](https://github.com/catgeot/Days/pull/35))

---

## 0. 제품 결정 (2026-07-30)

「대화리」처럼 **평창에도 있고 천안에도 있는** 동명 리는:

| 금지 | 해야 할 것 |
|------|------------|
| 평창 **단독 우선** 자동 진입 | 검색 결과에 **지역이 명시된 후보 2개+** 나열 |
| 천안 **단독 우선** 자동 진입 | 사용자가 고른 뒤에만 핀·숙소 연결 |
| 라벨이 「대한민국 대화리」만 | 예: **대화리 · 평창군** / **대화리 · 천안시** (충주·김제 등 추가 히트도 동일 규칙) |

GPS **현재위치**는 좌표가 확정이라 단일 결과 OK (평창 연결 정상 — 회귀 유지).

---

## 1. 이번(#35) vs 다음

| | #35 (임시) | 다음 세션 |
|--|------------|-----------|
| 동작 | 군·면 스코어·별칭으로 **평창 쪽으로 기울임** | **기울이지 않음** — 다후보 선택 |
| 유지 | stay `originalQuery` 세밀명 → 군 래더 뒤 | 유지 |
| 제거/교체 | `expandForwardQueryAliases`의 `대화리→평창` 강제 · 「시-only면 모호→평창 별칭」이 **단일 자동 진입**을 만드는 부분 | `makeDisambiguationResult`로 대체 |

---

## 2. 구현 스케치 (다음 세션)

1. **후보 수집**: Nominatim(및 가능 시 Mapbox) forward `limit≥5` · 국내 `○○리`/`○○읍`/`○○면` 쿼리.
2. **라벨 SSOT**: `name` + 상위 행정  
   - county 있으면 `{리} · {군}` (예: 대화리 · 평창군)  
   - 시만 있으면 `{리} · {시}` (예: 대화리 · 천안시) — ※ 천안은 **시** (군 아님)
3. **진입**: 후보 ≥2 이고 동명(동일 name/리)이면 **자동 commit 금지** → 기존 `makeDisambiguationResult` / Search Box 선택 카드 재사용 (`useHomeHandlers.js`).
4. **선택 후**: 해당 좌표·`stayAdmin`으로 숙소/투어 (군 선두 래더는 기존 유지).
5. **#35 정리**: 평창 강제 별칭·단일 자동 승격 제거 또는「다후보 실패 시에만」폴백으로 축소.

**참고 코드**: `getCoordinatesFromAddress` · `calculatePlaceScore` · `isAmbiguousKoVillageForwardHit` (`geocoding.js`) · `makeDisambiguationResult` (`useHomeHandlers.js`).

---

## 3. 완료 조건

- [ ] 「대화리」검색 → 선택 UI에 **평창군·천안시**(및 OSM 히트 시 충주·김제 등) **지역 명시** 카드
- [ ] 어느 쪽도 **자동 단독 진입**하지 않음
- [ ] GPS 대화리 → 평창 숙소 회귀 PASS
- [ ] smoke/짧은 검증 · 한글 커밋 · Cloud면 push·PR

---

## 4. 하지 말 것

- UI 리디자인 · 릴리스 노트
- 전국 slug override 남발
- Nominatim 병렬 폭주
- `travelSpots.js` 전체 스캔

---

## 5. Cloud 붙여넣기

```text
동명리-검색-다후보-이어하기

@.ai-context.md
@plans/ko-homonym-ri-search-disambiguation-plan.md
@plans/2026-07-30-project-log.md

대화리 등 동명 리: 평창/천안 단독 우선 금지.
검색 결과에「대화리 · 평창군」「대화리 · 천안시」처럼 지역 명시 다후보.
GPS 단일 결과는 유지. #35 평창 강제 별칭은 다후보로 교체.
VERIFY 후 커밋·push.
```
