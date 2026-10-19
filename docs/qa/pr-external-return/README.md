# Festival sheet — external link return QA (WebKit 390 · prod anon)

생성일: 2026-10-19 · Playwright `webkit-external-return-qa-record` · 뷰포트 390×844

**데이터:** `npm run build` + `vite preview` (`http://127.0.0.1:4173`) · production `VITE_SUPABASE_*` · read-only guard · **stub 없음**

**Owner repro:** 축제 홈 → 카드 → 주변 **해안야생화공원** → `http://haean.kr/…` → (권장) **새 탭** · iOS 동일 탭 HTTP 경고 → 뒤로 → 흰 화면 시 `pageshow.persisted` 1회 reload.

**20:13 KST iPhone Safari:** [`yanggu-haean-official-link-new-tab-attrs.png`](./yanggu-haean-official-link-new-tab-attrs.png) · [`yanggu-haean-official-opens-new-tab-sheet-stays.png`](./yanggu-haean-official-opens-new-tab-sheet-stays.png) · [`yanggu-haean-same-tab-http-visit.png`](./yanggu-haean-same-tab-http-visit.png) · [`yanggu-haean-after-back-from-http-warning-path.png`](./yanggu-haean-after-back-from-http-warning-path.png) · [`yanggu-haean-after-persisted-recovery.png`](./yanggu-haean-after-persisted-recovery.png)

## 재생성

```bash
npm run build
DEV_SSL=0 npm run preview -- --host 127.0.0.1 --port 4173
SMOKE_SITE_URL=http://127.0.0.1:4173/ npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
```

CI e2e (fixtures): `e2e/korea-festival-external-return.spec.js` · `MOONI_TOURAPI_STUB_ONLY=1`

## HTTP 안내 문구

- 축제 요약 `data-festival-official-home-http-notice`: rolling12에 HTTP-only 축제 공식 홈이 없으면 [`http-official-notice-real.png`](./http-official-notice-real.png)는 **양구 주변 해안야생화공원** 실데이터 HTTP 공식 홈 행.
- 스크린샷: [`http-official-notice-real.png`](./http-official-notice-real.png)

## 요약

| 권역 | 축제 ID | 주변 명소 | nearby 버튼 | sheet 버튼 |
| --- | --- | --- | --- | --- |
| 강원·양구 | `1122739` | 해안야생화공원 | **PASS** | **PARTIAL** (9/10 PASS) |
| 강원·강릉 | `2930716` | 강릉 오금집 | **PASS** | **PARTIAL** (9/10 PASS) |
| 경남·마산 | `637693` | 마산항 | **PASS** | **PARTIAL** (9/10 PASS) |

## 강원·양구 — 청춘양구 펀치볼 시래기사과축제 (`1122739`) (owner e2e id `8099001` → prod `1122739`)

검색: `시래기` · 주변: **해안야생화공원** · 공식 홈 `http://haean.kr/user/sub1-2.php`

경로: 축제 홈 → 검색 카드 → 주변 볼거리 → 공식 홈 → 팝업 닫기 → 명소 닫기

### 주변 명소 상세 — 9컨트롤 (baseline vs 복귀 후)

| 컨트롤 | baseline hit/effect | after return hit/effect | 스크린샷 (after) | 회귀 | 비고 |
| --- | --- | --- | --- | --- | --- |
| 닫기 (X) | PASS/SKIP | PASS/PASS | `buttons/yanggu-1122739-nearby-close-x.png` | — |  |
| 즐겨찾기 | PASS/SKIP | PASS/PASS | `buttons/yanggu-1122739-nearby-star.png` | — |  |
| 확대보기 | N/A | N/A |  | — | no hero expand |
| 네이버 | PASS/SKIP | PASS/PASS | `buttons/yanggu-1122739-nearby-naver.png` | — |  |
| 구글 | PASS/SKIP | PASS/PASS | `buttons/yanggu-1122739-nearby-google.png` | — |  |
| 홈페이지 | PASS/SKIP | PASS/PASS | `buttons/yanggu-1122739-nearby-homepage.png` | — |  |
| 사진 | N/A | N/A |  | — | not in DOM |
| 내 여행 일정 | PASS/SKIP | PASS/PASS | `buttons/yanggu-1122739-nearby-stay.png` | — |  |
| 무니 | PASS/SKIP | PASS/PASS | `buttons/yanggu-1122739-nearby-mooni.png` | — |  |

### 축제 시트 — 버튼별

| 컨트롤 | elementFromPoint | 동작/효과 | 스크린샷 | 비고 |
| --- | --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS | `yanggu-1122739-sheet-z40–59-투명-히트-차단-없음.png` |  |
| 스크림이 탭 hit 아님 | PASS | PASS | `yanggu-1122739-sheet-스크림이-탭-hit-아님.png` |  |
| 탭 · 프로그램 | PASS | PASS | `yanggu-1122739-sheet-탭-·-프로그램.png` |  |
| 안내로 돌아가기 | FAIL | FAIL | `yanggu-1122739-sheet-안내로-돌아가기.png` |  |
| 맨 위로 | PASS | PASS | `yanggu-1122739-sheet-맨-위로.png` | QA record — 맨 위로 생략 |
| 탭 · 사진 | PASS | PASS | `yanggu-1122739-sheet-탭-·-사진.png` |  |
| 공식 홈페이지 | PASS | PASS | `yanggu-1122739-sheet-공식-홈페이지.png` |  |
| 히어로 썸네일 | PASS | PASS | `yanggu-1122739-sheet-히어로-썸네일.png` |  |
| 닫기 (X) | PASS | PASS | `yanggu-1122739-sheet-닫기-(X).png` |  |
| Mooni (시트) | PASS | PASS | `yanggu-1122739-sheet-mooni.png` |  |

