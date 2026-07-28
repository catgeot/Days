# 2026-07-28 프로젝트 일지

직전: [`2026-07-27-project-log.md`](./2026-07-27-project-log.md)

## 국내축제 — 세션 종료 (push · 다음 QA)

**상태**: ✅ `main` push tip `c0e561b` · 리스트 우선+지도 온디맨드 · Map 아이콘 충돌 픽스 · **사람 QA 이어가기**

| | |
|--|--|
| tip | `c0e561b` · 홈 배너「한국의 축제 현장」→ `/korea` |
| 흐름 | 시간·지역·테마로 범위 · 헤더/리스트에서 언제든 변경·확대 · 지도는 온디맨드 |
| 기본 | 근거 없음→강원 · 위치 허용→시도+80km 리스트(맵 자동 오픈 없음) |

**다음 세션 QA**: 진입 리스트 · 칩으로 범위 변경 · 지도 열고 닫기 · 위치 허용 · 검색·상세·★ · (필요 시) `tourapi-proxy` Edge

**제시어**

```
국내축제-리스트우선-QA
@plans/2026-07-28-project-log.md 「국내축제 — 세션 종료」절만
main tip c0e561b. 리스트 우선·지도 온디맨드 회귀 이어하기.
```

## 국내축제 — 리스트 우선 · 지도 온디맨드

**상태**: ✅ tip `c0e561b` push · 상시 Map 셸 제거 · 헤더+축제명 리스트 · 「지도」온디맨드

| | |
|--|--|
| 기본 | 시간·지역·테마 → 축제명 리스트 · 강원/`nearIds` |
| 지도 | 헤더·리스트 CTA · 닫으면 필터 유지 · 클러스터 선택→리스트 |
| 위치 | 리스트 본류(자동 맵 오픈 없음) · 위치 힌트 배너 유지 |

**VERIFY**: `smoke:korea-festival-personal` · `smoke:korea-area-codes` PASS

## 국내축제 — 기본값 (위치/강원)

**상태**: ✅ tip 대기 커밋 · 근거 없음→강원(`32`) · 위치 허용 시 진입 GPS→시도칩+80km 리스트

| 사용자 | 동작 |
|--------|------|
| 근거 없음 | `DEFAULT_AREA_CODE=32` · 리스트 즉시 · [`koreaFestivalDefaults.js`](../src/pages/Korea/koreaFestivalDefaults.js) |
| 위치 허용 | 목록 로드 후 silent `getCurrentPosition` → `applyUserLocation`(시도 우선+반경) · 칩/초기화 조작 시 부트 스킵 |
| 내 주변 | 동일 apply · 실패 메시지만 노출 |

**VERIFY**: `smoke:korea-festival-personal` · `audit/smoke:korea-area-codes` PASS

**QA**: 위치 거부→강원 리스트 · 허용→내 시도칩+주변 건수 · 전국 칩·수동 지역 변경 유지

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
