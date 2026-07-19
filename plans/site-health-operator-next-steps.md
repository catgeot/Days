# gateo.kr 사이트 헬스 — 운영자 체크리스트 (2026-06-08)

**맥락**: [site-health-monitoring-plan.md](site-health-monitoring-plan.md) · 코드 S1~S4 완료 · **운영자 수동 작업 기록**

**운영 결정 (2026-06-08)**: **Smoke + E2E GHA만으로 충분** — UptimeRobot **도입 안 함**. Gemini 선불 **잔액 하한 자동 충전** 설정 완료.

---

## 0. GitHub — push 반영·워크플로 확인 (10분)

로컬 커밋이 원격에 올라간 뒤:

| # | 작업 | 완료 기준 |
|---|------|-----------|
| 0-1 | 저장소 **Actions** 탭에서 **E2E Health** 워크플로가 보이는지 확인 | 목록에 `Smoke Health` + `E2E Health` 둘 다 표시 |
| 0-2 | **E2E Health** → **Run workflow** 수동 1회 | **[x] 2026-06-08** Pass (~1m, 3 spec) |
| 0-3 | (선택) **Smoke Health**도 수동 1회 | P0·P1 Pass (이미 cron 동작 중이면 생략 가능) |
| 0-4 | GitHub 저장소 **Watch** → **All Activity** | 워크플로 실패 시 이메일 수신 |

**참고**

| 워크플로 | 주기 | 하는 일 |
|----------|------|---------|
| **Smoke Health** | 6시간마다 + 수동 | API·HTML·gemini-proxy ping (`smoke-health.mjs`) |
| **E2E Health** | 매일 09:00 UTC (18:00 KST) + 수동 | Playwright — 지구본·발리·MOONi 1턴 |

E2E 실패 시 Actions 실행 상세 → **Artifacts** → `playwright-report` 에 스크린샷·trace.

**UI 문구 변경 시 (재발 방지)** — PlaceCard 탭·버튼 라벨을 바꾸면 `e2e/*.spec.js`를 **같은 커밋**에서 갱신하고, 가능하면 `npm run test:e2e` 1회. Smoke만 통과해도 E2E는 옛 라벨로 매일 실패할 수 있음 (2026-07-09~18 「여행 위키」→「여행 스케치」사례 · 계획서 §2-B-1).

---

## 1. Phase 0 — 결제·쿼터 (코드 없음)

| # | 작업 | 상태 |
|---|------|------|
| 1-0 | Gemini 선불 **잔액 하한 자동 충전** | **[x] 2026-06-08** — 일정 금액 이하 시 자동 결제 |
| 1-1 | Gemini **Budget** 알림 50%·80%·100% | [ ] (선택 — 자동 충전으로 우선순위 낮음) |
| 1-2 | 선불 잔액 주 1회 확인 | [ ] (선택) |
| 1-3 | Supabase Usage · `gemini-proxy` 로그 북마크 | [ ] (선택) |
| 1-4 | Vercel Deploy·Error 알림 | [ ] (권장) |
| 1-5 | Mapbox monthly cap 북마크 | [ ] (선택) |

**보완**: 크레딧 소진·429 → **Smoke P0-3** (6h) + **E2E-3** (1일) GHA 알림.

---

## 2. UptimeRobot — **도입 안 함** (2026-06-08 결정)

Smoke(6h)·E2E(1일) GHA로 HTTP·UI·Gemini까지 커버 — **5분 ping 중복이라 생략**.

나중에 더 빠른 홈 다운 알림이 필요하면 [UptimeRobot](https://uptimerobot.com/) M1 `gateo.kr/` 만 추가해도 됨.

---

## 3. 로컬 스모크 — 장애 시 1차 확인 (5분, 필요할 때)

```bash
cd /c/dev/days
# 프로덕션(gateo.kr)
npm run smoke:health

# 로컬 Vite(dev · basic-ssl HTTPS) — npm run dev 실행 중일 때
npm run smoke:health:local
```

`.env.local`에 `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` 필요 (`=` 뒤 공백 금지).

로컬은 `https://localhost:5173`(self-signed). `http://`로 치면 스크립트가 HTTPS로 폴백한다.

| Probe | 의미 |
|-------|------|
| P0-1 | Site HTML (`SMOKE_SITE_URL` 또는 gateo.kr) |
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
| **E2E만** 실패 · Smoke 정상 | Annotation의 `getByRole` name vs 실 UI | `e2e/*.spec.js` 문구를 PlaceCard 등과 맞춤 · 푸시 후 E2E 수동 재실행 |
| 홈만 **5xx** | Smoke **P0-1** · E2E-1 | Vercel 배포·도메인 · Vercel Notifications |
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

## 6. 완료 체크리스트

- [x] 0. E2E Health GHA 수동 Pass (2026-06-08, ~1m)
- [x] 1-0. Gemini 선불 자동 충전
- [x] 2. UptimeRobot — **생략** (GHA만 사용)
- [ ] 3. (장애 시) `npm run smoke:health` 숙지
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
