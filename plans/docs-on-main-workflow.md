# 로직 = feature · 문서 = main (필수)

**역할**: Cloud·장기 feature 작업 시 **코드와 핸드오프 문서를 어느 브랜치에 둘지** 에이전트 SSOT.  
**요약 규칙**: [`.ai-context.md`](../.ai-context.md) **§1.5.4** · 절차 상세는 [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§6**.

---

## 한 줄 (오해 금지)

| | 브랜치 | `origin` push |
|--|--------|---------------|
| **로직·UI·SSOT 데이터·스크립트** | 고정 **feature** (`cursor/…`) | **feature** (Cloud는 매 턴) |
| **핸드오프·계획·일지·규칙 문서** | **`main`에 반영 필수** | **`origin/main` docs-only** — feature 세션 종료 시 **즉시** (허가·QA 불필요) |

**`main`에서 코드 작업 금지** (짧은 버그픽스·공항 SSOT 등 **§1.5.2 예외**만).  
**feature에만 문서 두고 끝내기 금지** — `main` 부팅 세션이 맥락을 못 찾음.

---

## 무엇이 「문서」인가

| 문서 (→ `main` 필수) | 로직 (→ feature만, PR로 `main` 병합) |
|----------------------|----------------------------------------|
| `plans/**` (일지·플랜·인덱스·운영 가이드) | `src/**` · `supabase/**` |
| [`feature-handoff-index.md`](./feature-handoff-index.md) | `scripts/**` (audit·generate·smoke) |
| 주제 플랜 **§9** · 핸드오프 절 | `scripts/data/*-overrides.mjs` → `generate:*` 산출물 |
| `.ai-context.md` · `AGENTS.md` | `package.json` · `vercel.json` (리다이렉트 등 동작) |
| `.cursor/rules/**` | `src/pages/Home/data/*.json` (spots 직편집 금지) |

**회색지대**: 플랜 **본문**(Phase 1~8)은 feature에서 크게 쓰되, **§9·다음 제시어**는 `main`과 **동일 내용**이어야 함. 큰 플랜 수정 시 본문+§9를 같이 `main`에 올린다.

---

## Cloud feature — 세션 **시작** (필수)

1. `git fetch origin && git checkout main && git pull origin main`
2. [`feature-handoff-index.md`](./feature-handoff-index.md) 해당 행 → **고정 브랜치** 확인
3. `git checkout <고정-feature>` → `git merge origin/main` (문서 SSOT 맞추기)
4. 제시어 핀: `@plans/feature-handoff-index.md` + 일지 + 플랜 §9

**금지**: `main` 체크아웃 상태에서 `src/` 수정 · 인덱스 없이 플랜만 읽고 브랜치 추측.

---

## Cloud feature — 세션 **종료** (필수 체크리스트)

**A. feature (코드 + 문서 초안)**

- [ ] 검증 PASS → **한글 커밋** + **`git push origin <feature>`**
- [ ] 인덱스 행 · 플랜 §9 · 일지 2~5줄 · 다음 제시어 블록(§1.2) 갱신
- [ ] (해당 시) Preview 작업 로그 · `/qa/…`

**B. `main` (문서 SSOT — 생략 금지)**

- [ ] `git checkout main && git pull origin main`
- [ ] 문서 반영: **cherry-pick**(feature의 docs 커밋) 또는 **동일 내용 docs-only 커밋**
- [ ] 대상 최소 3종: `feature-handoff-index.md` · 주제 플랜 §9 · `plans/YYYY-MM-DD-project-log.md`
- [ ] **`git push origin main`** — **docs-only** · 허가 요청·Preview QA **없음**

**C. feature 다시 맞추기**

- [ ] `git checkout <feature> && git merge origin/main` (다음 세션에 옛 인덱스 방지)

**한 커밋에 코드+문서가 섞였으면**: feature에는 그대로 push → `main`에는 **문서 파일만** 골라 cherry-pick 또는 수동 복사 후 docs-only 커밋. **코드 파일을 `main`에 넣지 않음.**

---

## 자주 하는 오해

| 오해 | 사실 |
|------|------|
| 「문서는 main이니까 `main`에서 코드도 수정」 | **코드는 feature**. `main`은 맥락·규칙 저장소. |
| 「feature에 일지 썼으니 OK」 | **feature만으로 끝 금지**. `main` push 필수. |
| 「`@plans/…` 읽으면 main 문서」 | 워킹 트리 = **체크아웃 브랜치**. feature면 **merge main** 후 읽기. |
| 「main push는 항상 사람 허가」 | **코드** push·병합만 허가/PR. **docs-only `origin/main`** = 세션 종료 시 **에이전트 즉시 push**. |
| 「cherry-pick은 선택」 | Cloud feature 세션 종료 시 **필수 절차**(§6). |
| 「문서 커밋에 Preview QA」 | **불필요**. 사이트 무영향. |

---

## 다중 feature · 충돌

`feature-handoff-index.md`는 **전 주제 공유 파일** → 동시에 여러 Cloud 주제를 돌리면 충돌 가능.

- 한 번에 **한 주제**만 인덱스 수정 권장
- 충돌 시: `main`에서 merge 해결 → 각 feature에 `merge main`
- 주제 종료 시: 인덱스 행 **삭제** 또는 `active: false` + 병합 SHA

---

## 짧은 `main` 직행 (이 워크플로 **해당 없음**)

공항·페리 audit 통과 수정 · 한 줄 버그픽스 · **문서만** — **§1.5.2** `main` 직행.  
이때도 로직이 `main`에 있으면 **문서는 같은 커밋에 함께** 두면 됨(별도 feature 불필요).

---

## 관련 SSOT

| 문서 | 절 |
|------|-----|
| [`.ai-context.md`](../.ai-context.md) | **§1.5.3** 판단표 · **§1.5.4** 본 규칙 요약 |
| [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) | §1.2 제시어 · **§6** main 동기화 |
| [`feature-handoff-index.md`](./feature-handoff-index.md) | 활성 feature 표 |
| [`.cursor/rules/gateo-docs-on-main.mdc`](../.cursor/rules/gateo-docs-on-main.mdc) | 에이전트 alwaysApply 요약 |
