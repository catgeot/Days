-- 20261006113000_place_videos_fail_cache_and_edge_rate_limits.sql
-- DRAFT (stage 3v). Schema needed by the fetch-place-videos D1 (rate limit) + D4 (negative cache,
-- backoff) deploy (youtube-D1-D4.md, approval A6 2026-10-03). Additive only; no data rewrite.
-- Must be live BEFORE the fetch-place-videos S1+D1+D4 deploy (the function reads/writes these).
-- Independent of the gallery stages 2-6b; requires stage 1 (place_videos client writes closed).
--   place_videos: last_error, fail_count, next_retry_at  (existing videos are never cleared)
--   edge_rate_limits + edge_rate_limit_hit(): fixed-window counters, service_role only
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.place_videos
  ADD COLUMN IF NOT EXISTS last_error    text CHECK (last_error IS NULL OR char_length(last_error) <= 300),
  ADD COLUMN IF NOT EXISTS fail_count    integer NOT NULL DEFAULT 0 CHECK (fail_count BETWEEN 0 AND 1000),
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;
-- Clients only SELECT place_videos (stage 1 closed writes). Column-level: nothing extra to grant.

CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  key          text NOT NULL CHECK (char_length(key) BETWEEN 1 AND 200),
  window_start timestamptz NOT NULL,
  count        integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;   -- no policies
REVOKE ALL ON TABLE public.edge_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.edge_rate_limits TO service_role;

-- Atomic increment-and-check. Returns true when the call is allowed (count after increment <= limit).
-- Windows: p_window_seconds (60 = per minute, 86400 = per day). Old windows are pruned opportunistically.
CREATE OR REPLACE FUNCTION public.edge_rate_limit_hit(p_key text, p_window_seconds integer, p_limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_start timestamptz;
  v_n     integer;
BEGIN
  IF p_key IS NULL OR char_length(p_key) NOT BETWEEN 1 AND 200
     OR p_window_seconds NOT BETWEEN 1 AND 2592000 OR p_limit NOT BETWEEN 0 AND 1000000 THEN
    RAISE EXCEPTION 'edge_rate_limit_hit: bad arguments' USING ERRCODE = '22023';
  END IF;
  v_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.edge_rate_limits AS r (key, window_start, count)
  VALUES (p_key, v_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET count = r.count + 1
  RETURNING count INTO v_n;
  IF random() < 0.01 THEN
    DELETE FROM public.edge_rate_limits WHERE window_start < now() - interval '2 days';
  END IF;
  RETURN v_n <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.edge_rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.edge_rate_limit_hit(text, integer, integer) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
