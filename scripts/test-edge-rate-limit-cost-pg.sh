#!/bin/bash
# Local Postgres check: the 3-arg function from 3v stays (+1). The cost migration
# adds a 4-arg function with no default. A 3-arg call stays unambiguous.
# Rollback drops only the 4-arg function.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="${PG_RATE_LIMIT_DB:-gateo_rate_limit_cost_test}"
FORWARD="$ROOT/supabase/migrations/20261006123000_edge_rate_limit_cost.sql"
ROLLBACK="$ROOT/supabase/migrations/rollback/20261006123000_edge_rate_limit_cost_rollback.sql"

psql -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${DB};" -c "CREATE DATABASE ${DB};"

psql -d "$DB" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE TABLE public.place_videos (
  place_id text PRIMARY KEY,
  videos jsonb
);
SQL

echo "=== apply 3v ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/migrations/20261006113000_place_videos_fail_cache_and_edge_rate_limits.sql"

psql -d "$DB" -v ON_ERROR_STOP=1 <<'SQL'
SELECT public.edge_rate_limit_hit('old-only', 86400, 10) AS allowed;
SELECT count AS old_count FROM public.edge_rate_limits WHERE key = 'old-only';
SQL

set +e
four=$(psql -d "$DB" -v ON_ERROR_STOP=1 -tA -c "SELECT public.edge_rate_limit_hit('old-only', 86400, 10, 100);" 2>&1)
set -e
echo "$four" | grep -q 'does not exist' || {
  echo "FAIL  4-arg call should be absent on 3v only"
  echo "$four"
  exit 1
}
echo "OK    3v rejects a p_cost call"

echo "=== apply cost migration ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -f "$FORWARD"

psql -d "$DB" -v ON_ERROR_STOP=1 <<'SQL'
SELECT public.edge_rate_limit_hit('no-cost', 86400, 10) AS no_cost_allowed;
SELECT count AS no_cost_count FROM public.edge_rate_limits WHERE key = 'no-cost';
SELECT public.edge_rate_limit_hit('with-cost', 86400, 1000, 100) AS with_cost_allowed;
SELECT count AS with_cost_count FROM public.edge_rate_limits WHERE key = 'with-cost';
SELECT pronargs, prosecdef, proconfig::text
FROM pg_proc
WHERE proname = 'edge_rate_limit_hit'
ORDER BY pronargs;
SQL

no_cost=$(psql -d "$DB" -tA -c "SELECT count FROM public.edge_rate_limits WHERE key = 'no-cost';")
with_cost=$(psql -d "$DB" -tA -c "SELECT count FROM public.edge_rate_limits WHERE key = 'with-cost';")
nargs=$(psql -d "$DB" -tA -c "SELECT string_agg(pronargs::text, ',' ORDER BY pronargs) FROM pg_proc WHERE proname = 'edge_rate_limit_hit';")
secdef=$(psql -d "$DB" -tA -c "SELECT count(*) FROM pg_proc WHERE proname = 'edge_rate_limit_hit' AND prosecdef;")
search_path=$(psql -d "$DB" -tA -c "SELECT proconfig::text FROM pg_proc WHERE proname = 'edge_rate_limit_hit' ORDER BY pronargs;")
[[ "$no_cost" == "1" ]] || { echo "FAIL  3-arg count=$no_cost"; exit 1; }
[[ "$with_cost" == "100" ]] || { echo "FAIL  p_cost 100 count=$with_cost"; exit 1; }
[[ "$nargs" == "3,4" ]] || { echo "FAIL  pronargs=$nargs"; exit 1; }
[[ "$secdef" == "2" ]] || { echo "FAIL  prosecdef rows=$secdef"; exit 1; }
echo "$search_path" | grep -q 'search_path=' || { echo "FAIL  proconfig=$search_path"; exit 1; }
args=$(psql -d "$DB" -tA -c "SELECT pg_get_function_arguments(oid) FROM pg_proc WHERE proname = 'edge_rate_limit_hit' AND pronargs = 4;")
[[ "$args" == *"p_cost integer" ]] || { echo "FAIL  4-arg arguments=$args"; exit 1; }
[[ "$args" != *DEFAULT* ]] || { echo "FAIL  p_cost default makes 3-arg calls ambiguous ($args)"; exit 1; }
echo "OK    3-arg stays +1 and 4-arg p_cost is 100 with no default"

echo "=== rollback cost migration ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -f "$ROLLBACK"
psql -d "$DB" -v ON_ERROR_STOP=1 -c "SELECT public.edge_rate_limit_hit('after-rollback', 86400, 10);"
rolled=$(psql -d "$DB" -tA -c "SELECT count FROM public.edge_rate_limits WHERE key = 'after-rollback';")
nargs=$(psql -d "$DB" -tA -c "SELECT string_agg(pronargs::text, ',' ORDER BY pronargs) FROM pg_proc WHERE proname = 'edge_rate_limit_hit';")
[[ "$rolled" == "1" ]] || { echo "FAIL  rollback count=$rolled"; exit 1; }
[[ "$nargs" == "3" ]] || { echo "FAIL  rollback pronargs=$nargs"; exit 1; }
set +e
four=$(psql -d "$DB" -v ON_ERROR_STOP=1 -tA -c "SELECT public.edge_rate_limit_hit('after-rollback', 86400, 10, 100);" 2>&1)
set -e
echo "$four" | grep -q 'does not exist' || {
  echo "FAIL  4-arg call should be gone after rollback"
  echo "$four"
  exit 1
}
echo "OK    rollback kept the 3-arg function and dropped the 4-arg function"
psql -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${DB};"
echo "PASS  edge_rate_limit cost local PG"
