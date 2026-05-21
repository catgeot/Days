# slug-first 마이그레이션 — 세션 인수인계

**상태**: 코드·SQL·스크립트 **커밋 대상 완료** · Supabase **미적용** · `migrate --apply` **미실행**  
**이전 맥락**: [2026-05-07-project-log.md](./2026-05-07-project-log.md) (진단) · [2026-05-04-project-log.md](./2026-05-04-project-log.md) (Phase A 스키마)  
**운영 규칙**: [supabase/migrations/README-place-id.md](../supabase/migrations/README-place-id.md)

---

## 왜 하는가 (한 줄)

동일 여행지(앙코르 와트 / 시엠립 / Angkor Wat)가 **다른 `place_id`**로 DB에 쌓여 플래너·위키·갤러리가 갈라짐 → **`place_id` = canonical `slug`**, 표시명은 `place_alias`·`name_ko`로 분리.

---

## 완료된 것 (이 세션)

| 항목 | 경로 |
|------|------|
| 스키마 + archive | `supabase/migrations/20260521120000_place_alias_and_slug_meta.sql` |
| alias 시드 1408건 | `supabase/migrations/20260521120100_seed_place_alias.sql` |
| slug 해석·마이그레이션 | `scripts/lib/resolve-canonical-slug.mjs`, `scripts/migrate-place-id-to-slug.mjs` |
| 시드 생성 | `scripts/generate-place-alias-seed.mjs` |
| 검증 | `scripts/verify-place-slug-resolve.mjs` |
| 프론트 slug-first 쓰기 | `src/utils/travelSpotResolve.js` (`getPlaceStatsId`) |
| Edge slug 저장 | `supabase/functions/_shared/resolveCanonicalPlaceId.ts`, `canonicalPlaceIdMap.json` (slug→slug) |
| 플래너 | `PlannerTab.jsx`, `toolkitPlaceIdResolve.js` |
| reconcile archive | `scripts/reconcile-place-toolkit-place-id.mjs` |
| dry-run 백업·리포트 | `scripts/outputs/place_id_backup_20260521/` |

**dry-run 요약** (2026-05-21): wiki 430행·stats 974·videos 241·toolkit 275 — toolkit unresolved 9( blocklist 등). `duplicateSlug 0` (audit).

---

## 미완료 (다음 세션 — 순서 고정)

- [ ] **S1** Supabase SQL 2개 적용
- [ ] **S2** `npm run migrate:place-id-to-slug -- --dry-run` 재확인
- [ ] **S3** `npm run migrate:place-id-to-slug -- --apply`
- [ ] **S4** 프론트 배포 + `generate:canonical-place-id-map` + Edge `update-place-toolkit` 재배포
- [ ] **S5** gateo.kr 스모크 + audit/verify

---

## 다음 세션 제시어 (복사용)

### S1 — Supabase 스키마·시드

```
@plans/2026-05-21-slug-first-migration-handoff.md @supabase/migrations/README-place-id.md

slug-first Wave 0: Supabase에 아래 SQL을 순서대로 적용했는지 확인·실행해 주세요.
1) 20260521120000_place_alias_and_slug_meta.sql
2) 20260521120100_seed_place_alias.sql
적용 후 place_alias 행 수(≈1408), archive 테이블 존재 여부를 확인해 주세요.
```

### S2 — dry-run 재확인

```
@plans/2026-05-21-slug-first-migration-handoff.md

SQL 적용 완료. npm run migrate:place-id-to-slug -- --dry-run 실행 후
scripts/outputs/place_id_backup_*/migrate-report-*.json 의
rekeyed / merged / unresolved 를 요약해 주세요.
특히 place_toolkit angkor-wat 병합·unresolved 9건(blocklist)이 기대와 맞는지 검토해 주세요.
```

### S3 — apply (데이터 이전)

```
@plans/2026-05-21-slug-first-migration-handoff.md

dry-run OK. npm run migrate:place-id-to-slug -- --apply 실행해 주세요.
(newest-wins, archive 후 원본 삭제). 완료 후 place_toolkit 에서 place_id='angkor-wat' 단일 행인지 SQL로 확인해 주세요.
```

### S4 — 배포

```
@plans/2026-05-21-slug-first-migration-handoff.md

마이그레이션 apply 완료. 프론트 배포 전제로
npm run generate:canonical-place-id-map
Edge update-place-toolkit 재배포 체크리스트를 정리해 주세요.
```

### S5 — 스모크·Gate

```
@plans/2026-05-21-slug-first-migration-handoff.md

npm run verify:place-slug-resolve
npm run toolkit:audit-place-id  (duplicateSlug 0 유지)
gateo.kr: /place/angkor-wat/planner — TRAVEL_SPOTS 카드·「시엠립」감정검색·지도클릭이 동일 플래너 본문인지 확인해 주세요.
```

### 문제 발생 시

```
@plans/2026-05-21-slug-first-migration-handoff.md
@scripts/outputs/place_id_backup_20260521/migrate-report-20260521.json

slug-first migrate apply 중 [에러 메시지] 발생. 백업 NDJSON 기준 롤백·부분 재적용 방안을 제시해 주세요.
```

---

## npm 명령 참고

```bash
npm run generate:place-alias-seed    # 시드 SQL 재생성 (--write 내장)
npm run migrate:place-id-to-slug -- --dry-run
npm run migrate:place-id-to-slug -- --apply
npm run migrate:place-id-to-slug -- --apply --tables=place_wiki,place_stats,place_videos
npm run verify:place-slug-resolve
npm run toolkit:audit-place-id
npm run generate:canonical-place-id-map
```

---

## 검증 체크리스트 (완료 시 체크)

- [ ] `place_toolkit.place_id = 'angkor-wat'` 단일 행 (archive에 시엠립/Siem Reap 등)
- [ ] `place_wiki` / `place_stats` — `angkor-wat` + `name_ko` 백필
- [ ] `toolkit:audit-place-id` — duplicateSlug 0
- [ ] `verify:place-slug-resolve` — 앙코르·교토·쿄토 통과

---

## 세션 종료 시 갱신 규칙

1. 위 **미완료** 체크박스를 실제 진행에 맞게 업데이트
2. apply/report 경로·이슈 한 줄 기록
3. `.ai-context.md` 1줄 맥락만 반영 (전체 복붙 금지)
