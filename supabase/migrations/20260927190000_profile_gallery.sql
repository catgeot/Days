-- Profile photo list and visibility. Cover stays on profiles.avatar_url.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_public boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.avatar_urls IS 'Profile photo URLs. The cover shown elsewhere is avatar_url (first item).';
COMMENT ON COLUMN public.profiles.profile_public IS 'When false, other people do not see the photos or the photo count.';

UPDATE public.profiles
SET avatar_urls = jsonb_build_array(avatar_url)
WHERE avatar_url IS NOT NULL
  AND btrim(avatar_url) <> ''
  AND avatar_urls = '[]'::jsonb;
