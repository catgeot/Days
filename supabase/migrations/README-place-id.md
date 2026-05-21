# place_id 규칙 (slug-first)

- **신규·마이그레이션 후**: `place_id` = canonical `slug` (예: `angkor-wat`, `uyuni-salt-flat`).
- **미매칭 좌표만**: `geo-{lat3}-{lng3}` (예: `geo-13.412-103.867`).
- **표시명**: `name_ko` / `name_en` 컬럼·`place_alias` 테이블 — Unsplash/YouTube/AI 검색어는 표시명 유지.

## 적용 순서

1. `20260521120000_place_alias_and_slug_meta.sql`
2. `20260521120100_seed_place_alias.sql`
3. `npm run migrate:place-id-to-slug -- --dry-run` (리포트 확인)
4. `npm run migrate:place-id-to-slug -- --apply`
5. 프론트 배포 + `npm run generate:canonical-place-id-map` 후 Edge `update-place-toolkit` 재배포
6. `npm run verify:place-slug-resolve` · `npm run toolkit:audit-place-id`
