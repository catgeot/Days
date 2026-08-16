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

### 해안·해양 탐색

| | |
|--|--|
| **상태** | **main 병합 완료** (2026-08-16) · PROD 배포 후 QA |
| **브랜치** | `cursor/coast-sea-plan-8c05` → `main` |
| **PR** | [#118](https://github.com/catgeot/Days/pull/118) |
| **main tip** | `7a2bd052` 이후 — 해역 QA·리스트 고정 패치 반영 |
| **플랜** | [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md) §4.6·§9 |
| **일지** | [`2026-08-16-project-log.md`](./2026-08-16-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/` — 모바일 테마 → **바다** 탭 |
| **VERIFY** | `smoke-sea-basin-rail` · `audit:sea-basins` · `build` |

**다음 제시어** (새 채팅 첫 메시지·제목에 그대로 복붙):

```
해안 해양 탐색 #10, 계층 해역 리스트·바다버튼 톤다운
@plans/feature-handoff-index.md
@plans/2026-08-16-project-log.md
@plans/coast-sea-explore-plan.md
브랜치 main · PROD QA · smoke:sea-basin-rail

## 이번 세션 목표 (우선순위)

1. **계층 해역 리스트 (1순위)** — 뷰포트 동적 1줄 칩 대신 **고정 계층 UI** 검토·구현
   - **1단**: 상위 대양(고정, 예: 태평양·대서양·인도양·지중해 권역)
   - **2단**: 중위 권역 2~3줄 (parentOcean·tier2)
   - **3단**: 소해역(tier1·작은 만) — 넓게 볼 때는 1~2단 위주, 줌/선택 시 3단 부상
   - SSOT: `seaBasins.json` `parentOcean`·`tier` · `seaBasinRail.js` · `GlobeFaceRegionRail.jsx`
   - 기존 `pickVisibleSeaBasins`·`seaRailPickContext` 축소 로직은 **계층 고정**으로 대체·단순화 검토

2. **바다 전환 버튼 시인성 1단계 하향** — `SeaBasinListButton` `prominent` 톤(글로우·ring) 완화, 나라 칩과 균형

3. **보류(이번 세션 후)** — 플랜에서 배제됐던 **중분류 칩**(소권역형 해양 구역) 분할. 1번 안정 후 별 세션.

## 금지
- `seaBasins.json` spots 직접 편집 → overrides → `generate:sea-basins`
- 5테마 6번째 칩·`GLOBE_CATEGORY_IDS`에 coast 추가
- 승인 없는 전면 UI 리디자인(레일·카테고리 바 톤 전체 교체)
- 중분류 칩을 1번보다 먼저 큰 범위로 착수
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
