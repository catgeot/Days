-- Read-only keys for active gallery removals. File only: do not apply to a database.
-- Returns image_id and image_url_key. No snapshot, note, or moderator id.
-- Does not UPDATE or DELETE place_stats or gallery_photo_exclusions.

CREATE OR REPLACE FUNCTION public.gallery_excluded_keys(p_place_id text)
RETURNS TABLE (image_id text, image_url_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT e.image_id, e.image_url_key
  FROM public.gallery_photo_exclusions e
  WHERE e.restored_at IS NULL
    AND p_place_id IS NOT NULL
    AND btrim(p_place_id) <> ''
    AND e.place_id = p_place_id;
$$;

REVOKE ALL ON FUNCTION public.gallery_excluded_keys(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gallery_excluded_keys(text) TO anon, authenticated;
