-- OpenFlights routes SSOT — Phase 2 flight-route DB
-- Run: npm run db:apply-migrations -- supabase/migrations/20260621130000_air_routes.sql

-- ---------------------------------------------------------------------------
-- air_routes — OpenFlights routes.dat (2014 snapshot · connectivity graph)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.air_routes (
  id BIGSERIAL PRIMARY KEY,
  airline TEXT,
  airline_id INTEGER,
  source_iata TEXT NOT NULL,
  source_airport_id INTEGER,
  dest_iata TEXT NOT NULL,
  dest_airport_id INTEGER,
  codeshare TEXT,
  stops SMALLINT NOT NULL DEFAULT 0,
  equipment TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT air_routes_source_iata_len CHECK (char_length(source_iata) = 3),
  CONSTRAINT air_routes_dest_iata_len CHECK (char_length(dest_iata) = 3)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_air_routes_pair_unique
  ON public.air_routes (source_iata, dest_iata);

CREATE INDEX IF NOT EXISTS idx_air_routes_source
  ON public.air_routes (source_iata);

CREATE INDEX IF NOT EXISTS idx_air_routes_dest
  ON public.air_routes (dest_iata);

ALTER TABLE public.air_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "air_routes_select_anon" ON public.air_routes;
CREATE POLICY "air_routes_select_anon"
  ON public.air_routes FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.air_routes TO anon, authenticated;
GRANT ALL ON public.air_routes TO service_role;
