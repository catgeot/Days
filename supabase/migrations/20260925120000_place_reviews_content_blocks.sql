-- Phase 1: ordered body blocks for place reviews (read path; write via ops/editor later).

ALTER TABLE public.place_reviews
  ADD COLUMN IF NOT EXISTS content_blocks jsonb;

COMMENT ON COLUMN public.place_reviews.content_blocks IS
  'Optional ordered body: [{ "type": "text", "text": "..." }, { "type": "image", "image_index": 0 }]. image_index indexes images[].';
