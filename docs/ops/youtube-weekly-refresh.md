# YouTube weekly `place_videos` compliance refresh

Re-validates cached YouTube video IDs with **`videos.list`** (`part=snippet,status`) so embeddable public videos stay in cache and policy-breaking rows are dropped. Does **not** call `search.list`.

Edge function: `supabase/functions/refresh-place-videos`

## Behavior

| Step | Detail |
|------|--------|
| Selection | `place_videos` rows with `last_updated` older than **23 days** |
| YouTube | Unique video IDs batched **50** per `videos.list` request |
| Drop | Missing from API, non-`public`, or `embeddable === false` |
| Update | Refresh `title` / `channelTitle`; set `last_updated = now()` |
| Empty cache | Rows with **zero** videos are kept; only `last_updated` is bumped |
| Safety | If removals would exceed **20%** of examined video entries, **no writes** and HTTP **409** `removal_guard` |
| Dry run | `?dry_run=1` — compute summary, no DB updates |

## Auth

Not publicly triggerable. Every request must include:

```http
x-refresh-videos-token: <same value as REFRESH_VIDEOS_TOKEN secret>
```

Set `REFRESH_VIDEOS_TOKEN` on the edge function (generate a long random string). Cron / manual callers use the same value in the header.

`verify_jwt` is **false** for this function; JWT alone is not sufficient.

## Secrets (edge)

| Secret | Purpose |
|--------|---------|
| `YOUTUBE_API_KEY` | Same key as `fetch-place-videos` (falls back to `VITE_YOUTUBE_API_KEY`) |
| `REFRESH_VIDEOS_TOKEN` | Shared cron/manual auth header |
| `SUPABASE_URL` | Service client |
| `SUPABASE_SERVICE_ROLE_KEY` | Read/update `place_videos` |

## Deploy

```bash
# From repo root, with Supabase CLI linked to the target project
npx supabase secrets set REFRESH_VIDEOS_TOKEN="<generate-secret>"
# YOUTUBE_API_KEY should already exist for fetch-place-videos

npx supabase functions deploy refresh-place-videos --no-verify-jwt
```

Smoke (dry run, no writes):

```bash
curl -sS "https://<PROJECT_REF>.supabase.co/functions/v1/refresh-place-videos?dry_run=1" \
  -H "x-refresh-videos-token: <REFRESH_VIDEOS_TOKEN>"
```

Live run:

```bash
curl -sS -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/refresh-place-videos" \
  -H "x-refresh-videos-token: <REFRESH_VIDEOS_TOKEN>"
```

## Schedule (pg_cron + pg_net)

SQL draft (commented): `supabase/migrations/20261018180000_place_videos_weekly_refresh_cron.sql`

- **When**: `0 18 * * 6` — Saturday **18:00 UTC** = Sunday **03:00 KST**
- **Do not apply** until placeholders are replaced and ops approves (file is documentation-first).

Apply manually in SQL editor after replacing `<PROJECT_REF>` and `<REFRESH_VIDEOS_TOKEN>`.

## Rollback

1. **Stop cron**: `SELECT cron.unschedule('place-videos-weekly-refresh');`
2. **Disable edge** (optional): delete or redeploy a no-op, or revoke `REFRESH_VIDEOS_TOKEN` from callers.
3. **Data**: This job only removes invalid videos from cache; restoring old rows requires backup / re-fetch via `fetch-place-videos` (not automatic).

## Verification (repo)

```bash
npm run lint:ci
npm run test:health
npm run build
node --test scripts/health/place-video-weekly-refresh.test.mjs
```

Optional Deno handler tests (mocked):

```bash
deno test --allow-env --import-map supabase/functions/refresh-place-videos/test.importmap.json \
  supabase/functions/refresh-place-videos/index_test.ts
```
