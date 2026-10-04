-- Rollback for 20261006120000_gemini_proxy_token_reserve.sql only.
-- Does not drop gemini_proxy_usage_daily or the approved 20261006114000 objects.
BEGIN;
SET LOCAL lock_timeout = '3s';
DROP FUNCTION IF EXISTS public.gemini_proxy_reconcile_usage(text, text, bigint, bigint, integer);
DROP FUNCTION IF EXISTS public.gemini_proxy_reserve_usage(text, text, integer, bigint, bigint, bigint);
COMMIT;
NOTIFY pgrst, 'reload schema';
