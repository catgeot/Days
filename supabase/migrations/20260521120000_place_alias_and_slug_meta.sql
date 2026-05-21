-- slug-first identity: place_alias, archive tables, display meta columns
-- Run in Supabase SQL Editor or: supabase db push

-- ---------------------------------------------------------------------------
-- place_alias — 표기(alias) → canonical slug
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.place_alias (
  alias TEXT PRIMARY KEY,
  canonical_slug TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_place_alias_canonical
  ON public.place_alias (canonical_slug);

ALTER TABLE public.place_alias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "place_alias_select_anon" ON public.place_alias;
CREATE POLICY "place_alias_select_anon"
  ON public.place_alias FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.place_alias TO anon, authenticated;
GRANT ALL ON public.place_alias TO service_role;

-- ---------------------------------------------------------------------------
-- Display meta (05-04 Phase A2) — place_id remains PK; meta for URL recovery
-- ---------------------------------------------------------------------------
ALTER TABLE public.place_stats
  ADD COLUMN IF NOT EXISTS name_ko TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE public.place_wiki
  ADD COLUMN IF NOT EXISTS name_ko TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE public.place_videos
  ADD COLUMN IF NOT EXISTS name_ko TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE public.place_toolkit
  ADD COLUMN IF NOT EXISTS name_ko TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS source TEXT;

-- ---------------------------------------------------------------------------
-- Archive tables (newest-wins — no immediate DELETE without backup)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.place_wiki_archive
  (LIKE public.place_wiki INCLUDING ALL);
ALTER TABLE public.place_wiki_archive
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS superseded_by TEXT;

CREATE TABLE IF NOT EXISTS public.place_stats_archive
  (LIKE public.place_stats INCLUDING ALL);
ALTER TABLE public.place_stats_archive
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS superseded_by TEXT;

CREATE TABLE IF NOT EXISTS public.place_videos_archive
  (LIKE public.place_videos INCLUDING ALL);
ALTER TABLE public.place_videos_archive
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS superseded_by TEXT;

CREATE TABLE IF NOT EXISTS public.place_toolkit_archive
  (LIKE public.place_toolkit INCLUDING ALL);
ALTER TABLE public.place_toolkit_archive
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS superseded_by TEXT;

GRANT ALL ON public.place_wiki_archive TO service_role;
GRANT ALL ON public.place_stats_archive TO service_role;
GRANT ALL ON public.place_videos_archive TO service_role;
GRANT ALL ON public.place_toolkit_archive TO service_role;
