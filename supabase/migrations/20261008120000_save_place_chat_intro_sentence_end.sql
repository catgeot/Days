-- PREVENTION ⑥: sentence-end guard on save_place_chat_intro (prod body + one validation block).
-- Client mirror: src/pages/Home/lib/placeChatIntroSentenceEnd.js
-- RPC errors: placeChatIntro.js logs console.warn and returns; UI keeps MOONi fallback (local pre-gate).

BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

CREATE OR REPLACE FUNCTION public.save_place_chat_intro(p_destination_key text, p_summary text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_key text := btrim(coalesce(p_destination_key, ''));
  v_sum text := btrim(coalesce(p_summary, ''));
  v_recent integer;
  v_id uuid;
BEGIN
  IF char_length(v_key) NOT BETWEEN 1 AND 120
     OR v_key ~ '[[:cntrl:]<>\\]'
     OR v_key ~* '(https?:|www\.|://)' THEN
    RAISE EXCEPTION 'place_chat_intro: invalid destination_key' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_sum) NOT BETWEEN 40 AND 1200
     OR v_sum ~ '[\x01-\x09\x0b-\x1f\x7f<>]'          -- newline (\x0a) allowed, other control chars not
     OR v_sum ~* '(https?:|www\.|://|javascript:|data:)' THEN
    RAISE EXCEPTION 'place_chat_intro: summary must be 40-1200 chars, no URLs, no HTML' USING ERRCODE = '22023';
  END IF;

  -- PREVENTION ⑥: complete sentence ending (no mid-word, trailing comma/colon, unclosed markdown)
  IF v_sum ~ '[,;:：，、]\s*$'
     OR (char_length(v_sum) - char_length(replace(v_sum, '**', ''))) % 4 <> 0
     OR (char_length(v_sum) - char_length(replace(v_sum, '`', ''))) % 2 <> 0
     OR v_sum !~ ('[.!?\u3002\uff01\uff1f\u2026]["''\u201d\u2019\u300d\u300f\uff09)\]]*'||'\s*$') THEN
    RAISE EXCEPTION 'place_chat_intro: summary must end with a complete sentence' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.place_chat_intro WHERE destination_key = v_key) THEN
    RETURN false;                                       -- existing intro wins (no client overwrite)
  END IF;

  -- best-effort global cap (prod is about 6 per day)
  SELECT count(*)::integer INTO v_recent
  FROM public.place_chat_intro WHERE created_at > now() - interval '1 hour';
  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'place_chat_intro: hourly insert limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.place_chat_intro (destination_key, summary)
  VALUES (v_key, v_sum)
  ON CONFLICT (destination_key) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id IS NOT NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_place_chat_intro(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_place_chat_intro(text, text) TO anon, authenticated, service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
