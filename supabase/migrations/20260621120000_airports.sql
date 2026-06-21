-- OurAirports SSOT — Phase 1 flight-route DB
-- Run: supabase db push · or Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- airports — OurAirports scheduled IATA + gateo hub metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.airports (
  id INTEGER PRIMARY KEY,
  ident TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude_deg DOUBLE PRECISION NOT NULL,
  longitude_deg DOUBLE PRECISION NOT NULL,
  elevation_ft INTEGER,
  continent TEXT,
  iso_country TEXT NOT NULL,
  iso_region TEXT,
  municipality TEXT,
  scheduled_service TEXT NOT NULL DEFAULT 'no',
  icao_code TEXT,
  iata_code TEXT,
  gps_code TEXT,
  local_code TEXT,
  home_link TEXT,
  wikipedia_link TEXT,
  keywords TEXT,
  name_ko TEXT,
  is_transit_hub BOOLEAN NOT NULL DEFAULT false,
  hub_tier SMALLINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT airports_iata_len CHECK (
    iata_code IS NULL OR char_length(iata_code) = 3
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_airports_iata_unique
  ON public.airports (iata_code)
  WHERE iata_code IS NOT NULL AND iata_code <> '';

CREATE INDEX IF NOT EXISTS idx_airports_country
  ON public.airports (iso_country);

CREATE INDEX IF NOT EXISTS idx_airports_scheduled
  ON public.airports (scheduled_service)
  WHERE scheduled_service = 'yes';

CREATE INDEX IF NOT EXISTS idx_airports_transit_hub
  ON public.airports (is_transit_hub)
  WHERE is_transit_hub = true;

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "airports_select_anon" ON public.airports;
CREATE POLICY "airports_select_anon"
  ON public.airports FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.airports TO anon, authenticated;
GRANT ALL ON public.airports TO service_role;
