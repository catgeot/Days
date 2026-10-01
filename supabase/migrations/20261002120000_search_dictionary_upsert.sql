-- Lock down public.search_dictionary writes on prod (phdjnbfitvmrguqzverm).
-- Forward migration only. Do not apply until this draft is reviewed.
-- Keeps SELECT policy "Enable read access for all users".
-- Drops INSERT policy "Enable insert for all users".
-- Requires unique index search_dictionary_original_query_key on (original_query).
--
-- Best-effort abuse guard: a new original_query is rejected when 60 rows
-- were already created in the last hour. Concurrent inserts can exceed 60.
-- Updates of an existing original_query are not counted (cache refresh).

CREATE OR REPLACE FUNCTION public.upsert_search_dictionary(
  p_original_query text,
  p_corrected_query text,
  p_location_data jsonb
)
RETURNS public.search_dictionary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original text;
  v_corrected text;
  v_label text;
  v_value text;
  v_recent integer;
  v_row public.search_dictionary;
BEGIN
  IF p_original_query IS NULL OR p_corrected_query IS NULL THEN
    RAISE EXCEPTION 'search_dictionary: original_query and corrected_query are required';
  END IF;

  v_original := lower(btrim(p_original_query));
  v_corrected := btrim(p_corrected_query);

  FOR v_label, v_value IN
    SELECT *
    FROM (VALUES ('original_query', v_original), ('corrected_query', v_corrected)) AS t(label, val)
  LOOP
    IF v_value IS NULL OR char_length(v_value) < 1 OR char_length(v_value) > 80 THEN
      RAISE EXCEPTION 'search_dictionary: % length must be between 1 and 80', v_label;
    END IF;

    IF v_value ~ '[[:cntrl:]]' THEN
      RAISE EXCEPTION 'search_dictionary: % must not contain newlines or control characters', v_label;
    END IF;

    IF position('<' IN v_value) > 0 OR position('>' IN v_value) > 0 THEN
      RAISE EXCEPTION 'search_dictionary: % must not contain < or >', v_label;
    END IF;

    IF position('http' IN lower(v_value)) > 0
       OR position('www.' IN lower(v_value)) > 0
       OR position('://' IN v_value) > 0 THEN
      RAISE EXCEPTION 'search_dictionary: % must not contain URLs', v_label;
    END IF;
  END LOOP;

  IF p_location_data IS NULL OR jsonb_typeof(p_location_data) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'search_dictionary: location_data must be a jsonb object';
  END IF;

  IF pg_column_size(p_location_data) > 8192 THEN
    RAISE EXCEPTION 'search_dictionary: location_data exceeds 8192 bytes';
  END IF;

  IF p_location_data ? 'lat' THEN
    IF jsonb_typeof(p_location_data -> 'lat') IS DISTINCT FROM 'number'
       OR (p_location_data ->> 'lat')::numeric < -90
       OR (p_location_data ->> 'lat')::numeric > 90 THEN
      RAISE EXCEPTION 'search_dictionary: lat must be a number between -90 and 90';
    END IF;
  END IF;

  IF p_location_data ? 'lng' THEN
    IF jsonb_typeof(p_location_data -> 'lng') IS DISTINCT FROM 'number'
       OR (p_location_data ->> 'lng')::numeric < -180
       OR (p_location_data ->> 'lng')::numeric > 180 THEN
      RAISE EXCEPTION 'search_dictionary: lng must be a number between -180 and 180';
    END IF;
  END IF;

  IF p_location_data ? 'variants' THEN
    IF jsonb_typeof(p_location_data -> 'variants') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'search_dictionary: variants must be an array of at most 20 items';
    END IF;
    IF jsonb_array_length(p_location_data -> 'variants') > 20 THEN
      RAISE EXCEPTION 'search_dictionary: variants must be an array of at most 20 items';
    END IF;
  END IF;

  -- Best-effort: not locked, so overlapping new keys can pass the same count.
  IF NOT EXISTS (
    SELECT 1
    FROM public.search_dictionary
    WHERE original_query = v_original
  ) THEN
    SELECT count(*)::integer
    INTO v_recent
    FROM public.search_dictionary
    WHERE created_at > now() - interval '1 hour';

    IF v_recent >= 60 THEN
      RAISE EXCEPTION 'search_dictionary: hourly insert limit reached (best-effort cap of 60 new rows)';
    END IF;
  END IF;

  INSERT INTO public.search_dictionary (original_query, corrected_query, location_data)
  VALUES (v_original, v_corrected, p_location_data)
  ON CONFLICT (original_query) DO UPDATE
    SET corrected_query = EXCLUDED.corrected_query,
        location_data = EXCLUDED.location_data
  RETURNING *
  INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.upsert_search_dictionary(text, text, jsonb) IS
  'Validated upsert for search_dictionary. Best-effort cap: 60 new rows per hour. Existing original_query rows update without counting.';

REVOKE ALL ON FUNCTION public.upsert_search_dictionary(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_search_dictionary(text, text, jsonb) TO anon, authenticated;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.search_dictionary;
