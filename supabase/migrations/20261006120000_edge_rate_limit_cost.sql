-- 20261006120000_edge_rate_limit_cost.sql
-- Separate from 20261006113000 (3v). 3v is hash-locked for the 2026-10-05 03:12 KST prod run.
-- Apply ONLY after 3v is live. Do not edit 3v.
-- Deploy order: 3v (scheduled) → this cost migration (needs approval) → fetch-place-videos edge.
--
-- PostgreSQL CREATE OR REPLACE cannot change an argument list in place. A second overload
-- whose last argument has a default makes 3-argument calls "function is not unique".
-- Drop only the 3-arg overload from 3v, then create the 4-arg function. Callers that omit
-- p_cost still increment by 1. YouTube search.list passes p_cost = 100.
-- SECURITY DEFINER, search_path, and the service_role-only grant match 3v.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

DROP FUNCTION IF EXISTS public.edge_rate_limit_hit(text, integer, integer);

CREATE OR REPLACE FUNCTION public.edge_rate_limit_hit(
  p_key text,
  p_window_seconds integer,
  p_limit integer,
  p_cost integer DEFAULT 1
)
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
     OR p_window_seconds NOT BETWEEN 1 AND 2592000
     OR p_limit NOT BETWEEN 0 AND 1000000
     OR p_cost NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'edge_rate_limit_hit: bad arguments' USING ERRCODE = '22023';
  END IF;
  v_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.edge_rate_limits AS r (key, window_start, count)
  VALUES (p_key, v_start, p_cost)
  ON CONFLICT (key, window_start) DO UPDATE SET count = r.count + p_cost
  RETURNING count INTO v_n;
  IF random() < 0.01 THEN
    DELETE FROM public.edge_rate_limits WHERE window_start < now() - interval '2 days';
  END IF;
  RETURN v_n <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.edge_rate_limit_hit(text, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.edge_rate_limit_hit(text, integer, integer, integer) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
