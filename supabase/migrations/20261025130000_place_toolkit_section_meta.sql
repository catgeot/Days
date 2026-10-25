-- Per-section toolkit freshness metadata (plan: toolkit-freshness 2026-10-25).
-- Apply via Supabase migration workflow; not required for client-only rollout.

CREATE TABLE IF NOT EXISTS public.place_toolkit_section_meta (
  place_id text NOT NULL,
  section text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  source_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'unchecked',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (place_id, section),
  CONSTRAINT place_toolkit_section_meta_section_chk CHECK (
    section IN (
      'safety', 'accommodation', 'apps', 'map_poi', 'flight', 'visa',
      'airport_transfer', 'transport', 'ferry_booking', 'pre_travel', 'connectivity'
    )
  )
);

CREATE INDEX IF NOT EXISTS place_toolkit_section_meta_checked_at_idx
  ON public.place_toolkit_section_meta (checked_at);

ALTER TABLE public.place_toolkit_section_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS place_toolkit_section_meta_select_public ON public.place_toolkit_section_meta;
CREATE POLICY place_toolkit_section_meta_select_public
  ON public.place_toolkit_section_meta
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.place_toolkit_section_meta TO anon, authenticated;
GRANT ALL ON public.place_toolkit_section_meta TO service_role;

-- Backfill: treat row toolkit_updated_at as initial checked_at per present category.
INSERT INTO public.place_toolkit_section_meta (place_id, section, checked_at, status)
SELECT
  pt.place_id,
  sec.section,
  coalesce(pt.toolkit_updated_at, pt.created_at, now()),
  'backfill'
FROM public.place_toolkit pt
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY[
    'safety', 'accommodation', 'apps', 'map_poi', 'flight', 'visa',
    'airport_transfer', 'transport', 'ferry_booking', 'pre_travel', 'connectivity'
  ]::text[]) AS section
) sec
WHERE pt.essential_guide IS NOT NULL
  AND jsonb_typeof(pt.essential_guide) = 'object'
  AND (pt.essential_guide -> 'categories' -> sec.section) IS NOT NULL
ON CONFLICT (place_id, section) DO NOTHING;
