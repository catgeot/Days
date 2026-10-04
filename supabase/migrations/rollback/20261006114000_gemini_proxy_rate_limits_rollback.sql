-- Rollback for 20261006114000_gemini_proxy_rate_limits.sql (manual only).
-- Roll back the gemini-proxy G1 deploy FIRST (redeploy saved v14, PLAN.md §8.4), otherwise the new
-- function fails closed on the missing RPC. Optional: export usage first
--   select * from public.gemini_proxy_usage_daily order by day, task, model;
-- Drops only the objects the forward file created. Nothing else is touched.
BEGIN;
SET LOCAL lock_timeout = '3s';
DROP FUNCTION IF EXISTS public.gemini_proxy_record_usage(text, text, bigint, bigint);
DROP FUNCTION IF EXISTS public.gemini_proxy_admit(jsonb, bigint);
DROP TABLE IF EXISTS public.gemini_proxy_usage_daily;
DROP TABLE IF EXISTS public.gemini_proxy_rate_limits;
COMMIT;
NOTIFY pgrst, 'reload schema';
