-- Manual rollback for 20261104120000_tourapi_attraction_source.sql.
-- Not a forward migration. supabase db push does not apply files in this folder.
-- Do not run against prod unless the forward migration should be undone.

ALTER TABLE public.tourapi_attraction DROP COLUMN IF EXISTS source;
