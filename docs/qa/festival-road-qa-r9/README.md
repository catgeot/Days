# Festival road QA r9 — map zoom captures

Capture script: `node scripts/capture-festival-road-qa-r9.mjs` (Δzoom = +2)

| Route | Viewport | Base zoom | +Δ zoom | Actual Δ |
|-------|----------|-----------|---------|----------|
| east-coast | 390px | 5.002 | 7.002 | 2.000 |
| chuncheon | 390px | 5.608 | 7.608 | 2.000 |
| east-coast | 1280px | 5.002 | 7.002 | 2.000 |
| chuncheon | 1280px | 5.608 | 7.608 | 2.000 |

Files: on-{east-coast|chuncheon}-map-zoom-base-{390|1280}.png then …-plus2-….png (clip: data-festival-road-map-clip).

Console: `console.log` — full capture; CI gate ignores known preview noise (Mapbox 403/404, Supabase CORS).
Gate: no resize-loop / stack-overflow lines; no other `[error]` / `[pageerror]` outside ignore list.
