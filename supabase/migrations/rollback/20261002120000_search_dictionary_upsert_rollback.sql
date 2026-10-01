-- Manual rollback for 20261002120000_search_dictionary_upsert.sql.
-- Not a forward migration. supabase db push does not apply files in this folder.
-- Do not run against prod unless the forward migration should be undone.
--
-- Restores the original public INSERT policy exactly:
--   name "Enable insert for all users", INSERT, role public, WITH CHECK (true).
-- Drops public.upsert_search_dictionary(text, text, jsonb).
-- Does not change "Enable read access for all users".

DROP POLICY IF EXISTS "Enable insert for all users" ON public.search_dictionary;

CREATE POLICY "Enable insert for all users"
  ON public.search_dictionary
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP FUNCTION IF EXISTS public.upsert_search_dictionary(text, text, jsonb);