## 강원·강릉 — 강릉국수축제 (`2930716`)

검색: `강릉 국수` · 주변: **강릉 오금집** · 공식 홈 `https://www.gn.go.kr/www/selectBbsNttView.do`

경로: 축제 홈 → 검색 카드 → 주변 볼거리 → 공식 홈 → 팝업 닫기 → 명소 닫기

### 주변 명소 상세 — 9컨트롤 (baseline vs 복귀 후)

| 컨트롤 | baseline hit/effect | after return hit/effect | 스크린샷 (after) | 회귀 | 비고 |
| --- | --- | --- | --- | --- | --- |
| 닫기 (X) | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-close-x.png` | — |  |
| 즐겨찾기 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-star.png` | — |  |
| 확대보기 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-expand.png` | — |  |
| 네이버 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-naver.png` | — |  |
| 구글 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-google.png` | — |  |
| 홈페이지 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-homepage.png` | — |  |
| 사진 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-photo.png` | — |  |
| 내 여행 일정 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-stay.png` | — |  |
| 무니 | PASS/SKIP | PASS/PASS | `buttons/gangneung-2930716-nearby-mooni.png` | — |  |

### 축제 시트 — 버튼별

| 컨트롤 | elementFromPoint | 동작/효과 | 스크린샷 | 비고 |
| --- | --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS | `gangneung-2930716-sheet-z40–59-투명-히트-차단-없음.png` |  |
| 스크림이 탭 hit 아님 | PASS | PASS | `gangneung-2930716-sheet-스크림이-탭-hit-아님.png` |  |
| 탭 · 프로그램 | PASS | PASS | `gangneung-2930716-sheet-탭-·-프로그램.png` |  |
| 안내로 돌아가기 | FAIL | FAIL | `gangneung-2930716-sheet-안내로-돌아가기.png` |  |
| 맨 위로 | PASS | PASS | `gangneung-2930716-sheet-맨-위로.png` | QA record — 맨 위로 생략 |
| 탭 · 사진 | PASS | PASS | `gangneung-2930716-sheet-탭-·-사진.png` |  |
| 공식 홈페이지 | PASS | PASS | `gangneung-2930716-sheet-공식-홈페이지.png` |  |
| 히어로 썸네일 | PASS | PASS | `gangneung-2930716-sheet-히어로-썸네일.png` |  |
| 닫기 (X) | PASS | PASS | `gangneung-2930716-sheet-닫기-(X).png` |  |
| Mooni (시트) | PASS | PASS | `gangneung-2930716-sheet-mooni.png` |  |

## 경남·마산 — 마산가고파국화축제 (`637693`)

검색: `마산가고파` · 주변: **마산항** · 공식 홈 `http://masan.mof.go.kr/index.do`

경로: 축제 홈 → 검색 카드 → 주변 볼거리 → 공식 홈 → 팝업 닫기 → 명소 닫기

### 주변 명소 상세 — 9컨트롤 (baseline vs 복귀 후)

| 컨트롤 | baseline hit/effect | after return hit/effect | 스크린샷 (after) | 회귀 | 비고 |
| --- | --- | --- | --- | --- | --- |
| 닫기 (X) | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-close-x.png` | — |  |
| 즐겨찾기 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-star.png` | — |  |
| 확대보기 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-expand.png` | — |  |
| 네이버 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-naver.png` | — |  |
| 구글 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-google.png` | — |  |
| 홈페이지 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-homepage.png` | — |  |
| 사진 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-photo.png` | — |  |
| 내 여행 일정 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-stay.png` | — |  |
| 무니 | PASS/SKIP | PASS/PASS | `buttons/masan-637693-nearby-mooni.png` | — |  |

### 축제 시트 — 버튼별

| 컨트롤 | elementFromPoint | 동작/효과 | 스크린샷 | 비고 |
| --- | --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS | `masan-637693-sheet-z40–59-투명-히트-차단-없음.png` |  |
| 스크림이 탭 hit 아님 | PASS | PASS | `masan-637693-sheet-스크림이-탭-hit-아님.png` |  |
| 탭 · 프로그램 | PASS | PASS | `masan-637693-sheet-탭-·-프로그램.png` |  |
| 안내로 돌아가기 | FAIL | FAIL | `masan-637693-sheet-안내로-돌아가기.png` |  |
| 맨 위로 | PASS | PASS | `masan-637693-sheet-맨-위로.png` | QA record — 맨 위로 생략 |
| 탭 · 사진 | PASS | PASS | `masan-637693-sheet-탭-·-사진.png` |  |
| 공식 홈페이지 | PASS | PASS | `masan-637693-sheet-공식-홈페이지.png` |  |
| 히어로 썸네일 | PASS | PASS | `masan-637693-sheet-히어로-썸네일.png` |  |
| 닫기 (X) | PASS | PASS | `masan-637693-sheet-닫기-(X).png` |  |
| Mooni (시트) | PASS | PASS | `masan-637693-sheet-mooni.png` |  |

