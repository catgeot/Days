-- Editorial LogBook (system-published) on existing reports table.
-- User /blog/write rows stay non-editorial; service_role seeds editorial posts.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS is_editorial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS place_slug text,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS disclosure_badge text,
  ADD COLUMN IF NOT EXISTS series text,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ko',
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS content_blocks jsonb;

COMMENT ON COLUMN public.reports.is_editorial IS 'GATEO official editorial logbook; not a traveler visit post';
COMMENT ON COLUMN public.reports.slug IS 'Unique URL slug for editorial posts (service_role only)';
COMMENT ON COLUMN public.reports.status IS 'draft | published | archived (editorial workflow; user posts ignore)';
COMMENT ON COLUMN public.reports.disclosure_badge IS 'Fixed KO disclosure; default set on editorial publish';
COMMENT ON COLUMN public.reports.content_blocks IS 'Optional block JSON; markdown in content remains primary for render';

CREATE UNIQUE INDEX IF NOT EXISTS reports_editorial_slug_key
  ON public.reports (slug)
  WHERE slug IS NOT NULL AND is_editorial = true;

CREATE INDEX IF NOT EXISTS reports_editorial_published_idx
  ON public.reports (published_at DESC NULLS LAST)
  WHERE is_editorial = true AND status = 'published' AND coalesce(is_deleted, false) = false;

-- Editorial rows may omit traveler user_id (system content).
ALTER TABLE public.reports
  ALTER COLUMN user_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_reports_editorial_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_editorial := false;
    NEW.slug := NULL;
    NEW.place_slug := NULL;
    NEW.place_id := NULL;
    NEW.status := 'published';
    NEW.published_at := NULL;
    NEW.disclosure_badge := NULL;
    NEW.series := NULL;
    NEW.locale := coalesce(NEW.locale, 'ko');
    NEW.canonical_url := NULL;
    NEW.content_blocks := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.is_editorial := OLD.is_editorial;
    NEW.slug := OLD.slug;
    NEW.place_slug := OLD.place_slug;
    NEW.place_id := OLD.place_id;
    NEW.status := CASE WHEN OLD.is_editorial THEN OLD.status ELSE NEW.status END;
    NEW.published_at := OLD.published_at;
    NEW.disclosure_badge := OLD.disclosure_badge;
    NEW.series := OLD.series;
    NEW.locale := OLD.locale;
    NEW.canonical_url := OLD.canonical_url;
    NEW.content_blocks := OLD.content_blocks;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_guard_editorial ON public.reports;

CREATE TRIGGER reports_guard_editorial
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_reports_editorial_fields();
