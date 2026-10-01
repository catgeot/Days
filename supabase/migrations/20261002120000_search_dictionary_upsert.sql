-- Lock down public.search_dictionary writes on prod (phdjnbfitvmrguqzverm).
-- Forward migration only. Do not apply until this draft is reviewed.
-- Keeps SELECT policy "Enable read access for all users".
-- Drops INSERT policy "Enable insert for all users".
-- Requires unique index search_dictionary_original_query_key on (original_query).
-- created_at default now() is already in prod; this file does not change it.
--
-- upsert_search_dictionary is insert-only: ON CONFLICT (original_query) DO NOTHING.
-- An existing key is returned unchanged (or null if it disappears mid-race).
-- Best-effort abuse guard: a new original_query is rejected when 60 rows were
-- already created in the last hour. Concurrent inserts can exceed 60.
-- Existing keys do not write, so they are not an overwrite path around the cap.
--
-- bump_search_dictionary_served increments variants[idx].served_count by exactly 1
-- and sets last_served_at / last_pick_at to server now(). No client-supplied values.
-- Best-effort ceiling: served_count already >= 100000 is left unchanged.

CREATE OR REPLACE FUNCTION public.upsert_search_dictionary(
  p_original_query text,
  p_corrected_query text,
  p_location_data jsonb
)
RETURNS public.search_dictionary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_original text;
  v_corrected text;
  v_label text;
  v_value text;
  v_recent integer;
  v_row public.search_dictionary;
  v_variants jsonb;
  v_variant jsonb;
  v_variant_count integer;
  v_i integer;
  v_text text;
