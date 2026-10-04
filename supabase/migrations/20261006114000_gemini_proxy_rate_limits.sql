-- 20261006114000_gemini_proxy_rate_limits.sql
-- DRAFT (stage 3g). Schema for the gemini-proxy hardening deploy (PLAN.md G1). NEW OBJECTS ONLY:
-- no existing table/function/policy is altered. Independent of stages 1-6b and of 3v
-- (edge_rate_limits); kept separate so either can be rolled back alone.
--   gemini_proxy_rate_limits : fixed-window counters (bucket, window_start) -> count
--   gemini_proxy_usage_daily : per day/task/model call + token totals (budget + monitoring)
--   gemini_proxy_admit(jsonb, bigint) : ordered multi-bucket check-and-increment + daily token budget
--   gemini_proxy_record_usage(...)    : add usageMetadata after a Gemini response
-- All service_role only (RLS on, no policies, no anon/authenticated grants).
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE public.gemini_proxy_rate_limits (
  bucket       text        NOT NULL CHECK (char_length(bucket) BETWEEN 1 AND 200),
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (bucket, window_start)
);
CREATE INDEX gemini_proxy_rate_limits_window_idx ON public.gemini_proxy_rate_limits (window_start);
ALTER TABLE public.gemini_proxy_rate_limits ENABLE ROW LEVEL SECURITY;   -- no policies
REVOKE ALL ON TABLE public.gemini_proxy_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.gemini_proxy_rate_limits TO service_role;

CREATE TABLE public.gemini_proxy_usage_daily (
  day            date    NOT NULL,
  task           text    NOT NULL CHECK (task ~ '^[a-z_]{1,40}$'),
  model          text    NOT NULL CHECK (char_length(model) BETWEEN 1 AND 80),
  calls          integer NOT NULL DEFAULT 0 CHECK (calls >= 0),
  prompt_tokens  bigint  NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  output_tokens  bigint  NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  PRIMARY KEY (day, task, model)
);
ALTER TABLE public.gemini_proxy_usage_daily ENABLE ROW LEVEL SECURITY;   -- no policies
REVOKE ALL ON TABLE public.gemini_proxy_usage_daily FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.gemini_proxy_usage_daily TO service_role;

-- p_checks: ordered JSON array [{"bucket":"ip:<hash>:m","window_s":60,"limit":8}, ...].
-- Buckets are evaluated in order; each is incremented, and the first one over its limit stops the
-- loop (later buckets, e.g. the global ones, are NOT incremented, so one noisy IP cannot burn the
-- global budget). p_token_budget: optional daily (UTC) cap on prompt+output tokens across all tasks.
-- Returns {"ok":true} or {"ok":false,"reason":"rate_limited"|"budget","bucket":..,"retry_after_s":n}.
CREATE FUNCTION public.gemini_proxy_admit(p_checks jsonb, p_token_budget bigint DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c        jsonb;
  v_bucket text;
  v_win    integer;
  v_limit  integer;
  v_start  timestamptz;
  v_n      integer;
  v_used   bigint;
BEGIN
  IF p_checks IS NULL OR jsonb_typeof(p_checks) <> 'array'
     OR jsonb_array_length(p_checks) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'gemini_proxy_admit: bad p_checks' USING ERRCODE = '22023';
  END IF;
  IF p_token_budget IS NOT NULL THEN
    SELECT COALESCE(sum(prompt_tokens + output_tokens), 0) INTO v_used
      FROM public.gemini_proxy_usage_daily
     WHERE day = (now() AT TIME ZONE 'UTC')::date;
    IF v_used >= p_token_budget THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'budget', 'bucket', 'tokens:day',
        'retry_after_s', ceil(extract(epoch FROM (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day')
                                              - (now() AT TIME ZONE 'UTC')))::int);
    END IF;
  END IF;
  FOR c IN SELECT value FROM jsonb_array_elements(p_checks) LOOP
    v_bucket := c->>'bucket';
    v_win    := (c->>'window_s')::integer;
    v_limit  := (c->>'limit')::integer;
    IF v_bucket IS NULL OR char_length(v_bucket) NOT BETWEEN 1 AND 200
       OR v_win IS NULL OR v_win NOT BETWEEN 1 AND 2592000
       OR v_limit IS NULL OR v_limit NOT BETWEEN 0 AND 1000000 THEN
      RAISE EXCEPTION 'gemini_proxy_admit: bad check %', c USING ERRCODE = '22023';
    END IF;
    v_start := to_timestamp(floor(extract(epoch FROM now()) / v_win) * v_win);
    INSERT INTO public.gemini_proxy_rate_limits AS r (bucket, window_start, count)
    VALUES (v_bucket, v_start, 1)
    ON CONFLICT (bucket, window_start) DO UPDATE SET count = r.count + 1
    RETURNING count INTO v_n;
    IF v_n > v_limit THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited', 'bucket', v_bucket,
        'retry_after_s', GREATEST(1, ceil(extract(epoch FROM (v_start + make_interval(secs => v_win) - now())))::int));
    END IF;
  END LOOP;
  IF random() < 0.01 THEN
    DELETE FROM public.gemini_proxy_rate_limits WHERE window_start < now() - interval '2 days';
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.gemini_proxy_admit(jsonb, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gemini_proxy_admit(jsonb, bigint) TO service_role;

CREATE FUNCTION public.gemini_proxy_record_usage(p_task text, p_model text, p_prompt_tokens bigint, p_output_tokens bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.gemini_proxy_usage_daily AS u (day, task, model, calls, prompt_tokens, output_tokens)
  VALUES ((now() AT TIME ZONE 'UTC')::date, p_task, p_model, 1,
          GREATEST(COALESCE(p_prompt_tokens, 0), 0), GREATEST(COALESCE(p_output_tokens, 0), 0))
  ON CONFLICT (day, task, model) DO UPDATE
    SET calls = u.calls + 1,
        prompt_tokens = u.prompt_tokens + EXCLUDED.prompt_tokens,
        output_tokens = u.output_tokens + EXCLUDED.output_tokens;
END;
$$;
REVOKE ALL ON FUNCTION public.gemini_proxy_record_usage(text, text, bigint, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gemini_proxy_record_usage(text, text, bigint, bigint) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
