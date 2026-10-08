-- PREVENTION ⑥: refuse place_chat_intro rows whose summary does not end on a complete sentence.
-- Forward-only. No table CHECK constraints. Upsert logic unchanged; adds sentence-end guard in RPC.
-- Client mirror: src/pages/Home/lib/placeChatIntroSentenceEnd.js

BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

CREATE OR REPLACE FUNCTION public.save_place_chat_intro(
  p_destination_key text,
  p_summary text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_key text;
  v_summary text;
  v_len integer;
  v_star_pairs integer;
  v_backticks integer;
BEGIN
  v_key := regexp_replace(coalesce(p_destination_key, ''), '(^ +| +$)', '', 'g');
  v_summary := regexp_replace(coalesce(p_summary, ''), '(^ +| +$)', '', 'g');

  IF pg_catalog.char_length(v_key) < 1 OR pg_catalog.char_length(v_key) > 120 THEN
    RETURN false;
  END IF;

  IF v_key ~ '[[:cntrl:]]'
     OR pg_catalog.strpos(v_key, '<') > 0
     OR pg_catalog.strpos(v_key, '>') > 0
     OR pg_catalog.strpos(v_key, E'\\') > 0
     OR pg_catalog.strpos(pg_catalog.lower(v_key), 'http') > 0
     OR pg_catalog.strpos(pg_catalog.lower(v_key), 'www.') > 0
     OR pg_catalog.strpos(v_key, '://') > 0 THEN
    RETURN false;
  END IF;

  v_len := pg_catalog.char_length(v_summary);
  IF v_len < 40 OR v_len > 1200 THEN
    RETURN false;
  END IF;

  IF v_summary ~ E'[\\x01-\\x09\\x0b-\\x1f\\x7f<>]'
     OR pg_catalog.strpos(pg_catalog.lower(v_summary), 'http') > 0
     OR pg_catalog.strpos(pg_catalog.lower(v_summary), 'www.') > 0
     OR pg_catalog.strpos(v_summary, '://') > 0
     OR pg_catalog.strpos(pg_catalog.lower(v_summary), 'javascript:') > 0
     OR pg_catalog.strpos(pg_catalog.lower(v_summary), 'data:') > 0 THEN
    RETURN false;
  END IF;

  -- PREVENTION ⑥ (sentence end)
  IF v_summary ~ '[,;:：，、]\s*$' THEN
    RETURN false;
  END IF;

  v_star_pairs := pg_catalog.char_length(v_summary) - pg_catalog.char_length(replace(v_summary, '**', '', 'g'));
  IF v_star_pairs % 4 <> 0 THEN
    RETURN false;
  END IF;

  v_backticks := pg_catalog.char_length(v_summary) - pg_catalog.char_length(replace(v_summary, '`', '', 'g'));
  IF v_backticks % 2 <> 0 THEN
    RETURN false;
  END IF;

  IF v_summary !~ '[.!?。！？…]["''""』)\]]*\s*$' THEN
    RETURN false;
  END IF;

  INSERT INTO public.place_chat_intro AS pci (destination_key, summary, updated_at)
  VALUES (v_key, v_summary, pg_catalog.now())
  ON CONFLICT (destination_key) DO UPDATE
    SET summary = EXCLUDED.summary,
        updated_at = EXCLUDED.updated_at;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.save_place_chat_intro(text, text) IS
  'Single writer for place_chat_intro. Returns false when validation fails (incl. PREVENTION ⑥ sentence-end guard).';

REVOKE ALL ON FUNCTION public.save_place_chat_intro(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_place_chat_intro(text, text) TO anon, authenticated;

COMMIT;
NOTIFY pgrst, 'reload schema';