BEGIN
  IF p_original_query IS NULL OR p_corrected_query IS NULL THEN
    RAISE EXCEPTION 'search_dictionary: original_query and corrected_query are required';
  END IF;

  v_original := pg_catalog.lower(pg_catalog.btrim(p_original_query));
  v_corrected := pg_catalog.btrim(p_corrected_query);

  FOR v_label, v_value IN
    SELECT *
    FROM (
      VALUES ('original_query', v_original), ('corrected_query', v_corrected)
    ) AS t(label, val)
  LOOP
    IF v_value IS NULL OR pg_catalog.char_length(v_value) < 1 OR pg_catalog.char_length(v_value) > 80 THEN
      RAISE EXCEPTION 'search_dictionary: % length must be between 1 and 80', v_label;
    END IF;

    IF v_value ~ '[[:cntrl:]]'
       OR pg_catalog.strpos(v_value, '<') > 0
       OR pg_catalog.strpos(v_value, '>') > 0
       OR pg_catalog.strpos(pg_catalog.lower(v_value), 'http') > 0
       OR pg_catalog.strpos(pg_catalog.lower(v_value), 'www.') > 0
       OR pg_catalog.strpos(v_value, '://') > 0 THEN
      RAISE EXCEPTION 'search_dictionary: % must not contain newlines, control characters, <, >, or URLs', v_label;
    END IF;
  END LOOP;

  IF p_location_data IS NULL OR pg_catalog.jsonb_typeof(p_location_data) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'search_dictionary: location_data must be a jsonb object';
  END IF;

  IF pg_catalog.pg_column_size(p_location_data) > 8192 THEN
    RAISE EXCEPTION 'search_dictionary: location_data exceeds 8192 bytes';
  END IF;

  IF pg_catalog.jsonb_exists(p_location_data, 'lat') THEN
    IF pg_catalog.jsonb_typeof(p_location_data -> 'lat') IS DISTINCT FROM 'number'
       OR CAST(p_location_data ->> 'lat' AS numeric) < -90
       OR CAST(p_location_data ->> 'lat' AS numeric) > 90 THEN
      RAISE EXCEPTION 'search_dictionary: lat must be a number between -90 and 90';
    END IF;
  END IF;

  IF pg_catalog.jsonb_exists(p_location_data, 'lng') THEN
    IF pg_catalog.jsonb_typeof(p_location_data -> 'lng') IS DISTINCT FROM 'number'
       OR CAST(p_location_data ->> 'lng' AS numeric) < -180
       OR CAST(p_location_data ->> 'lng' AS numeric) > 180 THEN
      RAISE EXCEPTION 'search_dictionary: lng must be a number between -180 and 180';
    END IF;
  END IF;

  IF pg_catalog.jsonb_exists(p_location_data, 'variants') THEN
    v_variants := p_location_data -> 'variants';
    IF pg_catalog.jsonb_typeof(v_variants) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'search_dictionary: variants must be an array of at most 20 items';
    END IF;

    v_variant_count := pg_catalog.jsonb_array_length(v_variants);
    IF v_variant_count > 20 THEN
      RAISE EXCEPTION 'search_dictionary: variants must be an array of at most 20 items';
    END IF;

    FOR v_i IN 0 .. v_variant_count - 1 LOOP
      v_variant := v_variants -> v_i;
      IF pg_catalog.jsonb_typeof(v_variant) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'search_dictionary: variant must be an object';
      END IF;

      IF pg_catalog.jsonb_exists(v_variant, 'name')
         AND pg_catalog.jsonb_typeof(v_variant -> 'name') IS DISTINCT FROM 'null' THEN
        IF pg_catalog.jsonb_typeof(v_variant -> 'name') IS DISTINCT FROM 'string' THEN
          RAISE EXCEPTION 'search_dictionary: variant name must be a string of at most 80 characters';
        END IF;
        v_text := v_variant ->> 'name';
        IF pg_catalog.char_length(v_text) > 80 THEN
          RAISE EXCEPTION 'search_dictionary: variant name must be a string of at most 80 characters';
        END IF;
        IF v_text ~ '[[:cntrl:]]'
           OR pg_catalog.strpos(v_text, '<') > 0
           OR pg_catalog.strpos(v_text, '>') > 0
           OR pg_catalog.strpos(pg_catalog.lower(v_text), 'http') > 0
           OR pg_catalog.strpos(pg_catalog.lower(v_text), 'www.') > 0
           OR pg_catalog.strpos(v_text, '://') > 0 THEN
          RAISE EXCEPTION 'search_dictionary: variant name must not contain newlines, control characters, <, >, or URLs';
        END IF;
      END IF;

      IF pg_catalog.jsonb_exists(v_variant, 'reason')
         AND pg_catalog.jsonb_typeof(v_variant -> 'reason') IS DISTINCT FROM 'null' THEN
        IF pg_catalog.jsonb_typeof(v_variant -> 'reason') IS DISTINCT FROM 'string' THEN
          RAISE EXCEPTION 'search_dictionary: variant reason must be a string of at most 200 characters';
        END IF;
        v_text := v_variant ->> 'reason';
        IF pg_catalog.char_length(v_text) > 200 THEN
          RAISE EXCEPTION 'search_dictionary: variant reason must be a string of at most 200 characters';
        END IF;
        IF v_text ~ '[[:cntrl:]]'
           OR pg_catalog.strpos(v_text, '<') > 0
           OR pg_catalog.strpos(v_text, '>') > 0
           OR pg_catalog.strpos(pg_catalog.lower(v_text), 'http') > 0
           OR pg_catalog.strpos(pg_catalog.lower(v_text), 'www.') > 0
           OR pg_catalog.strpos(v_text, '://') > 0 THEN
          RAISE EXCEPTION 'search_dictionary: variant reason must not contain newlines, control characters, <, >, or URLs';
        END IF;
      END IF;

      IF pg_catalog.jsonb_exists(v_variant, 'lat') THEN
        IF pg_catalog.jsonb_typeof(v_variant -> 'lat') IS DISTINCT FROM 'number'
           OR CAST(v_variant ->> 'lat' AS numeric) < -90
           OR CAST(v_variant ->> 'lat' AS numeric) > 90 THEN
          RAISE EXCEPTION 'search_dictionary: variant lat must be a number between -90 and 90';
        END IF;
      END IF;

      IF pg_catalog.jsonb_exists(v_variant, 'lng') THEN
        IF pg_catalog.jsonb_typeof(v_variant -> 'lng') IS DISTINCT FROM 'number'
           OR CAST(v_variant ->> 'lng' AS numeric) < -180
           OR CAST(v_variant ->> 'lng' AS numeric) > 180 THEN
          RAISE EXCEPTION 'search_dictionary: variant lng must be a number between -180 and 180';
        END IF;
      END IF;
    END LOOP;
  END IF;

  SELECT *
  INTO v_row
  FROM public.search_dictionary
  WHERE original_query = v_original;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  -- Best-effort: not locked, so overlapping new keys can pass the same count.
  SELECT CAST(count(*) AS integer)
  INTO v_recent
  FROM public.search_dictionary
  WHERE created_at > pg_catalog.now() - interval '1 hour';

  IF v_recent >= 60 THEN
    RAISE EXCEPTION 'search_dictionary: hourly insert limit reached (best-effort cap of 60 new rows)';
  END IF;

  INSERT INTO public.search_dictionary (original_query, corrected_query, location_data)
  VALUES (v_original, v_corrected, p_location_data)
  ON CONFLICT (original_query) DO NOTHING
  RETURNING *
  INTO v_row;

  IF NOT FOUND THEN
    SELECT *
    INTO v_row
    FROM public.search_dictionary
    WHERE original_query = v_original;
  END IF;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.upsert_search_dictionary(text, text, jsonb) IS
  'Insert-only search_dictionary write. ON CONFLICT (original_query) DO NOTHING and return the existing row. Best-effort cap: 60 new rows per hour.';

