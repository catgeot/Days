-- Rollback for 20261006121000_gemini_proxy_token_reserve.sql only.
-- Run only after gemini-proxy is back on v14. Dropping these functions while the
-- new edge is live makes every non-health AI call 503.
-- Does not touch 20261006120000_edge_rate_limit_cost.sql.
-- Does not drop gemini_proxy_usage_daily or the approved 20261006114000 objects.
BEGIN;
SET LOCAL lock_timeout = '3s';
DROP FUNCTION IF EXISTS public.gemini_proxy_release_usage(uuid);
DROP FUNCTION IF EXISTS public.gemini_proxy_reconcile_usage(uuid, bigint, bigint);
DROP FUNCTION IF EXISTS public.gemini_proxy_reconcile_usage(text, text, bigint, bigint, integer);
DROP FUNCTION IF EXISTS public.gemini_proxy_reserve_usage(text, text, integer, bigint, bigint, bigint, uuid);
DROP FUNCTION IF EXISTS public.gemini_proxy_reserve_usage(text, text, integer, bigint, bigint, bigint);
DROP TABLE IF EXISTS public.gemini_proxy_reservations;
COMMIT;
NOTIFY pgrst, 'reload schema';
