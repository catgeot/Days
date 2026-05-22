-- Archive tables are service_role-only (migration scripts). Enable RLS with no public policies.

ALTER TABLE public.place_wiki_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_stats_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_videos_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_toolkit_archive ENABLE ROW LEVEL SECURITY;
