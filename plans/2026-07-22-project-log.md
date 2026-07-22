# 2026-07-22 프로젝트 일지

이전: [`2026-07-21-project-log.md`](./2026-07-21-project-log.md)

## MRT 숙소 — 전수 감사 누락분 마무리

**상태**: ✅ main 반영 · Edge 재배포 · LIVE 통과

- 모바일 PR #3 머지 검토: squash만 들어감 · 클라우드 tip(`a20bf16` 272곳 감사·오버라이드)은 누락 → 데스크톱 반영
- `npm run audit:mrt-stays` · 캐시 `v11` · Edge `fetch-mrt-stays` 재배포 ✅
- LIVE 14케이스 통과(베네수엘라 `NO_REGION`=Trip.com CTA 정상)

## 트립닷컴 숙소 검색 연동 (항공권 미러)

**상태**: ✅ QA 확인 · 커밋

- `TRIPCOM_HOTEL_AD`(`S18836274`/`S18836330`) · `buildTripcomHotelSearchUrl` `mode: ad|list` · `PLANNER_TRIPCOM_HOTEL_CITY_IDS`(홍콩·마카오·바티칸·이스탄불·베네수엘라)
- Summary「숙소 찾기」빈 결과·에러: `/hotels/list` CTA · 결과 &lt;5: 「트립닷컴에서 더 보기」
- 상시 검색바 미적용 · 스크래핑 금지 유지
- Trip 호텔 partners/ad iframe은 city/날짜/인원 프리필 **미지원** → CTA+`StayDateBar` SSOT
- 기본 일정 **보름(+14)·3박**·성인2·아동0

### UX — 빈 결과: 헤더 여행지 + 트립 CTA만

- `TripcomHotelBannerWidget` 제거(PC·모바일 공통) · `StayDateBar` 좌상단 여행지 표기
- empty/error: 시인성 문구 + 중앙 CTA만 (`/hotels/list` 프리필) — 배너·iframe 없음
- CTA 비주얼: **gateo.kr 배포**와 동일 — `border-sky-300/40 bg-sky-500/20 rounded-xl` · 문구「트립닷컴에서 숙소 검색」

### MRT NO_REGION ↔ Trip.com 재고 대조 (2026-07-22)

**LIVE 감사** (`MRT_STAY_AUDIT_LIVE=1`): OK 198 · **NO_REGION 14** · error 60(일시 `accommodation/search failed`, 재고 없음과 구분)

| slug | Trip.com | city ID / 비고 |
|------|----------|----------------|
| `venezuela` | ✅ 카라카스 ~40곳 | **`811`** · 등록 `606`은 중국 난핑(오류) |
| `svalbard` | ✅ 롱이어비엔 11곳 | `7398` |
| `faroe-islands` | ✅ 토르스하운 ~43곳 | `38171` |
| `falkland-islands` | ✅ Stanley | `76974` |
| `chuuk` | ✅ Weno/Moen | 호텔 상세 확인 · city 보강 |
| `christmas-island` / `cocos-islands` | 소수 목록 | city 보강 여지 |
| `persepolis` / `timbuktu` | 빈약·허브 의존 | 시라즈/바마코 등 검토 |
| `antarctica` · `diego-garcia` · `midway-atoll` · `pitcairn-islands` · `kerguelen-islands` | 사실상 없음 | CTA 기대치 낮음 |

### 에이전트 핸드오프 (다음 세션 — 숙소 city ID)

- **읽을 것**: 본 절 표 · `.ai-context` 5절 · `affiliate.js` `PLANNER_TRIPCOM_HOTEL_CITY_IDS`
- **금지**: Trip.com 호텔 목록 스크래핑·가짜 API · 숙소 확장창 상시 iframe · `VITE_` MRT 키
- **다음 작업(우선)**:
  1. `venezuela`: `606` → **`811`**
  2. `svalbard`→`7398` · `faroe-islands`→`38171`(토르스하운) · `falkland-islands`→`76974` 등록
  3. (선택) chuuk·크리스마스/코코스 city · 극지 5곳 UX 문구
- **제시어**: `숙소-이어하기` + `@plans/2026-07-22-project-log.md`
