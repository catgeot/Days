-- Template: publish one editorial LogBook after migration 20260925140000_reports_editorial_logbook.sql
-- Run in Supabase SQL editor with service_role / postgres only (not anon).
-- Replace placeholders; keep disclosure_badge as fixed KO copy.

INSERT INTO public.reports (
  title,
  dek,
  slug,
  place_slug,
  location,
  content,
  images,
  date,
  is_editorial,
  is_public,
  is_deleted,
  status,
  published_at,
  disclosure_badge,
  series,
  locale,
  canonical_url,
  user_id,
  weather
) VALUES (
  '제목',
  NULL,
  'paris-guide-2026-01',
  'paris',
  '파리',
  E'## 본문 (markdown)\n\n[사진 1]',
  '[{"url":"https://example.com/hero.jpg","photographer":"Name","photographer_url":"https://unsplash.com/@name","unsplash_url":"https://unsplash.com/photos/xxx"}]'::jsonb,
  CURRENT_DATE,
  true,
  false,
  false,
  'draft',
  NULL,
  'GATEO 에디터 · AI 보조 · 실제 방문기 아님',
  'tier-a-guides',
  'ko',
  NULL,
  NULL,
  'GATEO'
);

-- To publish: set status = 'published', is_public = true, published_at = now(),
-- canonical_url = 'https://www.gateo.kr/blog/e/' || slug
