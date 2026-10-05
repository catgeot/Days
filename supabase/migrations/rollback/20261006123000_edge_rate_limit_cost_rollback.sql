-- Rollback for 20261006123000_edge_rate_limit_cost.sql (manual only).
-- Drops only the 4-arg overload. The 3-arg function from 20261006113000 is left as-is.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

DROP FUNCTION IF EXISTS public.edge_rate_limit_hit(text, integer, integer, integer);

COMMIT;
NOTIFY pgrst, 'reload schema';
