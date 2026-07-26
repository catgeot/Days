# 2026-07-27 프로젝트 일지

직전: [`2026-07-26-project-log.md`](./2026-07-26-project-log.md)

## 국내축제 — S5 B 테마·지역 색인 (`국내축제-S5-Cloud`)

**상태**: ✅ 코드 · `audit:korea-area-codes` / `smoke:korea-area-codes` PASS · 사람 QA 대기 · 브랜치 `cursor/korea-festival-proxy`

| 산출 | |
|------|--|
| 지역 | `festivalRegionTags.js` — addr1 시도(≥2) → 시/군 칩 · corridor 미사용 |
| 테마 | `festivalTasteTags` — 빙어·썸머·도자기·술 등 확장 · 결과 title ≥2 |
| UI | `/korea` 헤더 칩 · 필터→지도·색인 리스트 · X=전국+칩 해제 |

**VERIFY**: `npm run audit:korea-area-codes` · `npm run smoke:korea-area-codes`

**다음**: B QA → C 즐겨찾기. releaseNotes·hub 신설·corridor 부활 금지.

**제시어 (QA·수정)**

```
국내축제-S5-B-QA
@plans/korea-festival-hub-plan.md S5만
@plans/2026-07-27-project-log.md 「국내축제 — S5 B」절만
로컬. /korea B 색인 칩 QA. C~E 금지. releaseNotes 금지.
```
