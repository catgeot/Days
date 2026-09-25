-- Optional subtitle / lead line for LogBook detail & feed (user + editorial).

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS dek text;

COMMENT ON COLUMN public.reports.dek IS 'Short subtitle or lead sentence; long poetic titles stay in title, dek for display under H1';
