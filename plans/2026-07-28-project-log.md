# 2026-07-28 프로젝트 일지

직전: [`2026-07-27-project-log.md`](./2026-07-27-project-log.md)

## 국내축제 — 머지 QA 이어하기 (세션 종료)

**상태**: ✅ 사람 확인 · tip `bb7ee5e` · push · `merge/korea-festival-into-main` · **main 미병합**

| 영역 | 내용 |
|------|------|
| 리스트 | 시도→시·군·구 그룹 · 지역명 제목/부제 · sticky 제거 · 헤더 offset · 시간/대분류 변경 시 리스트 유지 |
| 칩 | 시·군 ≥1 · 광역시 구 구분 · 헤더 하위칩 제거(모달만) · 상위 복귀 · 해운대구≠대구 |
| 홈↔축제 | `/korea` 지구본 홈 버튼 · 로고 아래 **「한국의 축제 현장」** 배너 |

**VERIFY**: `smoke:korea-festival-personal` · `audit/smoke:korea-area-codes` PASS

**다음**: 홈·`/korea` 회귀 OK 시 **main 반영·push**. releaseNotes·hub 신설·corridor 부활 금지.

**제시어 (다음 세션)**

```
국내축제-머지-QA
@plans/2026-07-28-project-log.md 「국내축제 — 머지 QA 이어하기」절만
브랜치 merge/korea-festival-into-main (tip bb7ee5e).
홈·/korea 회귀 이어하기. OK 시 main 반영·push만.
```
