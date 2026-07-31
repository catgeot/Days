# 범지구적 퍼즐 — MVP 구현 핸드오프

**상태**: 제품 합의 ✅ · **MVP 구현 tip** (Preview QA 대기)  
**제시어**: `범지구적퍼즐-이어하기` · `@plans/global-puzzle-mvp-plan.md`  
**일지**: [`2026-07-31-project-log.md`](./2026-07-31-project-log.md)

---

## 0. 다음 세션 — 읽을 것 / 금지

**읽을 것 (이 순서)**

1. 본 파일 §1~§4 (합의·한 세트·별·범위)
2. [`.ai-context.md`](../.ai-context.md) — **§3 금지 · §4.1 UI**만
3. 재사용 앵커만 grep/부분 Read:  
   `globeFaceRegions.js` · `globeFaceSubregions.js` · `globeCountryCatalog.js` · `globeRegionHighlight.js` · `GlobeFaceRegionRail.jsx` · `HomeUI.jsx`(카테고리·나라 레일)

**읽지 말 것 (전반 파악 생략)**

- `travelSpots.js` / `travelSpotAirports.json` 전체
- 명소·항공·축제 운영 가이드 전문
- 지구본 enrichment 구 계획 전문

**금지**

- 홈 탐색 UX **리디자인** (기존 면·나라 칩 톤·레이아웃 교체 금지) — 게임 모드는 **연결·오버레이·상태**로 추가
- 테마(`primaryCategory` 휴양·모험)로 스테이지 나누기 — 면 = **지리 권역** ([`globeFaceRegions.js`](../src/pages/Home/lib/globeFaceRegions.js) 주석 SSOT)
- 전 세계 수도·명소 일괄 SSOT 완성 전에 막기 — **시드 소량**으로 루프 먼저
- 계정·랭킹·멀티 · 세부 지명 본편 (슬롯/해금 UI만 가능)

---

## 1. 제품 한 줄

지구본 홈의 **권역(면) → 나라** 메뉴로 도장 깨기.  
한 나라 = **찾기 탭(B) + 수도 객관식** 한 세트.  
완료 후에도 **다시 도전**. 힌트(A 포커스)는 선택이며 **별 −1**.

---

## 2. 한 세트 (확정)

| 단계 | 동작 | 비고 |
|------|------|------|
| 1 메뉴 | 권역 면 · (소권역) · **나라 선택** | 기존 `GlobeFaceRegionRail` / 카테고리 UX 재사용 |
| 2 찾기 | 권역이 **넓게** 보인 채 목표 나라를 **탭** (B) | 시작 시 나라로 포커스·하이라이트 **하지 않음** |
| 3 수도 | **4지선다** 객관식 | 개수는 이후 설정 확장 가능하게 |
| 4 결과 | 도장 · bestStars · **다시 도전** | 세부 지명은 클리어 후 **해금 슬롯만**(본편 후속) |

**힌트 (A)**

- 버튼「힌트」→ 해당 나라 **fitBounds / 국경 하이라이트** (기존 `globeRegionHighlight` 경로 재사용 검토)
- 사용 시 **별 −1** (만점 3 → 최대 2)
- 기본 플레이에 힌트 자동 적용 금지

---

## 3. 별 규칙 (확정)

| | |
|--|--|
| 만점 | **별 3** — 탭 성공 + 수도 정답 + 힌트 없음 + (오답 패널티 없음) |
| 힌트 1회 | **−1** |
| 오답 후 성공 | **−1** (탭·수도 합쳐 **최대 1회** — 연속 깎기 금지) |
| 하한 | 클리어 시 **최소 별 1** (0으로 비우지 않음) |
| 재도전 | bestStars만 갱신(높은 쪽 유지). 완료 잠금 없음 |

의도: 별을 **늘리기보다**, 깎임이 **과하지 않게**.

---

## 4. MVP 범위

**In**

