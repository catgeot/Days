# 국내 동명 리 검색 — 지역 명시 다후보 (대화리)

**상태**: ✅ tip 구현 · 사람 Preview QA 대기  
**제시어**: `동명리-검색-다후보-이어하기`  
**일지**: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)  
**선행**: GPS 대화리→평창 ✅ (#32) · #35 임시 평창 기울임 → **본 세션에서 제거·다후보 교체**

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

## 1. 구현 (완료)

| 파일 | 역할 |
|------|------|
| [`koHomonymRiSearch.js`](../src/pages/Home/lib/koHomonymRiSearch.js) | Nominatim `limit=8` · 군/시 라벨 · 후보 카드 |
| [`useHomeHandlers.js`](../src/pages/Home/hooks/useHomeHandlers.js) | ≥2면 `makeDisambiguationResult` · 단독 자동 진입 금지 |
| `geocoding.js` | #35 `대화리→평창` 별칭·군 스코어 가산 **제거** |
| `smoke:ko-homonym-ri-search` | 픽스처 + `KO_HOMONYM_RI_LIVE=1` |

**라벨**: county=`○○군` → `{리} · {군}` · 시만 → `{리} · {시}`.  
**선택 후**: `stayAdmin` + `originalQuery=대화리`(세밀명은 군 래더 뒤 유지).

---

## 2. 완료 조건

- [x] 「대화리」→ **평창군·천안시**(+충주·김제) 지역 명시 카드 (LIVE smoke)
- [x] 자동 단독 진입 금지 (핸들러 early return)
- [x] GPS 대화리 → 평창 숙소 smoke PASS
- [x] smoke · 한글 커밋 · Cloud push·PR

**사람 QA**: Preview에서 「대화리」Enter → 선택 카드 → 평창/천안 각각 숙소.

---

## 3. 하지 말 것

- UI 리디자인 · 릴리스 노트
- 전국 slug override 남발
- Nominatim 병렬 폭주
- `travelSpots.js` 전체 스캔
- 평창/천안 단독 우선 재도입
