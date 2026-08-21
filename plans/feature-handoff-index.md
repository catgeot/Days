# 열린 feature — main 핸드오프 인덱스

**역할**: `main`에서 새 Cloud 세션을 열어도 **브랜치·PR·다음 제시어**를 즉시 찾을 수 있게 하는 SSOT.  
**규칙**: [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§1.2** · **§6** · [`AGENTS.md`](../AGENTS.md) Cloud 핸드오프.

| | |
|--|--|
| **에이전트 (시작)** | 사용자 첫 메시지에 **채팅명 형식**(`{주제} #{N}, …`) 또는 **`@plans/feature-handoff-index.md`** 가 있으면 **본 파일 해당 행만** Read → 표의 **다음 제시어**·브랜치 checkout. `.ai-context` 전문·코드베이스 광역 grep **생략**. |
| **에이전트 (종료)** | feature 세션 종료 시 **해당 주제 행 갱신** + 주제 플랜 **§9** + 최신 일지 2~5줄 + **§1.2 다음 제시어 블록** 복붙. |
| **main 동기화** | 위 3파일(`feature-handoff-index` · 플랜 §9 · 일지)은 **문서만 `main`에 반영** 가능(`.ai-context` **1.5.2**). feature 브랜치에만 있으면 `main` 부팅 세션이 맥락을 못 찾음 — **세션 종료마다 `main` cherry-pick 또는 docs 커밋** 권장. 원격 `main` push는 사람 요청 시. |
| **주제 종료** | PR 병합 후 해당 행 **삭제** 또는 `active: false` + 병합 SHA 기록. |

---

## 활성 목록

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

### 해안·해양 탐색

| | |
|--|--|
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
| **상태** | **main** `#42c` · 버킷 카드·Credits EN · **배포 후 PROD QA** |
| **main** | `#42b` tip — LogoPanel·FooterModal EN · `footerData` contentEn |
| **브랜치** | `main` (병합 후) · 잔존은 차차 |
| **플랜** | [`i18n-en-plan.md`](./i18n-en-plan.md) §9·§11·**§13** |
| **일지** | [`2026-08-21-project-log.md`](./2026-08-21-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/?lang=en` · `/korea?lang=en` · `/korea/theme/scenic?lang=en` |
| **VERIFY** | `audit:i18n` · `build` · `smoke:festival-detail-locale` · `smoke:browser-locale-hint` · scenic 스모크 |

**#42 범위 (테스트·최적화)**:

1. **회귀** — PROD `?lang=en` 홈·한국·명승·축제 상세·locale 토글 · **탐색 썸네일 EN** ✅
2. **로고·About** — LogoPanel·FooterModal·`footerData` contentEn ✅ **#42b**
3. **버킷·Credits** — `getSavedTripDisplayName` · `resolveMapboxAttribution` ✅ **#42c**
4. **성능** — 축제 `titleEn` en window 2nd fetch · sessionStorage v2 · locale 전환 ✅
5. **백로그(차차)** — SSOT 미등록 uiPlace · Updates EN · Preview 「작업 로그」·#28 PROD QA

**다음 제시어 (#42d)**:

```
영문화 #42d, PROD QA — Updates
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
main · ?lang=en · ReleaseNotesList
```

---

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
