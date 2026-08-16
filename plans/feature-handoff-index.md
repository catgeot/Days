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

### 해안·해양 탐색 (모바일 크래시 — PR #122)

| | |
|--|--|
| **상태** | **열림** · #14 코드 fix push · **모바일 Preview QA 대기** |
| **브랜치** | `cursor/ocean-chip-crash-1ed2` (**재사용** · 새 브랜치 금지) |
| **PR** | [#122](https://github.com/catgeot/Days/pull/122) |
| **tip** | `d50c1f14` |
| **플랜** | [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md) §9 |
| **일지** | [`2026-08-16-project-log.md`](./2026-08-16-project-log.md) — 「에이전트 핸드오프」 |
| **Preview** | `https://days-git-cursor-ocean-chip-crash-1ed2-catgeots-projects.vercel.app/` (Mapbox 호스트 1회 등록) |
| **VERIFY** | `smoke-sea-basin-rail` · `build` |

**다음 제시어**:

```
해안 해양 탐색 #15, 모바일 해역 연속 탭 Preview QA
@plans/feature-handoff-index.md
@plans/2026-08-16-project-log.md
@plans/coast-sea-explore-plan.md
브랜치 cursor/ocean-chip-crash-1ed2 · PR #122 · Preview QA
금지: main 새 브랜치 · seaBasins.json 직접 편집 · UI 리디자인 · computerUse QA
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
