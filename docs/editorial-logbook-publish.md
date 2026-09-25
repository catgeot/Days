# Editorial LogBook — 사이트 관리 발행 가이드

공식 에디토리얼 기행문은 **개인 `/blog/write`가 아닌** service_role 경로로만 넣습니다.

## 사전 조건

1. Supabase에 `supabase/migrations/20260925140000_reports_editorial_logbook.sql` 적용
2. 로컬 `.env.local`: `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (리포에 커밋 금지)

## 초안 JSON 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `title` | ✓ | 제목 |
| `slug` | ✓ | kebab-case, 에디토리얼 고유 |
| `place_slug` | ✓ | `/place/{slug}` 연결 |
| `content` | ✓ | 기존 LogBook markdown (`[LOGBOOK_PHOTO:n]` 지원) |
| `images` | 발행 시 ✓ | URL 문자열 또는 Unsplash attribution 객체 |
| `status` | ✓ | `draft` · `published` · `archived` |
| `disclosure_badge` | | 기본 `GATEO 에디터 · AI 보조 · 실제 방문기 아님` |

## CLI (권장)

```bash
npm run upsert:editorial-logbook -- scripts/fixtures/editorial-logbook-draft.sample.json
```

- `draft`: `is_public=false`, 피드에 안 보임
- `published`: `is_public=true`, `published_at`·`canonical_url` 자동 (`https://www.gateo.kr/blog/e/{slug}`)

## SQL 템플릿

`supabase/templates/editorial-logbook-insert.sql` — Supabase SQL Editor에서 postgres/service_role로 실행.

## 공개 URL

- 에디토리얼: `https://www.gateo.kr/blog/e/{slug}` (및 레거시 `/p/{id}`)
- 유저 글: `/p/{id}` · `/blog/{id}` (소유자) — 예: `/blog/60`

## QA 체크

- [ ] 공개 피드(`/blog?tab=public`) 에디토리얼 카드에 잠금 뱃지
- [ ] 상세 `/blog/e/{slug}` 동일 고지 + 이미지 크레딧
- [ ] 유저 글(`/p/60`)에는 뱃지 없음 · 작성자 라벨 유지
- [ ] JSON-LD `Article` + `author` Organization (개인 BlogPosting 아님)
- [ ] `draft`는 피드·공개 상세 미노출
