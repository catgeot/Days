-- TourAPI 국내축제 공유 캐시 (S4)
-- list:rolling12:{start}:{end} · detail:{contentId}

CREATE TABLE IF NOT EXISTS public.tourapi_festival_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'tourapi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tourapi_festival_cache_key_len CHECK (
    char_length(cache_key) >= 8 AND char_length(cache_key) <= 128
  )
);

CREATE INDEX IF NOT EXISTS idx_tourapi_festival_cache_fetched_at
  ON public.tourapi_festival_cache (fetched_at DESC);

ALTER TABLE public.tourapi_festival_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tourapi_festival_cache_select_anon" ON public.tourapi_festival_cache;
CREATE POLICY "tourapi_festival_cache_select_anon"
  ON public.tourapi_festival_cache FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.tourapi_festival_cache TO anon, authenticated;
GRANT ALL ON public.tourapi_festival_cache TO service_role;
