# 2026-06-06 프로젝트 일지 — 사이트 헬스 스모크·GHA cron

**직전**: [`2026-06-04-project-log.md`](2026-06-04-project-log.md) · **계획**: [`site-health-monitoring-plan.md`](site-health-monitoring-plan.md)

---

## 배경

- Gemini 선불 크레딧 소진(429)으로 MOONi AI 채팅 중단 — 앱·Supabase 프록시는 정상, 외부 API·결제 이슈.
- `.env.local` `VITE_SUPABASE_ANON_KEY` **`=` 뒤 공백** → JWT 401 가능성 수정.

## 구현 (S1·S2)

- [`scripts/smoke-health.mjs`](../scripts/smoke-health.mjs) — P0(사이트·Supabase·gemini-proxy)·P1(place·sitemap) · 429→warn · CI `SMOKE_FAIL_ON_WARN`
- [`npm run smoke:health`](../package.json) · [`.github/workflows/smoke-health.yml`](../.github/workflows/smoke-health.yml) — 6시간 cron + `workflow_dispatch`
- [`plans/site-health-monitoring-plan.md`](site-health-monitoring-plan.md) · `.ai-context` 6절 · `plans/README.md`

## 다음 (운영자)

- ~~GitHub Actions Secrets + Smoke Health Pass~~ ✅ 2026-06-08
- **잔여**: UptimeRobot M1·M2 · Phase 0 Billing · **S5** 런북(선택)

**2026-06-08** — **S3** `geminiProxyError.js` · 401/429/503 사용자 문구 · ChatModal·usePlaceChat error role.
