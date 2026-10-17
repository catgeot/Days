# PR493 QA captures

## MOONi config error (shot 03)
MOONi «설정 오류 — 관리자에게 문의» = gemini-proxy CONFIG (HTTP 401 / Invalid JWT) when VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY were empty at vite build. With keys baked in, local https://127.0.0.1:4173 preview still cannot complete MOONi: gemini-proxy returns 403 origin_not_allowed (only www.gateo.kr, gateo.kr, and days-git-*-catgeots-projects.vercel.app). Automated shot 03 uses PR preview + Playwright gemini-proxy mock; humans verify live MOONi on www.gateo.kr or Vercel git preview (allowed Origin).

## Grey boxes (shots 04–05)
Stone/grey blocks are loading placeholders (`data-nearby-thumb-pending`, `data-festival-photo-reserve`, `belowSectionsLoading` skeleton) — sections mount when fetches settle; minor pop-in possible below hero.

See `manifest.json` for per-file metadata.
