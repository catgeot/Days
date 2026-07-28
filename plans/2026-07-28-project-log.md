# 2026-07-28 프로젝트 일지

직전: [`2026-07-27-project-log.md`](./2026-07-27-project-log.md)

## 국내축제 — 로컬 main 반영 (배포 대기)

**상태**: ✅ 로컬 `main` fast-forward → tip `c06866b` · smoke PASS · **origin/main 미푸시**(사람 로컬 검증 후 push·배포)

| 영역 | 내용 |
|------|------|
| 머지 | `merge/korea-festival-into-main` → `main` (FF, 82 commits ahead of origin) |
| VERIFY | `smoke:korea-festival-personal` · `audit/smoke:korea-area-codes` · `smoke:place-label-slug` PASS |
| QA 포커스 | 홈 배너「한국의 축제 현장」→ `/korea` · 지구본 홈 · 시도/시군 리스트·칩 |

**다음**: 사람 로컬 회귀 OK → `git push origin main` · (필요 시) `tourapi-proxy` Edge 재배포. releaseNotes·hub 신설·corridor 부활 금지.

## 국내축제 — 머지 QA 이어하기 (세션 종료 · 보관)

**상태(당시)**: ✅ 사람 확인 · tip `bb7ee5e` · `merge/korea-festival-into-main` · main 미병합 → 위 절로 이어짐
