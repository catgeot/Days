-- Admin remove of a photo that is on screen but not in place_stats (Pexels backfill)
-- used to raise P0002. Record an exclusion instead, and let every client hide those keys.

DROP FUNCTION IF EXISTS public.gallery_moderate_apply(text, text, text, uuid, text, text);

CREATE FUNCTION public.gallery_moderate_apply(
  p_action text,
  p_place_id text,
  p_image_id text,
  p_actor uuid,
  p_reason text DEFAULT 'admin'::text,
  p_note text DEFAULT NULL::text,
  p_image_url text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_gallery jsonb;
  v_thumb   text;
  v_item    jsonb;
  v_idx     integer;
  v_key     text;
  v_new     jsonb;
  v_ex      public.gallery_photo_exclusions;
  v_report_url text;
  v_n       integer;
BEGIN
  IF NOT public.is_app_admin(p_actor, 'gallery') THEN
    RAISE EXCEPTION 'gallery_moderate_apply: actor is not a gallery admin' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('remove', 'restore', 'dismiss') THEN
    RAISE EXCEPTION 'gallery_moderate_apply: bad action' USING ERRCODE = '22023';
  END IF;
  IF NOT public.place_stats_id_ok(p_place_id) OR p_image_id IS NULL OR char_length(p_image_id) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'gallery_moderate_apply: bad place_id or image_id' USING ERRCODE = '22023';
  END IF;
  IF p_reason NOT IN ('irrelevant','inappropriate','low_quality','copyright','other','admin') THEN
    RAISE EXCEPTION 'gallery_moderate_apply: bad reason' USING ERRCODE = '22023';
  END IF;

  SELECT ps.gallery_urls, ps.image_url INTO v_gallery, v_thumb
  FROM public.place_stats ps WHERE ps.place_id = p_place_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'gallery_moderate_apply: place not found' USING ERRCODE = 'P0002';
  END IF;
  v_gallery := CASE WHEN jsonb_typeof(v_gallery) = 'array' THEN v_gallery ELSE '[]'::jsonb END;

  IF p_action = 'dismiss' THEN
    UPDATE public.gallery_photo_reports
    SET status = 'dismissed', resolved_by = p_actor, resolved_at = now()
    WHERE place_id = p_place_id AND image_id = p_image_id AND status = 'open';
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN jsonb_build_object('applied', 'dismiss', 'reports', v_n);
  END IF;

  IF p_action = 'remove' THEN
    IF EXISTS (SELECT 1 FROM public.gallery_photo_exclusions e
               WHERE e.place_id = p_place_id AND e.image_id = p_image_id AND e.restored_at IS NULL) THEN
      RETURN jsonb_build_object('applied', 'noop', 'reason', 'already excluded');
    END IF;

    SELECT x, (o - 1)::integer INTO v_item, v_idx
    FROM jsonb_array_elements(v_gallery) WITH ORDINALITY e(x, o)
    WHERE x ->> 'id' = p_image_id
    LIMIT 1;

    IF v_item IS NULL THEN
      SELECT max(r.image_url) INTO v_report_url FROM public.gallery_photo_reports r
      WHERE r.place_id = p_place_id AND r.image_id = p_image_id;
      IF v_report_url IS NULL
         AND p_image_url IS NOT NULL
         AND public.gallery_url_ok(p_image_url, 'image') THEN
        v_report_url := p_image_url;
      END IF;
      IF v_report_url IS NULL THEN
        v_item := jsonb_build_object('id', p_image_id);
      ELSE
        v_item := jsonb_build_object('id', p_image_id, 'urls', jsonb_build_object('regular', v_report_url));
      END IF;
    END IF;

    v_key := public.gallery_url_key(coalesce(v_item #>> '{urls,regular}', v_item #>> '{urls,small}'));

    INSERT INTO public.gallery_photo_exclusions
      (place_id, image_id, image_url_key, image_snapshot, original_index, reason, note, removed_by)
    VALUES
      (p_place_id, p_image_id, v_key,
       coalesce(public.gallery_sanitize_item(v_item),
                CASE WHEN pg_column_size(v_item) <= 16000 THEN v_item
                     ELSE jsonb_build_object('id', p_image_id, 'oversized', true) END),
       v_idx, p_reason, left(p_note, 300), p_actor);

    SELECT coalesce(jsonb_agg(x ORDER BY o), '[]'::jsonb) INTO v_new
    FROM jsonb_array_elements(v_gallery) WITH ORDINALITY e(x, o)
    WHERE x ->> 'id' IS DISTINCT FROM p_image_id
      AND (v_key IS NULL OR public.gallery_url_key(coalesce(x #>> '{urls,regular}', x #>> '{urls,small}')) IS DISTINCT FROM v_key);

    IF coalesce(v_thumb, '') = '' OR public.gallery_url_key(v_thumb) IS NOT DISTINCT FROM v_key THEN
      v_thumb := public.gallery_thumb_of(v_new);
    END IF;

    UPDATE public.place_stats SET gallery_urls = v_new, image_url = v_thumb WHERE place_id = p_place_id;

    UPDATE public.gallery_photo_reports
    SET status = 'actioned', resolved_by = p_actor, resolved_at = now()
    WHERE place_id = p_place_id AND image_id = p_image_id AND status = 'open';

    RETURN jsonb_build_object('applied', 'remove', 'count', jsonb_array_length(v_new), 'image_url', v_thumb);
  END IF;

  SELECT * INTO v_ex FROM public.gallery_photo_exclusions e
  WHERE e.place_id = p_place_id AND e.image_id = p_image_id AND e.restored_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'gallery_moderate_apply: no active exclusion' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.gallery_photo_exclusions SET restored_by = p_actor, restored_at = now() WHERE id = v_ex.id;

  v_item := public.gallery_sanitize_item(v_ex.image_snapshot);
  IF v_item IS NULL THEN
    RETURN jsonb_build_object('applied', 'restore', 'reinserted', false, 'reason', 'snapshot no longer passes the URL allowlist');
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_gallery) x WHERE x ->> 'id' = p_image_id) THEN
    RETURN jsonb_build_object('applied', 'restore', 'reinserted', false, 'reason', 'already in gallery');
  END IF;

  v_idx := LEAST(coalesce(v_ex.original_index, jsonb_array_length(v_gallery)), jsonb_array_length(v_gallery));
  IF v_idx >= jsonb_array_length(v_gallery) THEN
    v_new := v_gallery || jsonb_build_array(v_item);
  ELSE
    v_new := jsonb_insert(v_gallery, ARRAY[v_idx::text], v_item);
  END IF;
  IF coalesce(v_thumb, '') = '' OR v_idx = 0 THEN
    v_thumb := public.gallery_thumb_of(v_new);
  END IF;

  UPDATE public.place_stats SET gallery_urls = v_new, image_url = v_thumb WHERE place_id = p_place_id;
  RETURN jsonb_build_object('applied', 'restore', 'reinserted', true, 'index', v_idx,
                            'count', jsonb_array_length(v_new), 'image_url', v_thumb);
END;
$function$;

REVOKE ALL ON FUNCTION public.gallery_moderate_apply(text, text, text, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gallery_moderate_apply(text, text, text, uuid, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.gallery_active_exclusion_keys(p_place_id text)
RETURNS TABLE (image_id text, image_url_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT e.image_id, e.image_url_key
  FROM public.gallery_photo_exclusions e
  WHERE e.place_id = p_place_id
    AND e.restored_at IS NULL
    AND public.place_stats_id_ok(p_place_id)
  LIMIT 500;
$function$;

REVOKE ALL ON FUNCTION public.gallery_active_exclusion_keys(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gallery_active_exclusion_keys(text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
