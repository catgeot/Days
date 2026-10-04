-- Rollback for 20261006120000_edge_rate_limit_cost.sql (manual only).
-- Restores the 3v definition of edge_rate_limit_hit exactly (3 arguments, increment 1).
-- Does not drop edge_rate_limits or place_videos columns. Those belong to 3v.
-- Roll back the fetch-place-videos deploy that passes p_cost BEFORE this file, or that
-- deploy will 503 on the missing 4-arg signature.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

DROP FUNCTION IF EXISTS public.edge_rate_limit_hit(text, integer, integer, integer);

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
