# 2026-07-27 프로젝트 일지

직전: [`2026-07-26-project-log.md`](./2026-07-26-project-log.md)

## 국내축제 — S5 B 테마·지역 색인 (`국내축제-S5-Cloud`)

**상태**: ✅ 코드·커밋·푸시 `bab6937` · audit/smoke PASS · 사람 QA 대기 · 브랜치 `cursor/korea-festival-proxy`

| 산출 | |
|------|--|
| 지역 | `festivalRegionTags.js` — addr1 시도(≥2) → 시/군 칩 · corridor 미사용 |
| 테마 | `festivalTasteTags` — 빙어·썸머·도자기·술 등 확장 · 결과 title ≥2 |
| UI | `/korea` 헤더 칩 · 필터→지도·색인 리스트 · X=전국+칩 해제 |

**VERIFY**: `npm run audit:korea-area-codes` · `npm run smoke:korea-area-codes`

**에이전트 B QA** (`http://127.0.0.1:5174/korea` · 지금 탭): 시도칩→색인 리스트 · 경기→수원시≥2 · 테마(문화) 축소 · X=전국+칩 해제 · corridor 없음. **픽스**: `서울특별시`/`○광역시` 시·군 칩 오탐 스킵.

**B+**: 리스트 제목=선택 칩명 · PC 좌측/모바일 상단 연관 플랩(하위 city · 인근 sido∩결과 · 테마 형제). 시·군 좌표 인근·플랩 애니 = 문서만.

**벨트·축제로드 (문서만)**: 「지금」 서울 역C·동해안→내륙 C자 등 **형상 패턴 목록+점선 지도**. 헤더 corridor 칩 아님 · C 이후/D 후보. 계획서 S5 「벨트 · 축제로드」.

**다음**: 사람 B/B+ QA 확정 → C 즐겨찾기. releaseNotes·hub 신설·corridor 부활 금지.

**제시어 (사람 QA 후 C)**

```
국내축제-S5-C
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-27-project-log.md 「국내축제 — S5 B」절만
브랜치 cursor/korea-festival-proxy. C 즐겨찾기·본 항목. A·B 회귀 금지. releaseNotes 금지.
```

## 국내축제 — S5 B UI 조율 (헤더 대분류·리스트·뒤로)

**상태**: ✅ 코드·푸시 · PR #29 · 사람 QA 대기 · `cursor/korea-festival-proxy`

| 변경 | |
|------|--|
| 헤더 | 대분류 1행(`지금`/`전체`/`테마`) → 클릭 시 같은 행에 중·소 칩 · `대분류`로 복귀 |
| 리스트 | 하단 여백 · max-h↑ · 모서리 rounded (바닥에 붙지 않게) |
| 뒤로 | 홈 ArrowLeft·지도 떠 있는 뒤로 **제거** · 리스트 패널 뒤로만 |

**다음**: PR 미리보기 QA → OK면 C 또는 추가 톤 조율.
