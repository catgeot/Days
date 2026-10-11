-- Assembled festival transport card. service_role only.
-- Key is contentId + KST bus date + train service date.
-- The function drops the row at the next KST midnight (bus day).

CREATE TABLE IF NOT EXISTS public.tago_card_cache (
  cache_key text PRIMARY KEY,
  content_id text NOT NULL,
  bus_date date NOT NULL,
  train_date date NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tago_card_cache_key_len CHECK (char_length(cache_key) BETWEEN 16 AND 80),
  CONSTRAINT tago_card_cache_content_len CHECK (char_length(content_id) BETWEEN 1 AND 12)
);

CREATE INDEX IF NOT EXISTS idx_tago_card_cache_fetched_at
  ON public.tago_card_cache (fetched_at DESC);

ALTER TABLE public.tago_card_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.tago_card_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.tago_card_cache TO service_role;
