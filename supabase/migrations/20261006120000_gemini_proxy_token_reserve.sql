-- 20261006120000_gemini_proxy_token_reserve.sql
-- Separate from the approved 20261006114000 migration (do not edit that file).
-- Atomic token reserve so concurrent requests cannot all pass a read-then-call budget check.
-- Needs approval before apply. gemini_proxy_record_usage cannot subtract, so reconcile is a new RPC.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

CREATE FUNCTION public.gemini_proxy_reserve_usage(
  p_task text,
  p_model text,
  p_calls integer,
  p_prompt_tokens bigint,
  p_output_tokens bigint,
  p_token_budget bigint
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
BEGIN
  IF p_task IS NULL OR p_task !~ '^[a-z_]{1,40}$'
     OR p_model IS NULL OR char_length(p_model) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'gemini_proxy_reserve_usage: bad task/model' USING ERRCODE = '22023';
  END IF;
  v_prompt := GREATEST(COALESCE(p_prompt_tokens, 0), 0);
  v_output := GREATEST(COALESCE(p_output_tokens, 0), 0);
  v_calls := GREATEST(COALESCE(p_calls, 0), 0);
  PERFORM pg_advisory_xact_lock(hashtext('gemini_proxy_usage_daily'));
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
  INSERT INTO public.gemini_proxy_usage_daily AS u (day, task, model, calls, prompt_tokens, output_tokens)
  VALUES ((now() AT TIME ZONE 'UTC')::date, p_task, p_model, v_calls, v_prompt, v_output)
  ON CONFLICT (day, task, model) DO UPDATE
    SET calls = u.calls + EXCLUDED.calls,
        prompt_tokens = u.prompt_tokens + EXCLUDED.prompt_tokens,
        output_tokens = u.output_tokens + EXCLUDED.output_tokens;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.gemini_proxy_reserve_usage(text, text, integer, bigint, bigint, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gemini_proxy_reserve_usage(text, text, integer, bigint, bigint, bigint)
  TO service_role;

CREATE FUNCTION public.gemini_proxy_reconcile_usage(
  p_task text,
  p_model text,
  p_prompt_delta bigint,
  p_output_delta bigint,
  p_calls_delta integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_task IS NULL OR p_task !~ '^[a-z_]{1,40}$'
     OR p_model IS NULL OR char_length(p_model) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'gemini_proxy_reconcile_usage: bad task/model' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('gemini_proxy_usage_daily'));
  UPDATE public.gemini_proxy_usage_daily
     SET prompt_tokens = GREATEST(0, prompt_tokens + COALESCE(p_prompt_delta, 0)),
         output_tokens = GREATEST(0, output_tokens + COALESCE(p_output_delta, 0)),
         calls = GREATEST(0, calls + COALESCE(p_calls_delta, 0))
   WHERE day = (now() AT TIME ZONE 'UTC')::date
     AND task = p_task
     AND model = p_model;
END;
$$;
REVOKE ALL ON FUNCTION public.gemini_proxy_reconcile_usage(text, text, bigint, bigint, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gemini_proxy_reconcile_usage(text, text, bigint, bigint, integer)
  TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
