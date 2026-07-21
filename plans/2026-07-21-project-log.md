# 2026-07-21 프로젝트 일지

이전: [`2026-07-20-project-log.md`](./2026-07-20-project-log.md)

## MRT 숙소 — 일부 여행지 빈 결과·미매칭

**상태**: ✅ 클라·Edge 수정 · 스모크 통과 · **Edge 재배포 필요** · 사용자 QA 대기

- **증상**: 하와이·괌·발리·사이판 등에서 숙소 없음/호출 실패처럼 보임. MRT에는 재고 있음.
- **원인**
  1. `countryMatches` `startsWith` — `인도네시아`↔`인도` 오탐(발리→라자스탄)
  2. gateo 영토 국가(`하와이`) vs MRT head(`미국, 하와이`) 불일치
  3. `북마리아나 제도`↔`북마리아나제도` 공백
  4. 괌 키워드→망길라오(재고 0) · 발리 동명 · 파타고니아 박물관 POI
  5. 일부 지역 `totalCount>0`인데 `productUrl` 없어 items 전부 탈락(레위니옹·바릴로체 등) — Edge 매핑 폴백
- **조치**: `mrtStayQuery.js` 국가 별칭·slug 키워드 오버라이드 · 캐시 `v9` · Edge compact/세그먼트 매칭·startsWith 제거·URL 합성 · `scripts/smoke-mrt-stay-queries.mjs`
- **LIVE(배포 전 Edge)**: 하와이·호놀룰루·괌·발리 OK · 사이판은 클라 공백 별칭으로 복구 예상 · 레위니옹·파타고니아는 **Edge 재배포 후** 재확인
- **배포**: `npx supabase functions deploy fetch-mrt-stays --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`

### 에이전트 핸드오프

- **유지**: Summary「숙소 찾기」·펼칠 때만 fetch · `v9` · PC 포털/모바일 전체화면
- **금지**: `VITE_` MRT 키 · TripLink · 호텔 핀/지오코딩 · `travelSpots.js` 전체 스캔
- **다음**: Edge 재배포 후 레위니옹·바릴로체·그린란드 EMPTY_TOTAL QA · 빈 결과 CTA(선택)
