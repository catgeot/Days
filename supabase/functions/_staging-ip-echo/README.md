# STAGING ONLY — delete after the XFF check

This function is not for production. The folder name starts with `_`, so a bulk `supabase functions deploy` skips it.

Do not deploy it to the production project. Deploy it only on the staging project, run `verify.sh`, then delete the function and this folder.

`FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER=x-real-ip` is ignored. X-Real-IP is used only when X-Forwarded-For is absent. See the PR plan for the pass rules.
