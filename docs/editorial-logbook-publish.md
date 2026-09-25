# Editorial LogBook — 사이트 관리 발행 가이드

공식 에디토리얼 기행문은 **개인 `/blog/write`가 아닌** service_role 경로로만 넣습니다.

## 배포 순서 (필수 게이트)

**1) Supabase migration → 2) 프론트 배포**

1. `supabase/migrations/20260925140000_reports_editorial_logbook.sql`을 **스테이징·프로덕션에 먼저** 적용한다.
2. 그 다음에 이 PR의 프론트를 배포한다.

프론트만 먼저 올리면 장소 탭 「관련 LogBook」 등이 새 컬럼 SELECT에서 실패할 수 있다. 코드는 **컬럼 없을 때 레거시 SELECT로 폴백**하지만, 에디토리얼 기능·피드 필터는 migration 이후가 정상 동작이다.

## 사전 조건

1. 위 migration 적용 완료
2. 로컬 `.env.local`: `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (리포에 커밋 금지)

## 초안 JSON 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `title` | ✓ | 제목 |
| `slug` | ✓ | kebab-case, 에디토리얼 고유 |
| `place_slug` | ✓ | `/place/{slug}` 연결 |
| `content` | ✓ | LogBook markdown. 사진 삽입 토큰: **`[사진 1]`**, **`[사진 2]`** … (1부터, `images` 배열 순서와 동일). `[LOGBOOK_PHOTO:n]`는 사용하지 않음 (런타임에서만 구형 alias). |
| `images` | 발행 시 ✓ | URL 문자열 또는 Unsplash attribution 객체 |
| `status` | ✓ | `draft` · `published` · `archived` |
| `disclosure_badge` | | 기본 `GATEO 에디터 · AI 보조 · 실제 방문기 아님` |

본문에 `[사진 N]`을 넣으면 상세 페이지는 **갤러리 상단 중복 없이** 본문에만 이미지를 끼워 넣는다.

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
- [ ] `draft` / `archived` 에디토리얼은 피드·공개 상세 미노출 (`status=published` + `is_public`)
