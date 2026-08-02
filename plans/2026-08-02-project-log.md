# 2026-08-02 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## 에이전트 규칙 — 로컬 UI 커밋 보류 vs Cloud 매 턴 push

**상태**: ✅ `8a6bc24` · `main` ahead 1 (push는 사람 요청 시)

- 의도 명시: 로컬 UI 커밋 보류 = 색·폰트 등 미세 조율 **커밋 난발(5+) 방지** · Cloud feature = **Preview 로드를 위해 매 턴 커밋·push 필수**
- SSOT: `.ai-context` **1.5.1**/**§4.1 6** · `AGENTS.md` Cloud · `gateo-project-context.mdc`
- User Rule「Git commit/push — verification gate」(`16942118`) 동일 취지로 직접 갱신 — LOCAL 커밋 보류(난발 방지) · CLOUD feature 매 턴 커밋·push(Preview)
