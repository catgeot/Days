# Festival sheet — external link return QA (WebKit 390)

생성일: 2026-10-18 · Playwright `webkit-external-return-qa-record` · 뷰포트 390×844

**Owner repro (Safari 탭):** 축제 시트 → **주변 볼거리 카드** → 중첩 명소 상세 → **공식 홈(HTTP)** → 비보안 경고 → 뒤로 → 뒤로 → 축제 시트 버튼 dead-tap.

권역 3건에서 위 경로 후 시트 컨트롤별 **elementFromPoint(hit)** · **클릭 효과**를 표로 기록합니다.

## 근본 원인 (수정)

중첩 `ThemeSpotDetailModal`(`z-[55]`)도 축제 시트와 같이 **전체 화면 flex 오버레이 + backdrop-blur**가 히트를 가로채 Safari bfcache 복귀 후 명소·시트 버튼이 dead-tap. Mooni FAB는 모달 내부 `fixed`로 상대적으로 살아남. `document.body.style.overflow = hidden` 이 cleanup 없이 남는 경우도 방어.

| | 파일·위치 |
| --- | --- |
| **중첩 모달 (주 원인)** | `src/pages/KoreaTheme/ThemeSpotDetailModal.jsx` — L47–51 스크림 상수, L1810–1825 `data-theme-spot-modal-scrim` + `pointer-events-none` 래퍼 |
| **축제 시트** | `FestivalDetailSheet.jsx` L148–151, L1930–1947 |
| **방어 훅** | `useFestivalSheetInteractionRestore.js` + `lib/festivalSheetInteractionRestore.js` (sessionStorage는 `FestivalDetailSheet` → 중첩 모달 공식 홈 클릭 시 `markFestivalSheetExternalReturn`) |

## Safari 주소창이 안 보이는 이유

축제 시트·중첩 명소 모달 모두 **body 스크롤 없이** 내부 스크롤 컨테이너만 사용 → iOS Safari URL bar 축소/숨김.


양구 주변 HTTP 라벨: [`yanggu-http-nearby-http-label.png`](./yanggu-http-nearby-http-label.png) · 축제 요약 HTTP: [`http-official-label.png`](./http-official-label.png)


## 재현

```bash
npm run build
npx vite --host 127.0.0.1 --port 5173 --strictPort &
SMOKE_SITE_URL=http://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
SMOKE_SITE_URL=http://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/korea-festival-external-return.spec.js --project=webkit-festival-external-return
```

## 요약 (3권역 × 2복귀경로 · 주변 명소 공식 홈)

| 권역 | 축제 ID | 주변 명소 | popup 닫기 | same-tab goBack |
| --- | --- | --- | --- | --- |
| 강원·양구 | `8099001` | DMZ야생화공원 | **PASS** | **PASS** |
| 강원·강릉 | `2930716` | e2e 경포대 근처 | **PASS** | **PASS** |
| 경남·마산 | `637693` | e2e 마산어시장 근처 | **PASS** | **PASS** |

## 강원·양구 — 청춘양구 펀치볼 시래기사과축제 (`8099001`)

주변 명소: **DMZ야생화공원** (`1287701`) · 공식 홈 `http://yanggu-wildflower.e2e.test/`

### 복귀 경로 A — 주변 명소 상세 → 공식 홈 팝업 닫기 → 뒤로(시트)

스크린샷: [`yanggu-http-popup-after-return.png`](./yanggu-http-popup-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 스크림이 탭 hit 아님 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

### 복귀 경로 B — 주변 명소 상세 → 공식 홈 동일 탭 `goBack` + `pageshow` persisted

스크린샷: [`yanggu-http-goback-after-return.png`](./yanggu-http-goback-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 스크림이 탭 hit 아님 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

## 강원·강릉 — 강릉 국수 축제 (`2930716`)

주변 명소: **e2e 경포대 근처** (`1287702`) · 공식 홈 `http://gangneung-nearby.e2e.test/`

### 복귀 경로 A — 주변 명소 상세 → 공식 홈 팝업 닫기 → 뒤로(시트)

스크린샷: [`gangneung-popup-after-return.png`](./gangneung-popup-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 스크림이 탭 hit 아님 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

### 복귀 경로 B — 주변 명소 상세 → 공식 홈 동일 탭 `goBack` + `pageshow` persisted

스크린샷: [`gangneung-goback-after-return.png`](./gangneung-goback-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 스크림이 탭 hit 아님 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

## 경남·마산 — 마산가고파국화축제 (`637693`)

주변 명소: **e2e 마산어시장 근처** (`1287703`) · 공식 홈 `http://masan-nearby.e2e.test/`

### 복귀 경로 A — 주변 명소 상세 → 공식 홈 팝업 닫기 → 뒤로(시트)

스크린샷: [`masan-popup-after-return.png`](./masan-popup-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 스크림이 탭 hit 아님 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

### 복귀 경로 B — 주변 명소 상세 → 공식 홈 동일 탭 `goBack` + `pageshow` persisted

스크린샷: [`masan-goback-after-return.png`](./masan-goback-after-return.png)

| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |
| --- | --- | --- | --- |
| z40–59 투명 히트 차단 없음 | PASS | PASS |  |
| 스크림이 탭 hit 아님 | PASS | PASS |  |
| 탭 · 프로그램 | PASS | PASS |  |
| 안내로 돌아가기 | PASS | PASS |  |
| 맨 위로 | PASS | PASS |  |
| 탭 · 사진 | PASS | PASS |  |
| 공식 홈페이지 | PASS | PASS |  |
| 히어로 썸네일 | PASS | PASS |  |
| 닫기 (X) | PASS | PASS |  |

