# gateo.kr 사이트 헬스 — 운영자 다음 할 일 (2026-06-08)

**맥락**: [site-health-monitoring-plan.md](site-health-monitoring-plan.md) · 코드 S1~S4 완료 · **이 문서 = 사람(운영자)만 하는 일**

완료 시 각 항목 `[ ]` → `[x]`로 표시하세요.

---

## 0. GitHub — push 반영·워크플로 확인 (10분)

로컬 커밋이 원격에 올라간 뒤:

| # | 작업 | 완료 기준 |
|---|------|-----------|
| 0-1 | 저장소 **Actions** 탭에서 **E2E Health** 워크플로가 보이는지 확인 | 목록에 `Smoke Health` + `E2E Health` 둘 다 표시 |
| 0-2 | **E2E Health** → **Run workflow** → **Run workflow** 수동 1회 | 초록 Pass (home·place·mooni 3 spec) |
| 0-3 | (선택) **Smoke Health**도 수동 1회 | P0·P1 Pass (이미 cron 동작 중이면 생략 가능) |
| 0-4 | GitHub 저장소 **Watch** → **All Activity** | 워크플로 실패 시 이메일 수신 |

**참고**

| 워크플로 | 주기 | 하는 일 |
|----------|------|---------|
| **Smoke Health** | 6시간마다 + 수동 | API·HTML·gemini-proxy ping (`smoke-health.mjs`) |
| **E2E Health** | 매일 09:00 UTC (18:00 KST) + 수동 | Playwright — 지구본·발리·MOONi 1턴 |

E2E 실패 시 Actions 실행 상세 → **Artifacts** → `playwright-report` 에 스크린샷·trace.

---

## 1. Phase 0 — 결제·쿼터 알림 (1~2시간, 코드 없음)

| # | 작업 | 어디서 | 완료 기준 |
|---|------|--------|-----------|
| 1-1 | Gemini **Budget** 알림 50%·80%·100% | [Google AI Studio](https://aistudio.google.com/) · [Cloud Billing](https://console.cloud.google.com/billing) | 테스트·실제 Budget 메일 1통 이상 수신 확인 |
| 1-2 | 선불 **크레딧** 잔액 주 1회 확인 습관 | AI Studio | 캘린더 리마인더(예: 매주 월요일) 등록 |
| 1-3 | Supabase **Usage** 알림 | [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 `phdjnbfitvmrguqzverm` | Usage 알림 ON · Edge Functions → `gemini-proxy` 로그 북마크 |
| 1-4 | Vercel **Deploy·Error** 알림 | Vercel 프로젝트 → Settings → Notifications | 배포 실패·런타임 에러 메일 ON |
| 1-5 | Mapbox **월간 cap** | [Mapbox Account](https://account.mapbox.com/) → Statistics | Statistics 페이지 북마크 · cap 여유 확인 |

**수용 목표**: Gemini 크레딧 소진 시 **24시간 이내** 운영자 알림 (Smoke P0-3가 보완).

---

## 2. UptimeRobot — 외부 HTTP ping (15분, 코드 없음)

[UptimeRobot](https://uptimerobot.com/) (또는 Better Stack) 무료 계정:

| Monitor | Friendly Name (예) | URL | Monitoring Interval |
|---------|-------------------|-----|---------------------|
| **M1** | gateo-home | `https://gateo.kr/` | **5 minutes** |
| **M2** | gateo-bali | `https://gateo.kr/place/bali` | **15 minutes** |

**설정 순서**

1. **Add New Monitor** → Monitor Type: **HTTP(s)**
2. URL 입력 · Interval 설정
3. **Alert Contacts**에 이메일 추가·활성화
4. 저장 후 Status **Up** (녹색) 확인

**점검하지 않는 것** (Smoke·E2E가 담당): Gemini 크레딧 · MOONi UI · Mapbox 렌더.

---

## 3. 로컬 스모크 — 장애 시 1차 확인 (5분, 필요할 때)

```powershell
cd c:\dev\days
npm run smoke:health
```

`.env.local`에 `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` 필요 (`=` 뒤 공백 금지).

| Probe | 의미 |
|-------|------|
| P0-1 | gateo.kr HTML |
| P0-2 | Supabase alive |
| P0-3 | gemini-proxy + Gemini ping (429 → 크레딧 부족 warn) |
| P1-1 | `/place/bali` |
| P1-2 | `/sitemap.xml` |

---

## 4. 증상별 빠른 대응 (런북 요약)

상세 런북은 **S5** (`plans/site-health-runbook.md`)에서 문서화 예정.

| 사용자/알림 증상 | 1차 확인 | 조치 |
|------------------|----------|------|
| MOONi 「AI 사용량 한도」·「통신 실패」 | Smoke **P0-3** | AI Studio 선불 크레딧 충전 · Supabase Secrets `GEMINI_API_KEY` |
| Smoke·E2E 전체 **401** | anon key | Vercel·`.env.local` `VITE_SUPABASE_ANON_KEY` trim · 재배포 |
| 홈만 **5xx** / UptimeRobot Down | UptimeRobot M1 | Vercel 배포·도메인 · Vercel Notifications |
| 지구본 blank | Mapbox Statistics | `VITE_MAPBOX_TOKEN` · quota |
| 갤러리만 빈 화면 | — | Unsplash/Pexels 키·rate limit |

---

## 5. (선택) S5 — AI 런북 문서화

코드 없음 · Cursor 세션 1회.

```
@plans/site-health-monitoring-plan.md S5 구현.
plans/site-health-runbook.md — 증상별 1차 확인·조치·대시보드 링크.
```

---

## 6. 완료 체크리스트 (한 줄)

- [ ] 0. E2E Health GHA 수동 Pass
- [ ] 1. Phase 0 Billing 알림 5종
- [ ] 2. UptimeRobot M1·M2 Up
- [ ] 3. (장애 시) `npm run smoke:health` 사용법 숙지
- [ ] 5. (선택) S5 런북

**릴리스 노트**: S3·S4는 내부 운영·안정성 — `releaseNotes.js` 반영은 **합의 시에만**.

---

## 참고 링크

| 문서 | 경로 |
|------|------|
| 전체 계획 | [site-health-monitoring-plan.md](site-health-monitoring-plan.md) |
| 일지 | [2026-06-08-project-log.md](2026-06-08-project-log.md) |
| Smoke 워크플로 | [`.github/workflows/smoke-health.yml`](../.github/workflows/smoke-health.yml) |
| E2E 워크플로 | [`.github/workflows/e2e-health.yml`](../.github/workflows/e2e-health.yml) |
