-- Planner AI body EN — locale column (#22 i18n)
ALTER TABLE public.place_toolkit
  ADD COLUMN IF NOT EXISTS essential_guide_en JSONB;

ALTER TABLE public.place_toolkit_archive
  ADD COLUMN IF NOT EXISTS essential_guide_en JSONB;
