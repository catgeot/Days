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
- Summary「숙소 찾기」빈 결과·에러: **커스텀 Trip 검색바**(달력·인원)+`/hotels/list` · 결과 &lt;5: 「트립닷컴에서 더 보기」
- 상시 검색바 미적용 · 스크래핑 금지 유지
- Trip 호텔 partners/ad iframe은 city/날짜/인원 프리필 **미지원**(항공 `aAirportCode`와 다름) → 네이티브 바가 SSOT
- 기본 일정 **보름(+14)·3박**·성인2·아동0 (클라 `defaultMrtStayDates` · Edge `defaultStayDates`)
- `stayDateControls.jsx` 공유 · StayDateBar와 동기화 · 위젯 iframe은 「직접 입력」접기

### 에이전트 핸드오프 (다음 세션 — 숙소 최적화)

- **읽을 것**: 본 절 · `.ai-context` 5절 · `GlobeStayStrip` / `TripcomHotelBannerWidget` / `affiliate.js` 호텔 SSOT
- **금지**: Trip.com 호텔 목록 스크래핑·가짜 API · 숙소 확장창 상시 iframe · `VITE_` MRT 키
- **남은 일(선택)**: Fail 원격지 city ID 보강 · Edge `fetch-mrt-stays` 재배포(3박 기본) · 커스텀 바 UX 미세조정 · 릴리스 노트 합의 후 `releaseNotes.js`
- **제시어**: `숙소-이어하기` + `@plans/2026-07-22-project-log.md`
