-- Official editorial place reviews (Paris pilot). Existing rows stay non-editorial.

ALTER TABLE public.place_reviews
  ADD COLUMN IF NOT EXISTS is_editorial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS persona_label text,
  ADD COLUMN IF NOT EXISTS disclosure text;

COMMENT ON COLUMN public.place_reviews.is_editorial IS 'GATEO official editorial review; excluded from user average rating';
COMMENT ON COLUMN public.place_reviews.persona_label IS 'Short persona label; UI prefixes GATEO 리뷰어 · ';
COMMENT ON COLUMN public.place_reviews.disclosure IS 'Optional AI/editorial notice shown near the review';

CREATE OR REPLACE FUNCTION public.guard_place_review_editorial_fields()
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
    NEW.persona_label := NULL;
    NEW.disclosure := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.is_editorial := OLD.is_editorial;
    NEW.persona_label := OLD.persona_label;
    NEW.disclosure := OLD.disclosure;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS place_reviews_guard_editorial ON public.place_reviews;

CREATE TRIGGER place_reviews_guard_editorial
  BEFORE INSERT OR UPDATE ON public.place_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_place_review_editorial_fields();
