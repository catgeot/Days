-- Anonymous toolkit section correction reports (insert-only for anon).

CREATE TABLE IF NOT EXISTS public.toolkit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL,
  section text NOT NULL,
  note text NOT NULL,
  url text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open',
  CONSTRAINT toolkit_reports_section_chk CHECK (
    section IN (
      'safety', 'accommodation', 'apps', 'map_poi', 'flight', 'visa',
      'airport_transfer', 'transport', 'ferry_booking', 'pre_travel', 'connectivity'
    )
  ),
  CONSTRAINT toolkit_reports_note_len_chk CHECK (char_length(note) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS toolkit_reports_place_section_created_idx
  ON public.toolkit_reports (place_id, section, created_at DESC);

CREATE INDEX IF NOT EXISTS toolkit_reports_ip_hash_created_idx
  ON public.toolkit_reports (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

ALTER TABLE public.toolkit_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS toolkit_reports_insert_anon ON public.toolkit_reports;
CREATE POLICY toolkit_reports_insert_anon
  ON public.toolkit_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    place_id IS NOT NULL
    AND char_length(trim(place_id)) > 0
    AND char_length(trim(note)) > 0
  );

-- No SELECT for anon — service_role triage only.
GRANT INSERT ON public.toolkit_reports TO anon, authenticated;
GRANT ALL ON public.toolkit_reports TO service_role;