CREATE OR REPLACE FUNCTION public.bump_search_dictionary_served(
  p_original_query text,
  p_variant_index integer
)
RETURNS public.search_dictionary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_original text;
  v_row public.search_dictionary;
  v_variants jsonb;
  v_count numeric;
  v_len integer;
BEGIN
  IF p_original_query IS NULL OR p_variant_index IS NULL THEN
    RAISE EXCEPTION 'search_dictionary: original_query and variant_index are required';
  END IF;

  v_original := pg_catalog.lower(pg_catalog.btrim(p_original_query));

  IF v_original IS NULL OR pg_catalog.char_length(v_original) < 1 OR pg_catalog.char_length(v_original) > 80 THEN
    RAISE EXCEPTION 'search_dictionary: original_query length must be between 1 and 80';
  END IF;

  IF v_original ~ '[[:cntrl:]]'
     OR pg_catalog.strpos(v_original, '<') > 0
     OR pg_catalog.strpos(v_original, '>') > 0
     OR pg_catalog.strpos(v_original, 'http') > 0
     OR pg_catalog.strpos(v_original, 'www.') > 0
     OR pg_catalog.strpos(v_original, '://') > 0 THEN
    RAISE EXCEPTION 'search_dictionary: original_query must not contain newlines, control characters, <, >, or URLs';
  END IF;

  IF p_variant_index < 0 THEN
    RAISE EXCEPTION 'search_dictionary: variant_index out of range';
  END IF;

  SELECT *
  INTO v_row
  FROM public.search_dictionary
  WHERE original_query = v_original
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'search_dictionary: original_query not found';
  END IF;

  v_variants := v_row.location_data -> 'variants';
  IF pg_catalog.jsonb_typeof(v_variants) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'search_dictionary: variants must be an array';
  END IF;

  v_len := pg_catalog.jsonb_array_length(v_variants);
  IF p_variant_index >= v_len THEN
    RAISE EXCEPTION 'search_dictionary: variant_index out of range';
  END IF;

  IF pg_catalog.jsonb_typeof(v_variants -> p_variant_index) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'search_dictionary: variant must be an object';
  END IF;

  IF pg_catalog.jsonb_typeof(v_variants -> p_variant_index -> 'served_count') = 'number' THEN
    v_count := CAST(v_variants -> p_variant_index ->> 'served_count' AS numeric);
  ELSE
    v_count := 0;
  END IF;

  -- Best-effort: stop inflating a single variant. Row is unchanged.
  IF v_count >= 100000 THEN
    RETURN v_row;
  END IF;

  v_variants := pg_catalog.jsonb_set(
    v_variants,
    ARRAY[p_variant_index::text, 'served_count'],
    pg_catalog.to_jsonb(v_count + 1),
    true
  );
  v_variants := pg_catalog.jsonb_set(
    v_variants,
    ARRAY[p_variant_index::text, 'last_served_at'],
    pg_catalog.to_jsonb(pg_catalog.now()),
    true
  );

  UPDATE public.search_dictionary
  SET location_data = pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(
      location_data,
      '{variants}',
      v_variants,
      false
    ),
    '{last_pick_at}',
    pg_catalog.to_jsonb(pg_catalog.now()),
    true
  )
  WHERE original_query = v_original
  RETURNING *
  INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.bump_search_dictionary_served(text, integer) IS
  'Increments search_dictionary variants[idx].served_count by 1 and stamps last_served_at and last_pick_at with server now(). Ceiling 100000.';

REVOKE ALL ON FUNCTION public.upsert_search_dictionary(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_search_dictionary(text, text, jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.bump_search_dictionary_served(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_search_dictionary_served(text, integer) TO anon, authenticated;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.search_dictionary;
