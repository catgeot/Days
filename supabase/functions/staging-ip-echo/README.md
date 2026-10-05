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

`verify.sh` lowercases the project ref and refuses production ref `phdjnbfitvmrguqzverm`. The egress IP is the `ip=` line from `https://<ref>.supabase.co/cdn-cgi/trace` (`curl -4`), not a public IP echo. The echo call also uses `curl -4`.

`ANON_KEY` must be the legacy anon JWT (three dot-separated parts). An `sb_publishable_` key is not a JWT: `fetch-place-videos` returns 401. Requests to that function also need an allowed Origin (`https://www.gateo.kr`, `https://gateo.kr`, or a `days-git` Vercel preview host). `verify.sh` sends `https://www.gateo.kr`.

The client IP default is `cf-connecting-ip`. If that header is missing, X-Forwarded-For is read with trusted hops 2, skipping the Supabase internal hop. `FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER=x-real-ip` is ignored. A forged `CF-Connecting-IP` that Cloudflare answers with HTTP 403 and a non-JSON body is PASS (`spoof rejected`).

PASS: `clientIp` equals the trace IP. Missing or `unknown` is FAIL. No port. Forged XFF and forged X-Real-IP still match the trace IP. Seven distinct uncached catalog places, seventh response 429.
