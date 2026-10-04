-- 20261006121000_gemini_proxy_token_reserve.sql
-- Version 20261006120000 is already used by 20261006120000_edge_rate_limit_cost.sql (#378).
-- Apply in version order with #378: 113000 → 114000 → 120000 → 121000.
-- Separate from the approved 20261006114000 migration (do not edit that file).
-- Required before the new gemini-proxy edge deploy. Dropping these functions while
-- that edge is live makes every non-health AI call fail closed (503).
-- Reservation id makes reconcile/release idempotent. Held rows older than 120s
-- are expired inside reserve so a crashed isolate cannot lock the UTC day budget.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE public.gemini_proxy_reservations (
  id             uuid        PRIMARY KEY,
  day            date        NOT NULL,
  task           text        NOT NULL CHECK (task ~ '^[a-z_]{1,40}$'),
  model          text        NOT NULL CHECK (char_length(model) BETWEEN 1 AND 80),
  calls          integer     NOT NULL CHECK (calls >= 0),
  prompt_tokens  bigint      NOT NULL CHECK (prompt_tokens >= 0),
  output_tokens  bigint      NOT NULL CHECK (output_tokens >= 0),
  status         text        NOT NULL CHECK (status IN ('held', 'reconciled', 'released')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  settled_at     timestamptz
);
CREATE INDEX gemini_proxy_reservations_held_idx
  ON public.gemini_proxy_reservations (created_at)
  WHERE status = 'held';
ALTER TABLE public.gemini_proxy_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gemini_proxy_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.gemini_proxy_reservations TO service_role;

CREATE FUNCTION public.gemini_proxy_reserve_usage(
  p_task text,
  p_model text,
  p_calls integer,
  p_prompt_tokens bigint,
  p_output_tokens bigint,
  p_token_budget bigint,
  p_reservation_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prompt bigint;
  v_output bigint;
  v_calls  integer;
  v_used   bigint;
  r        record;
BEGIN
  IF p_reservation_id IS NULL
     OR p_task IS NULL OR p_task !~ '^[a-z_]{1,40}$'
     OR p_model IS NULL OR char_length(p_model) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'gemini_proxy_reserve_usage: bad args' USING ERRCODE = '22023';
  END IF;
  v_prompt := GREATEST(COALESCE(p_prompt_tokens, 0), 0);
  v_output := GREATEST(COALESCE(p_output_tokens, 0), 0);
  v_calls := GREATEST(COALESCE(p_calls, 0), 0);
  PERFORM pg_advisory_xact_lock(hashtext('gemini_proxy_usage_daily'));

  FOR r IN
    SELECT id, day, task, model, calls, prompt_tokens, output_tokens
      FROM public.gemini_proxy_reservations
     WHERE status = 'held'
       AND created_at < now() - interval '120 seconds'
     FOR UPDATE
  LOOP
    UPDATE public.gemini_proxy_usage_daily
       SET calls = GREATEST(0, calls - r.calls),
           prompt_tokens = GREATEST(0, prompt_tokens - r.prompt_tokens),
           output_tokens = GREATEST(0, output_tokens - r.output_tokens)
     WHERE day = r.day AND task = r.task AND model = r.model;
    UPDATE public.gemini_proxy_reservations
       SET status = 'released', settled_at = now()
     WHERE id = r.id AND status = 'held';
  END LOOP;

  IF p_token_budget IS NOT NULL THEN
    SELECT COALESCE(sum(prompt_tokens + output_tokens), 0) INTO v_used
      FROM public.gemini_proxy_usage_daily
     WHERE day = (now() AT TIME ZONE 'UTC')::date;
    IF v_used + v_prompt + v_output > p_token_budget THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'budget', 'bucket', 'tokens:day',
        'retry_after_s', ceil(extract(epoch FROM (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day')
                                              - (now() AT TIME ZONE 'UTC')))::int);
    END IF;
  END IF;

  INSERT INTO public.gemini_proxy_reservations
    (id, day, task, model, calls, prompt_tokens, output_tokens, status)
  VALUES
    (p_reservation_id, (now() AT TIME ZONE 'UTC')::date, p_task, p_model, v_calls, v_prompt, v_output, 'held');

  INSERT INTO public.gemini_proxy_usage_daily AS u (day, task, model, calls, prompt_tokens, output_tokens)
  VALUES ((now() AT TIME ZONE 'UTC')::date, p_task, p_model, v_calls, v_prompt, v_output)
  ON CONFLICT (day, task, model) DO UPDATE
    SET calls = u.calls + EXCLUDED.calls,
        prompt_tokens = u.prompt_tokens + EXCLUDED.prompt_tokens,
        output_tokens = u.output_tokens + EXCLUDED.output_tokens;
  RETURN jsonb_build_object('ok', true, 'reservation_id', p_reservation_id);
END;
$$;
REVOKE ALL ON FUNCTION public.gemini_proxy_reserve_usage(text, text, integer, bigint, bigint, bigint, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gemini_proxy_reserve_usage(text, text, integer, bigint, bigint, bigint, uuid)
  TO service_role;

CREATE FUNCTION public.gemini_proxy_reconcile_usage(
  p_reservation_id uuid,
  p_prompt_tokens bigint,
  p_output_tokens bigint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r record;
  v_prompt bigint;
  v_output bigint;
BEGIN
  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'gemini_proxy_reconcile_usage: bad id' USING ERRCODE = '22023';
  END IF;
  v_prompt := GREATEST(COALESCE(p_prompt_tokens, 0), 0);
  v_output := GREATEST(COALESCE(p_output_tokens, 0), 0);
  PERFORM pg_advisory_xact_lock(hashtext('gemini_proxy_usage_daily'));
  SELECT id, day, task, model, calls, prompt_tokens, output_tokens, status
    INTO r
    FROM public.gemini_proxy_reservations
   WHERE id = p_reservation_id
   FOR UPDATE;
  IF NOT FOUND OR r.status <> 'held' THEN
    RETURN;
  END IF;
  UPDATE public.gemini_proxy_usage_daily
     SET prompt_tokens = GREATEST(0, prompt_tokens - r.prompt_tokens + v_prompt),
         output_tokens = GREATEST(0, output_tokens - r.output_tokens + v_output)
   WHERE day = r.day AND task = r.task AND model = r.model;
  UPDATE public.gemini_proxy_reservations
     SET status = 'reconciled', settled_at = now()
   WHERE id = r.id AND status = 'held';
END;
$$;
REVOKE ALL ON FUNCTION public.gemini_proxy_reconcile_usage(uuid, bigint, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gemini_proxy_reconcile_usage(uuid, bigint, bigint)
  TO service_role;

CREATE FUNCTION public.gemini_proxy_release_usage(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r record;
BEGIN
  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'gemini_proxy_release_usage: bad id' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('gemini_proxy_usage_daily'));
  SELECT id, day, task, model, calls, prompt_tokens, output_tokens, status
    INTO r
    FROM public.gemini_proxy_reservations
   WHERE id = p_reservation_id
   FOR UPDATE;
  IF NOT FOUND OR r.status <> 'held' THEN
    RETURN;
  END IF;
  UPDATE public.gemini_proxy_usage_daily
     SET calls = GREATEST(0, calls - r.calls),
         prompt_tokens = GREATEST(0, prompt_tokens - r.prompt_tokens),
         output_tokens = GREATEST(0, output_tokens - r.output_tokens)
   WHERE day = r.day AND task = r.task AND model = r.model;
  UPDATE public.gemini_proxy_reservations
     SET status = 'released', settled_at = now()
   WHERE id = r.id AND status = 'held';
END;
$$;
REVOKE ALL ON FUNCTION public.gemini_proxy_release_usage(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gemini_proxy_release_usage(uuid)
  TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
