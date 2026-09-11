-- Wave1.5 D5-b — extended hero gallery cache (Wikimedia fetch)
CREATE TABLE IF NOT EXISTS event_hero_gallery (
  event_id text PRIMARY KEY,
  images jsonb NOT NULL,
  gallery_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_hero_gallery_updated
  ON event_hero_gallery (gallery_updated_at DESC);

ALTER TABLE event_hero_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_hero_gallery_select_anon" ON event_hero_gallery;
CREATE POLICY "event_hero_gallery_select_anon"
  ON event_hero_gallery FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.event_hero_gallery TO anon, authenticated;
GRANT ALL ON public.event_hero_gallery TO service_role;

-- Glossary term MOONi explanations (per event · term · locale)
CREATE TABLE IF NOT EXISTS event_term_glossary_cache (
  event_id text NOT NULL,
  term_id text NOT NULL,
  locale text NOT NULL DEFAULT 'ko',
  answer text NOT NULL,
  model text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, term_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_event_term_glossary_cache_updated
  ON event_term_glossary_cache (updated_at DESC);

ALTER TABLE event_term_glossary_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_term_glossary_cache_select_anon" ON event_term_glossary_cache;
CREATE POLICY "event_term_glossary_cache_select_anon"
  ON event_term_glossary_cache FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.event_term_glossary_cache TO anon, authenticated;
GRANT ALL ON public.event_term_glossary_cache TO service_role;
