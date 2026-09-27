-- Public logbook likes and comments.
-- Clients insert or delete their own rows. like_count and comment_count are trigger-owned.
-- view_count is untouched; increment_report_view remains its only writer.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.reports.like_count IS 'Denormalized public likes; only reaction triggers may write';
COMMENT ON COLUMN public.reports.comment_count IS 'Denormalized public comments; only reaction triggers may write';

CREATE OR REPLACE FUNCTION public.guard_reports_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.like_count := 0;
    NEW.comment_count := 0;
    RETURN NEW;
  END IF;

  IF current_setting('gateo.report_reaction_counts', true) IS DISTINCT FROM '1' THEN
    NEW.like_count := OLD.like_count;
    NEW.comment_count := OLD.comment_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_guard_reaction_counts ON public.reports;

CREATE TRIGGER reports_guard_reaction_counts
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_reports_reaction_counts();

CREATE TABLE IF NOT EXISTS public.report_likes (
  report_id text NOT NULL CONSTRAINT report_likes_report_id_nonempty CHECK (btrim(report_id) <> ''),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS report_likes_user_idx
  ON public.report_likes (user_id);

CREATE TABLE IF NOT EXISTS public.report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text NOT NULL CONSTRAINT report_comments_report_id_nonempty CHECK (btrim(report_id) <> ''),
  user_id uuid NOT NULL,
  body text NOT NULL CONSTRAINT report_comments_body_len CHECK (char_length(btrim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_comments_report_created_idx
  ON public.report_comments (report_id, created_at);

CREATE OR REPLACE FUNCTION public.report_is_reaction_target(report_id_param text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reports
    WHERE id::text = report_id_param
      AND coalesce(is_deleted, false) = false
      AND (
        (coalesce(is_editorial, false) = false AND is_public IS TRUE)
        OR (is_editorial IS TRUE AND status = 'published')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_report_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target text;
BEGIN
  target := CASE WHEN TG_OP = 'DELETE' THEN OLD.report_id ELSE NEW.report_id END;

  PERFORM set_config('gateo.report_reaction_counts', '1', true);

  UPDATE public.reports
  SET
    like_count = (
      SELECT count(*)::integer FROM public.report_likes WHERE report_id = target
    ),
    comment_count = (
      SELECT count(*)::integer FROM public.report_comments WHERE report_id = target
    )
  WHERE id::text = target;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS report_likes_sync_counts ON public.report_likes;
CREATE TRIGGER report_likes_sync_counts
  AFTER INSERT OR DELETE ON public.report_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_report_reaction_counts();

DROP TRIGGER IF EXISTS report_comments_sync_counts ON public.report_comments;
CREATE TRIGGER report_comments_sync_counts
  AFTER INSERT OR DELETE ON public.report_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_report_reaction_counts();

ALTER TABLE public.report_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_likes_select_own ON public.report_likes;
CREATE POLICY report_likes_select_own
  ON public.report_likes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS report_likes_insert_own ON public.report_likes;
CREATE POLICY report_likes_insert_own
  ON public.report_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.report_is_reaction_target(report_id)
  );

DROP POLICY IF EXISTS report_likes_delete_own ON public.report_likes;
CREATE POLICY report_likes_delete_own
  ON public.report_likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS report_comments_select_public ON public.report_comments;
CREATE POLICY report_comments_select_public
  ON public.report_comments
  FOR SELECT
  TO anon, authenticated
  USING (public.report_is_reaction_target(report_id));

DROP POLICY IF EXISTS report_comments_insert_own ON public.report_comments;
CREATE POLICY report_comments_insert_own
  ON public.report_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.report_is_reaction_target(report_id)
  );

DROP POLICY IF EXISTS report_comments_delete_own ON public.report_comments;
CREATE POLICY report_comments_delete_own
  ON public.report_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON FUNCTION public.report_is_reaction_target(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_is_reaction_target(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.sync_report_reaction_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_reports_reaction_counts() FROM PUBLIC;

GRANT SELECT, INSERT, DELETE ON TABLE public.report_likes TO authenticated;
GRANT SELECT ON TABLE public.report_comments TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.report_comments TO authenticated;