- 게임 모드 진입(홈 어디선가 — **기존 비주얼 유지**, 진입점만; 위치는 구현 시 최소 침습으로 제안 후 적용)
- 메뉴: 면 → 나라 (소권역 필터는 기존과 동일하게 써도 됨)
- 플레이: B 탭 → 수도 4지선다 → 결과·재도전
- 진행 저장: **localStorage** (`countryId` → `{ cleared, bestStars, hintUsedBest? }`)
- 수도 데이터: **소량 시드** (예: 시드 20~40국). `globeCountryCatalog`에 capital 필드 없으므로 **별도 SSOT** (예: `globalPuzzleCapitals.js` 또는 json) — catalog `id`/`labelKo`/`iso`에 조인
- 오답 시 재시도 가능(세트 중도 포기·재시작 OK)

**Out (후속)**

- 세부 지명 본편(도시·명소 매칭)
- 제한 시간·목숨·보기 개수 UI
- 서버 진행·리더보드
- 전 카탈로그 수도 완성

---

## 5. 기술 앵커 (구현 시)

| 역할 | 파일 |
|------|------|
| 면·나라 배타 목록 | `src/pages/Home/lib/globeFaceRegions.js` |
| 소권역 | `src/pages/Home/lib/globeFaceSubregions.js` |
| 나라 id·labelKo·iso·bbox | `src/pages/Home/lib/globeCountryCatalog.js` |
| 국경 하이라이트(힌트) | `src/pages/Home/lib/globeRegionHighlight.js` |
| 나라 칩 레일 | `src/pages/Home/components/GlobeFaceRegionRail.jsx` |
| 카테고리 UI | `src/pages/Home/components/HomeUI.jsx` |
| Mapbox 탭 | `HomeGlobeMapbox.jsx` — 나라 hit는 Countries/admin 레이어·iso 매칭 검토 (신규 게임 모드 클릭 핸들러; 탐색 클릭과 **모드 가드**로 분리) |

**권장 모듈 쪼개기 (새 파일, 홈 거대화 방지)**

- `src/pages/Home/lib/globalPuzzle/` 또는 `src/pages/Home/game/globalPuzzle/`  
  - `rules.js` — 별 계산  
  - `progressStorage.js` — localStorage  
  - `capitalsSeed.js` — 수도·distractor 후보  
  - `session.js` — 세트 상태머신: `pick → find → capital → result`
- UI: 얇은 오버레이/패널 컴포넌트 (홈 레이아웃 교체 금지)

**수도 distractor**: 같은 면(권역) 다른 나라 수도 우선 · 부족하면 인접/랜덤 시드.

---

## 6. 구현 순서 (다음 세션)

1. Feature 브랜치 `cursor/global-puzzle-mvp-…`
2. 수도 시드 + 별/진행 순수 모듈 + 단위/스모크(별 규칙·하한)
3. 게임 세션 상태머신 (메뉴 나라 선택 → find → capital → result)
4. Mapbox 게임모드: 권역 줌 유지 · 탭 iso/`countryId` 판정 · 힌트=기존 highlight
5. 수도 4지선다 UI · 결과·재도전 · 진행 배지(나라 칩에 별/도장 — **톤 최소**, 기존 칩 파괴 금지)
6. VERIFY: 수동 QA 체크리스트 + 규칙 스모크  
7. 검증 PASS → 한글 커밋 · push · PR (Cloud Preview)

---

## 7. QA 체크리스트 (사람 Preview)

- [ ] 권역에서 나라 선택 → 카메라가 **그 나라로 미리 붙지 않음**
- [ ] 잘못된 나라 탭 → 실패 피드백, 힌트 없이 재시도
- [ ] 정답 탭 → 수도 4지선다 → 정답 시 클리어·별
- [ ] 힌트 1회 → 포커스/하이라이트 · 별 최대 2
- [ ] 클리어 후 같은 나라 **다시 도전** 가능 · bestStars 갱신
- [ ] 게임 모드 종료 후 홈 탐색(숙소·나라 칩) 회귀 없음
- [ ] 모바일·PC 모두 세트 완료 가능

---

## 8. 에이전트 제시어 (복붙)

```
범지구적퍼즐-이어하기
@plans/global-puzzle-mvp-plan.md
MVP 구현: 권역→나라 선택 → 지구본 찾기(B) → 수도 4지선다 → 별/재도전.
힌트=A 포커스(별−1). UI 리디자인 금지. 시드 소량. localStorage 진행.
```
