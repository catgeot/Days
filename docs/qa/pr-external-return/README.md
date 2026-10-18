# Festival sheet — external link return QA (WebKit 390)

생성일: 2026-10-18 · Playwright `webkit-external-return-qa-record` · 뷰포트 390×844

권역 3건(양구 HTTP 공식 홈, 강릉, 마산)에서 **시트 열기 → 공식 홈페이지 → 복귀** 후 시트 컨트롤별 **elementFromPoint(hit)** · **클릭 효과**를 표로 기록합니다.


HTTP 라벨 스크린샷: [`yanggu-http-http-label.png`](./yanggu-http-http-label.png) · [`http-official-label.png`](./http-official-label.png)


## 재현

```bash
npm run build
npx vite --host 127.0.0.1 --port 5173 --strictPort &
SMOKE_SITE_URL=https://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
SMOKE_SITE_URL=https://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/korea-festival-external-return.spec.js --project=webkit-festival-external-return
```

## 요약 (3권역 × 2복귀경로)

| 권역 | 축제 ID | popup 닫기 | goBack 경로 |
| --- | --- | --- | --- |
| 강원·양구 | `8099001` | **PASS** | **PASS** |
| 강원·강릉 | `2930716` | **PASS** | **PASS** |
| 경남·마산 | `637693` | **PASS** | **PASS** |

## 강원·양구 — 청춘양구 펀치볼 시래기사과축제 (`8099001`)

공식 홈: `http://haean.kr`

### 복귀 경로 A — 공식 홈 팝업 닫기

스크린샷: [`yanggu-http-popup-after-return.png`](./yanggu-http-popup-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

### 복귀 경로 B — 공식 홈 팝업 닫기 → example.com → `goBack()`

스크린샷: [`yanggu-http-goback-after-return.png`](./yanggu-http-goback-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

## 강원·강릉 — 강릉 국수 축제 (`2930716`)

공식 홈: `https://e2e-static.gateo.test/official/gangneung`

### 복귀 경로 A — 공식 홈 팝업 닫기

스크린샷: [`gangneung-popup-after-return.png`](./gangneung-popup-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

### 복귀 경로 B — 공식 홈 팝업 닫기 → example.com → `goBack()`

스크린샷: [`gangneung-goback-after-return.png`](./gangneung-goback-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

## 경남·마산 — 마산가고파국화축제 (`637693`)

공식 홈: `https://e2e-static.gateo.test/official/masan`

### 복귀 경로 A — 공식 홈 팝업 닫기

스크린샷: [`masan-popup-after-return.png`](./masan-popup-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

### 복귀 경로 B — 공식 홈 팝업 닫기 → example.com → `goBack()`

스크린샷: [`masan-goback-after-return.png`](./masan-goback-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

