# STAGING ONLY — delete after the XFF check

This function is not for production. `verify_jwt` stays true. The response has no CORS header, so a browser page cannot read it. Call it only with the staging anon JWT from `verify.sh`.

`supabase/config.toml` commits `enabled = false`. A bulk `supabase functions deploy` skips this function. Do not commit `enabled = true`.

The function returns 404 unless the secret `STAGING_IP_ECHO_ALLOW` is exactly `1`. A 404 from `verify.sh` means that secret is missing.

On the staging project only, in a working copy:

1. Set `[functions.staging-ip-echo] enabled = true` in `supabase/config.toml`. Leave that change uncommitted.
2. Set the function secret `STAGING_IP_ECHO_ALLOW=1` on staging.
3. Deploy by name, run `verify.sh`, then delete the function.

```bash
supabase secrets set STAGING_IP_ECHO_ALLOW=1 --project-ref "$STAGING_REF"
supabase functions deploy staging-ip-echo --project-ref "$STAGING_REF"
IP_ECHO_URL=https://<staging-ref>.supabase.co/functions/v1/staging-ip-echo \
VIDEOS_URL=https://<staging-ref>.supabase.co/functions/v1/fetch-place-videos \
ANON_KEY=... \
bash supabase/functions/staging-ip-echo/verify.sh
supabase functions delete staging-ip-echo --project-ref "$STAGING_REF"
```

`verify.sh` refuses the production project ref `phdjnbfitvmrguqzverm`. Egress lookup and the echo call both use `curl -4`, so they share one IPv4 path.

`FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER=x-real-ip` is ignored. X-Real-IP is used only when X-Forwarded-For is absent. See the PR plan for the pass rules.
