-- TourAPI 국내 관광지(type12) 카탈로그 — 테마여행 S13
-- 목록 필드만 저장 · 주 1회 sync · detail 전수 금지

CREATE TABLE IF NOT EXISTS public.tourapi_attraction (
  content_id TEXT PRIMARY KEY,
  content_type_id TEXT NOT NULL DEFAULT '12',
  title TEXT NOT NULL,
  addr1 TEXT,
  addr2 TEXT,
  area_code TEXT,
  sigungu_code TEXT,
  cat1 TEXT,
  cat2 TEXT,
  cat3 TEXT,
  mapx DOUBLE PRECISION,
  mapy DOUBLE PRECISION,
  first_image TEXT,
  tel TEXT,
  modified_time TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tourapi_attraction_content_id_digits CHECK (
    content_id ~ '^\d{1,32}$'
  )
);

CREATE INDEX IF NOT EXISTS idx_tourapi_attraction_active_area
  ON public.tourapi_attraction (active, area_code)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_tourapi_attraction_active_geo
  ON public.tourapi_attraction (mapy, mapx)
  WHERE active = true AND mapx IS NOT NULL AND mapy IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tourapi_attraction_synced_at
  ON public.tourapi_attraction (synced_at DESC);

ALTER TABLE public.tourapi_attraction ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tourapi_attraction_select_anon" ON public.tourapi_attraction;
CREATE POLICY "tourapi_attraction_select_anon"
  ON public.tourapi_attraction FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.tourapi_attraction TO anon, authenticated;
GRANT ALL ON public.tourapi_attraction TO service_role;
