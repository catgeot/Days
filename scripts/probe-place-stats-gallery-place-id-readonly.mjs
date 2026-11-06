#!/usr/bin/env node
/**
 * Read-only: place_stats rows for canonical + candidate place_ids (anon key).
 * Does not write. Exit 0 if Supabase env present; still 0 when RLS returns empty (prints notice).
 */
import { createClient } from '@supabase/supabase-js';
import { buildPlaceDbIdCandidates, getPlaceStatsId } from '../src/utils/travelSpotResolve.js';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const UGEUMCHI = {
  slug: 'tour-128113',
  id: '128113',
  name: '공주 우금치 전적',
  name_en: 'Ugeumchi Battlefield',
  country: 'South Korea',
};

function main() {
  if (!url || !key) {
    console.log(
      JSON.stringify({
        ok: false,
        reason: 'missing_env',
        hint: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required for live read',
      }),
    );
    process.exit(0);
    return;
  }

  const canonical = getPlaceStatsId(UGEUMCHI);
  const candidates = buildPlaceDbIdCandidates(UGEUMCHI);
  const supabase = createClient(url, key);

  void (async () => {
    const { data, error } = await supabase
      .from('place_stats')
      .select('place_id, gallery_urls')
      .in('place_id', candidates);

    const rows = Array.isArray(data) ? data : [];
    const summary = rows.map((r) => ({
      place_id: r.place_id,
      gallery_count: Array.isArray(r.gallery_urls) ? r.gallery_urls.length : 0,
    }));

    const loadedVsCanonical =
      rows.length === 0
        ? 'no_rows_or_rls_empty'
        : rows.some((r) => String(r.place_id) === canonical)
          ? 'canonical_place_id_has_row'
          : 'canonical_place_id_missing_among_hits';

    console.log(
      JSON.stringify(
        {
          ok: !error,
          error: error ? { message: error.message, code: error.code } : null,
          canonical,
          candidates,
          row_count: rows.length,
          summary,
          note:
            'This read does not prove client pickPlaceStatsGalleryRow vs mismatch; only lists rows hit by in(candidates).',
          loaded_vs_canonical_hint: loadedVsCanonical,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  })();
}

main();
