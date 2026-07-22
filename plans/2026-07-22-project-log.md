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
| `chuuk` | ❌ 재고 없음 | city 등록 철회 → sparse UX |
| `christmas-island` | ❌ 오매핑 | `93327`=캐나다 Christmas Island · 철회 → sparse |
| `cocos-islands` | △ 1건·예약 불가 | city 철회 → sparse UX |
| `persepolis` | 시라즈 당일 투어가 일반적 | Trip 시라즈도 실재고 0 → sparse · 안내 문구만 |
| `timbuktu` | 바마코=관문≠당일허브 | sparse UX |
| `antarctica` · `diego-garcia` · `midway-atoll` · `pitcairn-islands` · `kerguelen-islands` | 사실상 없음 | sparse UX |

### 숙소 city ID — NO_REGION 마무리

- `venezuela`: `606`(난핑) → **`811`**(카라카스)
- `svalbard`→`7398` · `faroe-islands`→`38171` · `falkland-islands`→`76974`
- sparse UX: 극지 5 + `chuuk` · `christmas-island` · `cocos-islands` · `persepolis` · `timbuktu`
- `persepolis`: 시라즈 hub city 철회(Trip 실재고 0) · empty는 당일 투어 안내 + OTA 한계 문구

### 에이전트 핸드오프 (다음 세션 — 숙소 city ID)

- **읽을 것**: 본 절 표 · `.ai-context` 5절 · `affiliate.js` city/sparse/`getTripcomHotelEmptyCopy`
- **금지**: Trip.com 호텔 목록 스크래핑·가짜 API · 숙소 확장창 상시 iframe · `VITE_` MRT 키 · **검증 안 된·실재고 0 city ID 등록**
- **다음 작업**: NO_REGION city 배치 ✅ (허브도 QA 실재고 필수)
- **제시어**: `숙소-이어하기` + `@plans/2026-07-22-project-log.md`
