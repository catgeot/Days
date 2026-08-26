# 열린 feature — main 핸드오프 인덱스

**역할**: `main`에서 새 Cloud 세션을 열어도 **브랜치·PR·다음 제시어**를 즉시 찾을 수 있게 하는 SSOT.  
**규칙**: [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§1.2** · **§6** · [`AGENTS.md`](../AGENTS.md) Cloud 핸드오프.

| | |
|--|--|
| **에이전트 (시작)** | 사용자 첫 메시지에 **채팅명 형식**(`{주제} #{N}, …`) 또는 **`@plans/feature-handoff-index.md`** 가 있으면 **본 파일 해당 행만** Read → 표의 **다음 제시어**·브랜치 checkout. `.ai-context` 전문·코드베이스 광역 grep **생략**. |
| **에이전트 (종료)** | feature 세션 종료 시 **해당 주제 행 갱신** + 주제 플랜 **§9** + 최신 일지 2~5줄 + **§1.2 다음 제시어 블록** 복붙. |
| **main 동기화** | 위 3파일은 **`main` + `origin/main` 반영 필수** (§1.5.4). feature **종료 시** `merge origin/main` + `audit:docs-handoff-sync` PASS. **feature에 `plans/**` 커밋 금지**. 절차: [`docs-on-main-workflow.md`](./docs-on-main-workflow.md) §충돌 방지.
| **주제 종료** | PR 병합 후 해당 행 **삭제** 또는 `active: false` + 병합 SHA 기록. |

---

## 활성 목록

### 세계 행사·축제 일정 연동

| | |
|--|--|
| **상태** | **v2 #17 완료** — EventStayStrip Trip prefill · packages/list · event-detail-flight |
| **다음** | #18 sample #13~#15 Tier0.5 · 15 URL smoke · Mooni FAB |
| **브랜치** | `cursor/world-events-efa3` |
| **PR** | [#153](https://github.com/catgeot/Days/pull/153) (v2 draft) |
| **feature tip** | `2554ca52` — #17 Trip prefill · WhiteLabelWidget |
| **플랜** | [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) · [`world-events-plan.md`](./world-events-plan.md) §9 |
| **Q&A** | [`world-events-qa-index.md`](./world-events-qa-index.md) |
| **운영** | [`world-events-management.md`](./world-events-management.md) §6.1 |
| **샘플** | [`world-events-sample-log.md`](./world-events-sample-log.md) |
| **일지** | [`2026-08-26-project-log.md`](./2026-08-26-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/world-events` · `/place/vienna` · `/korea` · 홈 「세계의 행사」 |
| **VERIFY** | `smoke:world-events` · `smoke:world-events-detail` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `build` |
| **Preview** | `https://www.gateo.kr/qa/world-events` · git `…-git-cursor-world-events-efa3-….vercel.app` |

**P2 MVP (main)**: Wave1 15건 · PlaceCard · `/world-events` 허브 · TripWindow 프리셋 · 홈 진입  
**v2 (브랜치)**: `/world-events/:eventId` · Tier0~2 · 샘플 15건 · **v2 델타 main 병합 = #18**

**다음 제시어** (#18):

```
세계행사 일정 #18, 샘플13~15 · 위젯 마감
@plans/feature-handoff-index.md
@plans/2026-08-26-project-log.md
@plans/world-events-detail-ux-plan.md
브랜치 cursor/world-events-efa3 · PR #153 · /world-events/hanoi-tet-2027
금지: 새 feature 브랜치 · worldEvents.json 직편집 · UI 리디자인 · Wave2 overrides
작업: sample #13 prague #14 marrakech #15 hanoi · 15 URL 전건 smoke · Mooni FAB
```

---

### AI 큐레이션 — 지도·무니 핸드오프

| | |
|--|--|
| **상태** | **main 병합** PR #130 (PC 핸드오프) · PROD 배포 후 **모바일 QA** |
| **main** | PR #130 merge 후 SHA 확인 |
| **플랜** | [`blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) |
| **일지** | [`2026-08-17-project-log.md`](./2026-08-17-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/blog/curation?debug=curation` — 모바일 「전체 지도」·「무니에게 묻기」 |
| **VERIFY** | `smoke-curation-place-bridge` · `npm run build` |

**다음 제시어**:

```
AI 큐레이션 #10, 모바일 PROD QA
@plans/feature-handoff-index.md
@plans/2026-08-17-project-log.md
www.gateo.kr/blog/curation?debug=curation · iPhone/Android 전체지도·무니
```

---

### 검색노출 (한·영 SEO)

| | |
|--|--|
| **상태** | **#24 RSS·canonical 재점검 PASS** · 에이전트 세션표 **완료** · 잔여 = 사람 GSC baseline · `/en/` prefix(합의 후) |
| **브랜치** | **`main`** |
| **플랜** | [`en-seo-followup-plan.md`](./en-seo-followup-plan.md) §9 |
| **일지** | [`2026-08-25-project-log.md`](./2026-08-25-project-log.md) |
| **제출 URL** | Sitemap `https://www.gateo.kr/sitemap.xml` (1133 URL) · RSS KO `https://www.gateo.kr/rss.xml` · RSS EN `https://www.gateo.kr/rss-en.xml` · `robots.txt`에 sitemap 선언됨 |
| **에이전트 VERIFY** | `smoke:rss-canonical` · `smoke:gsc-baseline` · `smoke:gsc-baseline-prod` · `audit:place-seo-en` · `build` |
| **사람** | GSC·네이버 서치어드바이저 sitemap/RSS 제출 · GSC 173건 baseline CSV(로컬 only) |

**다음 제시어** (백로그·합의 후):

```
검색노출 #25, /en/ URL prefix (합의 후)
@plans/feature-handoff-index.md
@plans/en-seo-followup-plan.md
/en/ prefix 합의 · i18n-en-plan 2차 URL과 동기
```

---

### 해안·해양 탐색
| **상태** | **main 병합 완료** (2026-08-16) · PROD 배포 후 QA |
| **main** | `14cc78ef` — PR #122 병합 + 뷰 폴링 제거 |
| **플랜** | [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md) §9 |
| **일지** | [`2026-08-16-project-log.md`](./2026-08-16-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/` — 모바일 대양 4 + 해역 리스트 연속 탭 |
| **VERIFY** | `smoke-sea-basin-rail` · `build` |

**다음 제시어**:

```
해안 해양 탐색 #17, PROD QA
@plans/feature-handoff-index.md
@plans/2026-08-16-project-log.md
main · www.gateo.kr 모바일 대양·해역 연속 탭
```

---

### 영문화 (English UI) — 2차 확장

| | |
|--|--|
| **상태** | **main 병합** PR #149 · PROD 배포 후 QA |
| **main** | `452c4c25` |
| **플랜** | [`i18n-en-plan.md`](./i18n-en-plan.md) §9 |
| **일지** | [`2026-08-24-project-log.md`](./2026-08-24-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/place/yap/planner?lang=en` — 배너·MICRONESIA 권역 EN |
| **VERIFY** | `audit:airports` · `audit:i18n` · `build` |

**#45 완료**: 플래너 bannerNote·bookingNote·권역 notesEn — PR #149 merge

**다음 제시어 (#46)**:

```
영문화 #46, PROD QA — 플래너 banner EN
@plans/feature-handoff-index.md
@plans/2026-08-24-project-log.md
@plans/i18n-en-plan.md
main · www.gateo.kr/place/yap/planner?lang=en
금지: GT 일괄 백필
```


## 행 추가 템플릿 (새 Cloud feature)

```markdown
### {주제}

| | |
|--|--|
| **상태** | … |
| **브랜치** | `cursor/…` |
| **tip** | `{sha}` |
| **플랜** | [`…-plan.md`](./…-plan.md) §9 |
| **일지** | [`YYYY-MM-DD-project-log.md`](./…) |
| **Preview** | `https://…-git-…vercel.app/…` |
| **VERIFY** | `npm run …` |

**다음 제시어**:

\`\`\`
{주제} #{N}, {단계}
@plans/feature-handoff-index.md
@plans/YYYY-MM-DD-project-log.md
@plans/{주제}-plan.md
브랜치 cursor/… · PR #… · …
금지: …
\`\`\`
```
