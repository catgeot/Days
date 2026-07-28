# 2026-07-28 프로젝트 일지

직전: [`2026-07-27-project-log.md`](./2026-07-27-project-log.md)

## 국내축제 — 모달 리스트 시·군 그룹

**상태**: ✅ VERIFY PASS · tip 아래 커밋 · `merge/korea-festival-into-main`

| 변경 | |
|------|--|
| 원인 | 시도(강원 등) 선택 후에도 `groupFestivalsBySido`만 적용 → 단일 「강원」헤더만 |
| 픽스 | `groupFestivalsByCity` · `groupFestivalsForList` — 단일 시도면 addr1 시·군 그룹 |
| VERIFY | `smoke:korea-festival-personal` · `audit/smoke:korea-area-codes` PASS |

**QA**: `/korea` → 지역 칩 강원 → 모달에 화천군·강릉시·춘천시 등 시·군 헤더 구분.
