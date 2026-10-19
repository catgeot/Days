# YouTube weekly `place_videos` compliance refresh

Re-validates cached YouTube video IDs with **`videos.list`** (`part=snippet,status`) so embeddable public videos stay in cache and policy-breaking rows are dropped. Does **not** call `search.list`.

Edge function: `supabase/functions/refresh-place-videos`

## Behavior

| Step | Detail |
|------|--------|
| Selection | `place_videos` rows with `last_updated` older than **20 days** (override: `cutoff_days` query param, clamped 0–30) |
| Limit | Optional `limit` query param (1–1000) caps how many stale places are examined in one run |
| YouTube | Unique video IDs batched **50** per `videos.list` request; **batch failures do not abort** the run |
| Drop | Missing from API, non-`public`, or `embeddable === false` |
| Update | Refresh `title` / `channelTitle` / `publishedAt`; set `last_updated = now()` on successful apply |
| Empty cache | Rows with **zero** videos are kept; only `last_updated` is bumped |
| Report-only (default) | **`REFRESH_VIDEOS_APPLY` unset** — same as dry run: candidates report, **no DB writes**. Weekly cron should stay in this mode for the first ~4 runs. |
| Apply | Set **`REFRESH_VIDEOS_APPLY=on`** on the edge function to allow writes (still blocked by `?dry_run=1`). |
| Safety cap | If removals would exceed **`REFRESH_VIDEOS_MAX_REMOVE_PCT`** (default **5**) of **successfully-checked** video entries, **no writes** and HTTP **409** `cap_exceeded` |
| Dry run | `?dry_run=1` — compute summary + removal candidates, no DB updates (even when apply is on) |
| Partial failure | Per-place YouTube batch errors and DB write errors are collected in `failures`; run continues. HTTP **200** with `success: false` when any failure occurred (409 unchanged for cap). |
| 30-day metadata | Rows with `last_updated` older than **30 days** that cannot be refreshed (batch/write failure) have `title` / `channelTitle` / `publishedAt` stripped on apply (ids + GATEO `ai_context` kept). Report-only runs expose `metadata_blanked_would`. |
| Run log | Each run is persisted (best effort) to `public.place_videos_refresh_runs` (service role only). |

Response echoes effective **`cutoff_days`** and **`limit`**.

## Auth

Not publicly triggerable. Every request must include:

```http
x-refresh-videos-token: <same value as REFRESH_VIDEOS_TOKEN secret>
```

Set `REFRESH_VIDEOS_TOKEN` on the edge function (generate a long random string). Cron / manual callers use the same value in the header.

`verify_jwt` is **false** for this function; JWT alone is not sufficient.

### Status check (GitHub Actions)

```http
GET /functions/v1/refresh-place-videos?status=1
x-refresh-videos-token: <REFRESH_VIDEOS_TOKEN>
```

Returns `{ ok: true, latest: { ... } }` for the most recent row in `place_videos_refresh_runs`.

## Secrets (edge)

| Secret | Purpose |
|--------|---------|
| `YOUTUBE_API_KEY` | Same key as `fetch-place-videos` (falls back to `VITE_YOUTUBE_API_KEY`) |
| `REFRESH_VIDEOS_TOKEN` | Shared cron/manual auth header |
| `REFRESH_VIDEOS_APPLY` | Set to `on` to allow DB writes; **omit for report-only** (recommended for cron until ops review reports) |
| `REFRESH_VIDEOS_MAX_REMOVE_PCT` | Max share of examined videos removable in one run (default **5**); exceed → `cap_exceeded`, no writes |
| `SUPABASE_URL` | Service client |
| `SUPABASE_SERVICE_ROLE_KEY` | Read/update `place_videos`, insert `place_videos_refresh_runs` |

## GitHub Actions secrets (youtube-refresh-check workflow)

| Secret | Purpose |
|--------|---------|
| `REFRESH_VIDEOS_TOKEN` | Same token as edge (status endpoint auth) |
| `SUPABASE_URL` | Project URL (`https://<ref>.supabase.co`) |

Workflow: `.github/workflows/youtube-refresh-check.yml` — schedule **Mon 05:20 KST** (`20 20 * * 0` UTC), ~30 minutes after pg_cron refresh. Fails the job (GitHub email) if the latest run is missing, older than ~2 hours, `success=false`, or `failed_count > 0`.

## Deploy

```bash
# From repo root, with Supabase CLI linked to the target project
npx supabase db push   # applies place_videos_refresh_runs migration (when approved)
npx supabase secrets set REFRESH_VIDEOS_TOKEN="<generate-secret>"
# YOUTUBE_API_KEY should already exist for fetch-place-videos

npx supabase functions deploy refresh-place-videos --no-verify-jwt
npx supabase functions deploy fetch-place-videos
```

Add GitHub repository secrets `REFRESH_VIDEOS_TOKEN` and `SUPABASE_URL` for the check workflow.

Smoke (dry run, no writes):

```bash
curl -sS "https://<PROJECT_REF>.supabase.co/functions/v1/refresh-place-videos?dry_run=1" \
  -H "x-refresh-videos-token: <REFRESH_VIDEOS_TOKEN>"
```

Report-only (default — no `REFRESH_VIDEOS_APPLY`):

```bash
curl -sS -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/refresh-place-videos" \
  -H "x-refresh-videos-token: <REFRESH_VIDEOS_TOKEN>"
```

Live apply (after `npx supabase secrets set REFRESH_VIDEOS_APPLY=on`):

```bash
curl -sS -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/refresh-place-videos" \
  -H "x-refresh-videos-token: <REFRESH_VIDEOS_TOKEN>"
```

Manual test overrides (never enable writes by themselves):

```bash
curl -sS "https://<PROJECT_REF>.supabase.co/functions/v1/refresh-place-videos?dry_run=1&cutoff_days=0&limit=5" \
  -H "x-refresh-videos-token: <REFRESH_VIDEOS_TOKEN>"
```

## Schedule (pg_cron + pg_net)

SQL draft (commented): `supabase/migrations/20261018180000_place_videos_weekly_refresh_cron.sql`

- **When**: `50 19 * * 0` — Sunday **19:50 UTC** = Monday **04:50 KST**
- **Do not apply** until placeholders are replaced and ops approves (file is documentation-first).

Apply manually in SQL editor after replacing `<PROJECT_REF>` and `<REFRESH_VIDEOS_TOKEN>`.

## Rollback

1. **Stop cron**: `SELECT cron.unschedule('place-videos-weekly-refresh');`
2. **Disable edge** (optional): delete or redeploy a no-op, or revoke `REFRESH_VIDEOS_TOKEN` from callers.
3. **Disable GH check**: disable or delete `.github/workflows/youtube-refresh-check.yml`.
4. **Data**: This job only removes invalid videos from cache; restoring old rows requires backup / re-fetch via `fetch-place-videos` (not automatic).

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
deno test --allow-env --import-map supabase/functions/fetch-place-videos/test.importmap.json \
  supabase/functions/fetch-place-videos/index_test.ts
```
