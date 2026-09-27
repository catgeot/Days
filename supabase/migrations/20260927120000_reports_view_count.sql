-- Public logbook read count. Clients cannot write the column; only increment_report_view may.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.reports.view_count IS 'Public reads; session-deduped via increment_report_view';

CREATE OR REPLACE FUNCTION public.guard_reports_view_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.view_count := 0;
    RETURN NEW;
  END IF;

  IF current_setting('gateo.report_view_increment', true) IS DISTINCT FROM '1' THEN
    NEW.view_count := OLD.view_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_guard_view_count ON public.reports;

CREATE TRIGGER reports_guard_view_count
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_reports_view_count();

CREATE OR REPLACE FUNCTION public.increment_report_view(report_id_param text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_count integer;
BEGIN
  IF report_id_param IS NULL OR btrim(report_id_param) = '' THEN
    RETURN NULL;
  END IF;

  PERFORM set_config('gateo.report_view_increment', '1', true);

  UPDATE public.reports
  SET view_count = view_count + 1
  WHERE id::text = report_id_param
    AND coalesce(is_deleted, false) = false
    AND (
      (coalesce(is_editorial, false) = false AND is_public IS TRUE)
      OR (is_editorial IS TRUE AND status = 'published')
    )
  RETURNING view_count INTO next_count;

  RETURN next_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_report_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_report_view(text) TO anon, authenticated;
