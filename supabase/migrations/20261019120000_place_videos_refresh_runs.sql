-- Weekly refresh run log (service_role writes from refresh-place-videos edge).
-- RLS on, no anon/authenticated policies.

CREATE TABLE IF NOT EXISTS public.place_videos_refresh_runs (
  id bigserial PRIMARY KEY,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  mode text NOT NULL CHECK (mode IN ('report_only', 'dry_run', 'apply')),
  cutoff_days int NOT NULL,
  places int NOT NULL DEFAULT 0,
  examined int NOT NULL DEFAULT 0,
  removed int NOT NULL DEFAULT 0,
  updated int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  success boolean NOT NULL,
  error text
);

ALTER TABLE public.place_videos_refresh_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS place_videos_refresh_runs_finished_at_idx
  ON public.place_videos_refresh_runs (finished_at DESC);
