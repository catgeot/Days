-- DRAFT ONLY. Do not apply this file to a remote database from the agent or CI.
-- Reel likes. Clients cannot read or write social_reel_likes; RPCs are the only path.
-- Flag: VITE_GATEO_SOCIAL_LIKES (default off) or ?social_likes=1. UI hides the heart when the flag is off.
--
-- Rollback (in order):
--   1. Turn the flag off (unset VITE_GATEO_SOCIAL_LIKES, drop ?social_likes=1) so the heart is not rendered.
--   2. Remove the heart UI that calls these RPCs.
--   3. Then drop the functions and the table:
--        DROP FUNCTION IF EXISTS public.toggle_social_reel_like(text, boolean);
--        DROP FUNCTION IF EXISTS public.get_social_reel_like_counts(text[]);
--        DROP FUNCTION IF EXISTS public.get_my_social_reel_likes(text[]);
--        DROP TABLE IF EXISTS public.social_reel_likes;
-- anon_key_hash is reserved for phase 2 and stays null in phase 1.

BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.social_reel_likes (
  reel_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id),
  anon_key_hash text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_reel_likes_reel_id_format CHECK (reel_id ~ '^reel-\d+$'),
  CONSTRAINT social_reel_likes_reel_user_unique UNIQUE (reel_id, user_id)
);

COMMENT ON TABLE public.social_reel_likes IS
  'Login likes for /social reels. No client policies; RPCs only. anon_key_hash is phase 2.';
COMMENT ON COLUMN public.social_reel_likes.anon_key_hash IS
  'Phase 2 anonymous key. Null in phase 1.';

ALTER TABLE public.social_reel_likes ENABLE ROW LEVEL SECURITY;
-- No SELECT / INSERT / UPDATE / DELETE policies: direct table access is denied.

REVOKE ALL ON TABLE public.social_reel_likes FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.toggle_social_reel_like(p_reel_id text, p_desired boolean)
RETURNS TABLE (like_count integer, liked boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_allowed boolean;
  v_count integer;
  v_liked boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'toggle_social_reel_like: login required' USING ERRCODE = '28000';
  END IF;
  IF p_reel_id IS NULL OR p_reel_id !~ '^reel-\d+$' OR p_desired IS NULL THEN
    RAISE EXCEPTION 'toggle_social_reel_like: bad arguments' USING ERRCODE = '22023';
  END IF;

  -- 60 writes per hour per user. edge_rate_limit_hit is service_role-only; this definer runs as owner.
  v_allowed := public.edge_rate_limit_hit('srl:' || v_uid::text, 3600, 60);
  IF v_allowed IS NOT TRUE THEN
    RAISE EXCEPTION 'toggle_social_reel_like: rate limit' USING ERRCODE = '54000';
  END IF;

  IF p_desired THEN
    INSERT INTO public.social_reel_likes (reel_id, user_id)
    VALUES (p_reel_id, v_uid)
    ON CONFLICT ON CONSTRAINT social_reel_likes_reel_user_unique DO NOTHING;
  ELSE
    DELETE FROM public.social_reel_likes
    WHERE reel_id = p_reel_id
      AND user_id = v_uid;
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.social_reel_likes
  WHERE reel_id = p_reel_id;

  SELECT EXISTS (
    SELECT 1
    FROM public.social_reel_likes
    WHERE reel_id = p_reel_id
      AND user_id = v_uid
  ) INTO v_liked;

  like_count := v_count;
  liked := v_liked;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_social_reel_like_counts(p_reel_ids text[])
RETURNS TABLE (reel_id text, like_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.reel_id, count(l.user_id)::integer AS like_count
  FROM unnest(COALESCE(p_reel_ids, ARRAY[]::text[])) AS r(reel_id)
  LEFT JOIN public.social_reel_likes AS l ON l.reel_id = r.reel_id
  WHERE r.reel_id ~ '^reel-\d+$'
  GROUP BY r.reel_id;
$$;

CREATE OR REPLACE FUNCTION public.get_my_social_reel_likes(p_reel_ids text[])
RETURNS TABLE (reel_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.reel_id
  FROM public.social_reel_likes AS l
  WHERE l.user_id = auth.uid()
    AND l.reel_id = ANY(COALESCE(p_reel_ids, ARRAY[]::text[]))
    AND l.reel_id ~ '^reel-\d+$';
$$;

REVOKE ALL ON FUNCTION public.toggle_social_reel_like(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_social_reel_like(text, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.get_social_reel_like_counts(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_social_reel_like_counts(text[]) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_my_social_reel_likes(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_social_reel_likes(text[]) TO authenticated;

COMMIT;
NOTIFY pgrst, 'reload schema';
