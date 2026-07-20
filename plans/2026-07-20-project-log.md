# 2026-07-20 프로젝트 일지

이전: [`2026-07-19-project-log.md`](./2026-07-19-project-log.md)

## place_wiki 매거진 — 잘못된 슬러그·아카이브 복원

**상태**: ✅ DB 복원 적용 · 별칭 우선순위 수정 · 커밋 대기

- **원인**: slug-first 마이그레이션 시 관문 `keywords`(울루루→alice-springs, 친퀘테레→la-spezia, 파타고니아→el-calafate, 하와이→honolulu)가 공식 `spot.name` 별칭을 덮어씀 → 빈 slug 껍데기가 승자, 원본 매거진은 `place_wiki_archive`로 밀림. 탭에서 비어 보여 「매거진 생성」이 돌아감.
- **별칭 수정**: `buildStaticAliasToSlugMap` · `buildSpotLookup` — keywords < 공식명 < 명시 aliases. `travel-spot-place-id-aliases.mjs`에 울루루·친퀘테레·파타고니아·하와이 고정.
- **복원** (`npm run restore:place-wiki-archive -- --apply`): 로마·쿠알라룸푸르·울루루·친퀘테레·파타고니아·아이투타키·포클랜드·하와이 → 공식 slug. 비-SSOT `australia` 행 아카이브 후 삭제.
- **마이그레이션 방어**: `migrate-place-id-to-slug` 승자 선정에 매거진 본문 점수 우선.
- **아직 매거진 없음(신규 생성 대상)**: malta, vatican, ubud, brunei, minneapolis, bahamas, sri-jayawardenapura, el-calafate 등.
