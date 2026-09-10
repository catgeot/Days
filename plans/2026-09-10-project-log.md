# 2026-09-10 프로젝트 일지

직전: [`2026-09-09-project-log.md`](./2026-09-09-project-log.md)

## 팔경 contentId — PR #185 main 병합 및 양구 수목원 자체 큐레이션 반영 (Cloud)

- **세션** `팔경contentId #P2-MERGE, 양구수목원 자체큐레이션 및 PR #185 main 병합`
- **브랜치** `cursor/palgyeong-cid` → `main` squash merge (`53b21b00`) · PR [#185](https://github.com/catgeot/Days/pull/185) (MERGED)
- **완료**
  1. **양구 수목원(`yanggu-arboretum`) 자체 큐레이션(curated) SSOT 반영**:
     - TourAPI 단독 관광지(`contentTypeId: 12`) 부재 확인 (산림청 제35호 공립수목원·양구9경 제1경임에도 단독 contentId 없고 코스 subdetail만 존재)
     - 상세 개요(`overview` 253자: 대암산 생태식물원, DMZ 야생화분재원, 목재문화체험관 등 순수 명소 설명)
     - 도로명 주소(`addr1`: 강원특별자치도 양구군 동면 숨골로310번길 131)
     - 공식 웹사이트(`homepage`: `https://www.yanggu.go.kr/arboretum/`)
     - 한국관광공사 사진갤러리(`searchPhoto`) 고화질 공식 사진 5장(`imageUrl`, `galleryUrls`)
     - `generate-korea-scenic-spots.mjs`에 `addr1`, `homepage`, `galleryUrls` 속성 전달 지원 추가
  2. **자체 큐레이션 지원 도구 추가**:
     - `scripts/report-curated-scenic-candidates.mjs`: `contentId: null` 51건 상태 자동 분석 (완료 1건, 부분 36건, 미흡 14건)
     - `scripts/search-tourapi-photos.mjs`: 키워드 기반 한국관광공사 사진갤러리 실시간 조회
     - `package.json`에 `report:curated-scenic-candidates` 스크립트 등록
  3. **PR #185 main squash merge 완료**:
     - 사용자 지시에 따라 PR #185 검증 통과 후 `main`에 병합 (`53b21b00`)
     - P0(579/876 HIT)+P1(68 HIT)+P2(820/871 충족, 94.1%) contentId 수집 작업 전면 종결 및 main 배포 준비 완료
  4. **후속 세션용 작업 가이드 및 큐 완비**:
     - 지침서: [`korea-curated-spots-guide.md`](./korea-curated-spots-guide.md) (양구수목원 5단계 프로토콜 SSOT)
     - 작업 큐: [`curated-scenic-spots-queue.md`](./curated-scenic-spots-queue.md) (R01 사진 미보유 14건, R02 18건, R03 18건)
     - 핸드오프 인덱스: [`feature-handoff-index.md`](./feature-handoff-index.md)에 신규 큐레이션 트랙 등록
- **VERIFY** `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-local-scenic-content-ids` · `smoke:scenic-detail-locale` · `build` ALL PASS
- **다음** 명소 자체 큐레이션 #1 — R01 사진 미보유 14건(금강소나무숲길, 비내섬, 대통령기록관 등) 보강

```
명소 자체 큐레이션 #1, R01 사진 미보유 14건 보강
@plans/feature-handoff-index.md
@plans/curated-scenic-spots-queue.md
@plans/korea-curated-spots-guide.md
브랜치 cursor/curated-scenic
금지: AI 허구 본문 작성 금지 · 저작권 미확인 사진 금지 · feature에 plans/** 커밋
작업: R01 14건(금강소나무숲길·비내섬·대통령기록관 등) searchPhoto 사진 및 공식 개요·주소·홈페이지 SSOT 반영
```
