# STAGING ONLY — delete after the XFF check

This function is not for production. `verify_jwt` stays true. The response has no CORS header, so a browser page cannot read it. Call it only with the staging anon JWT from `verify.sh`.

Do not deploy it to the production project. The Supabase CLI rejects a function name that starts with `_`, so this folder is `staging-ip-echo`.

Deploy on the staging project only:

```bash
supabase functions deploy staging-ip-echo --project-ref "$STAGING_REF"
```

Run `verify.sh`, then delete the function and this folder:

```bash
supabase functions delete staging-ip-echo --project-ref "$STAGING_REF"
```

`FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER=x-real-ip` is ignored. X-Real-IP is used only when X-Forwarded-For is absent. See the PR plan for the pass rules.
