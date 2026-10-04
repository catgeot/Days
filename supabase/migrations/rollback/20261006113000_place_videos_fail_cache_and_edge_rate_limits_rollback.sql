-- Rollback for 20261006113000_place_videos_fail_cache_and_edge_rate_limits.sql (manual only).
-- Roll back the fetch-place-videos S1+D1+D4 deploy FIRST (redeploy the previous version), or the
-- function will fail on the missing columns/RPC. Drops only what the forward file added.
BEGIN;
SET LOCAL lock_timeout = '3s';
DROP FUNCTION IF EXISTS public.edge_rate_limit_hit(text, integer, integer, integer);
DROP FUNCTION IF EXISTS public.edge_rate_limit_hit(text, integer, integer);
DROP TABLE IF EXISTS public.edge_rate_limits;
ALTER TABLE public.place_videos
  DROP COLUMN IF EXISTS next_retry_at,
  DROP COLUMN IF EXISTS fail_count,
  DROP COLUMN IF EXISTS last_error;
COMMIT;
NOTIFY pgrst, 'reload schema';
