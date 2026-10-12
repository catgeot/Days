-- TAGO route cache for transport-proxy. service_role only.
-- Train rows are reused for about 24h. Bus rows are same-day only (enforced in the function).

CREATE TABLE IF NOT EXISTS public.tago_route_cache (
  cache_key text PRIMARY KEY,
  mode text NOT NULL CHECK (mode IN ('train', 'expBus', 'suburbsBus')),
  dep_id text NOT NULL,
  arr_id text NOT NULL,
  service_date date NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tago_route_cache_key_len CHECK (char_length(cache_key) BETWEEN 12 AND 180),
  CONSTRAINT tago_route_cache_id_len CHECK (
    char_length(dep_id) BETWEEN 4 AND 32
    AND char_length(arr_id) BETWEEN 4 AND 32
  )
);

CREATE INDEX IF NOT EXISTS idx_tago_route_cache_fetched_at
  ON public.tago_route_cache (fetched_at DESC);

ALTER TABLE public.tago_route_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.tago_route_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.tago_route_cache TO service_role;
