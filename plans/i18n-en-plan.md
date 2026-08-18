# 영문화 (English UI) — 세션별 실행 플랜

**세션 표기**: `영문화 #{N}, {단계}` ([`cloud-preview-continuity.md`](./cloud-preview-continuity.md))  
**고정 브랜치**: `cursor/en`  
**공유 slug**: `/qa/en` → Preview `/` (locale 토글·홈 우선)  
**Cloud 연속성**: [`feature-handoff-index.md`](./feature-handoff-index.md) · [`AGENTS.md`](../AGENTS.md)

### 채팅명 복붙 (Cursor 새 채팅 제목)

| #N | 단계 | 채팅명 (복붙) | 상태 |
|----|------|---------------|------|
| 0 | 문서·브랜치 | `영문화 #0, 문서·브랜치` | ✅ |
| 1 | 기반 | `영문화 #1, locale 기반` | ✅ |
| 2 | 홈·PlaceCard | `영문화 #2, 홈·PlaceCard` | ✅ |
| 3 | 한국 투톱 | `영문화 #3, korea·theme` | ✅ |
| 4 | SEO·릴리스 | `영문화 #4, SEO·릴리스` | ✅ |
| 5 | PROD 병합·QA | `영문화 #5, PROD 병합·QA` | ✅ |
| 6 | PROD QA 확인 | `영문화 #6, PROD QA 확인` | (배포 후 사람) |
| 7 | PlaceCard 세부 | `영문화 #7, PlaceCard 세부 영문화` | ✅ Preview |
| 8 | 한국 테마 나머지 | `영문화 #8, 한국 테마 나머지` | ✅ Preview |
| 9 | 로그북/대시보드 | `영문화 #9, 로그북·대시보드` | ✅ Preview |
| 10 | 잔여·QA | `영문화 #10, 잔여·Preview QA` | ✅ Preview |
| 11 | 병합·PROD | `영문화 #11, 병합·PROD QA` | ✅ merge · PROD QA (사람) |
| 12 | PROD 확인 | `영문화 #12, PROD QA 확인` | (배포 후 사람) |

세션마다 `#1` 리셋 금지 · `#N` = Cloud 순번.

---

## 0. 한 줄 결론

| 질문 | 답 |
|------|----|
| 목표? | **UI 카피 영문화** — 기존 레이아웃·톤 유지, 문자열만 locale별 분기 |
| SSOT? | 신규 `src/i18n/` (키·ko/en JSON) · 컴포넌트는 키 참조 |
| URL? | **1차**: 쿼리 `?lang=en` + `localStorage` · **2차(합의 후)**: `/en/…` prefix |
| 데이터? | `travelSpots` 등 **표시명**은 `name_en`/`country_en` 우선 · JSON spots **직접 편집 금지** |
| 한국 전용? | `/korea` · `/korea/theme/*` · TourAPI·축제 SSOT — **Phase 3+** · 1~2차는 글로벌 홈·PlaceCard |
| VERIFY | `npm run build` · (추가) `smoke:place-label-slug` · locale smoke는 #1 이후 |

---

## 1. 현재 상태 (2026-08-18 · #0)

- **i18n 라이브러리 없음** — `react-i18next`/`i18next` 미도입
- **한글 하드코딩** — 홈·PlaceCard·공통 레이아웃·affiliate `locale: ko-KR`
- **영문 데이터 일부 존재** — `name_en`, `country_en`, geocoding `accept-language=en`
- **Mapbox** — `@mapbox/mapbox-gl-language` (지도 라벨 한글) · locale 연동은 #1+
- **금지** · `travelSpots.js` 전체 Read · UI 리디자인 · spots JSON 직편집

---

## 2. Phase 로드맵

| Phase | 세션 | 산출 | VERIFY |
|-------|------|------|--------|
| **#0** | 문서·브랜치 | 플랜 · `cursor/en` · `/qa/en` · 핸드오프 3종 | `build` |
| **#1** | locale 기반 | `i18next` · `LocaleProvider` · `?lang=` · 헤더 토글 · 공통 레이아웃 키 | `build` |
| **#2** | 홈·PlaceCard | 지구본·검색·탭·툴킷 주요 카피 en | `build` · `smoke:place-label-slug` |
| **#3** | 한국 투톱 | `/korea` · `/korea/theme/scenic` — **사람 합의 후** 범위 | `build` |
| **#4** | SEO·릴리스 | `hreflang` · sitemap · 릴리스 노트(승인 후) | `build` |
| **#5** | PROD 병합 | PR #132 → `main` | `build` |
| **#7+** | 세부·확장 | PlaceCard 세부 · 한국 테마 나머지 · 로그북/대시보드 | `build` |

**우선순위**: 글로벌 여행 discovery(홈·PlaceCard) → **PlaceCard 세부** → 한국 테마 나머지 → 로그북/대시보드(별 트랙).

---

## 3. 기술 가드

1. **기존 비주얼 유지** — 버튼·레이아웃·색 교체 금지 (`.ai-context` §4.1 5)
2. **키 네이밍** — `domain.section.key` (예: `home.globe.chip.paradise`)
3. **폴백** — en 키 없으면 ko · ko 없으면 키 문자열(개발만)
4. **Affiliate** — `affiliate.js` locale 파라미터를 `LocaleProvider`와 동기( `#2` )
5. **E2E** — 한글 accessibility name 의존 테스트는 키/라벨 변경 시 동기 ([`site-health-monitoring-plan.md`](./site-health-monitoring-plan.md))

---

## 4. Preview · QA

| | |
|--|--|
| **브랜치** | `cursor/en` |
| **git Preview** | `https://days-git-cursor-en-catgeots-projects.vercel.app/` |
| **공유** | `https://www.gateo.kr/qa/en` |
| **QA 경로** | Preview `/` · `?lang=en` ( #1 이후 ) · PlaceCard 샘플 slug 2~3 |
| **Mapbox** | git Preview URL **1회** 등록 (사람) |

---

## 9. 핸드오프

**인덱스**: [`feature-handoff-index.md`](./feature-handoff-index.md)

**상태 (#11)**: PR [#134](https://github.com/catgeot/Days/pull/134) **main 병합** · Vercel PROD 배포 후 `/qa/en` 재확인

**다음 제시어** (`cloud-preview-continuity` §1.2):

```
영문화 #12, PROD QA 확인
@plans/feature-handoff-index.md
@plans/2026-08-18-project-log.md
@plans/i18n-en-plan.md
main · www.gateo.kr/qa/en · ?lang=en · /blog
금지: 새 랜덤 브랜치 · travelSpots.js 전체 Read · UI 리디자인
```
