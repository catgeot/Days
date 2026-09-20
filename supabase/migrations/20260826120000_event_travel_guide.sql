-- Tier3 AI EventTravelGuide cache (world events detail v2 Phase C)
-- Apply via Supabase SQL Editor or `supabase db push`.

CREATE TABLE IF NOT EXISTS event_travel_guide (
  event_id text PRIMARY KEY,
  guide jsonb NOT NULL,
  schema_version text NOT NULL DEFAULT '0.1',
  model text,
  guide_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_travel_guide_updated
  ON event_travel_guide (guide_updated_at DESC);

ALTER TABLE event_travel_guide ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_travel_guide_select_anon" ON event_travel_guide;
CREATE POLICY "event_travel_guide_select_anon"
  ON event_travel_guide FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.event_travel_guide TO anon, authenticated;
GRANT ALL ON public.event_travel_guide TO service_role;
