#!/usr/bin/env node
/**
 * tourapi_attraction DB + scenic 매핑 스모크.
 *
 *   npm run smoke:tourapi-attractions
 *
 * 필요: VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY
 * (선택) TOURAPI_ATTRACTION_MIN_ACTIVE — 기본 1 · sync 후 검증 시 5000 권장
 */
import { createClient } from '@supabase/supabase-js';
import {
  mapTourAttractionRow,
  scenicRegionForAreaCode,
} from '../src/pages/Home/lib/koreaTourAttractionMap.js';

const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const minActive = Number(process.env.TOURAPI_ATTRACTION_MIN_ACTIVE || '1');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

async function nearbyViaClient(sb, lat, lng, radiusKm = 8, limit = 5) {
  const dLat = radiusKm / 111;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusKm / (111 * Math.max(Math.abs(cos), 0.2));
  const { data, error } = await sb
    .from('tourapi_attraction')
    .select(
      'content_id, title, addr1, addr2, area_code, mapx, mapy, first_image, active',
    )
    .eq('active', true)
    .eq('content_type_id', '12')
    .gte('mapy', lat - dLat)
    .lte('mapy', lat + dLat)
    .gte('mapx', lng - dLng)
    .lte('mapx', lng + dLng)
    .limit(80);
  if (error) return { spots: [], error: error.message };
  const r2 = radiusKm * radiusKm;
  const scored = [];
  for (const row of data || []) {
    const spot = mapTourAttractionRow(row);
    if (!spot || spot.lat == null || spot.lng == null) continue;
    const dy = (spot.lat - lat) * 111;
    const dx = (spot.lng - lng) * 111 * cos;
    const dist2 = dy * dy + dx * dx;
    if (dist2 > r2) continue;
    scored.push(spot);
  }
  return { spots: scored.slice(0, limit), error: null };
}

async function main() {
  assert(Boolean(url && anon), 'supabase url+anon present');
  if (!url || !anon) {
    process.exit(1);
  }

  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { count, error: countErr } = await sb
    .from('tourapi_attraction')
    .select('content_id', { count: 'exact', head: true })
    .eq('active', true)
    .eq('content_type_id', '12');

  assert(!countErr, `count query (${countErr?.message || 'ok'})`);
  assert(
    typeof count === 'number' && count >= minActive,
    `active≥${minActive} (got ${count})`,
  );

  const { data, error } = await sb
    .from('tourapi_attraction')
    .select(
      'content_id, title, addr1, addr2, area_code, mapx, mapy, first_image, active',
    )
    .eq('active', true)
    .eq('content_type_id', '12')
    .order('title', { ascending: true })
    .limit(5);

  assert(!error, `list query (${error?.message || 'ok'})`);
  assert(Array.isArray(data) && data.length >= 1, `list≥1 (got ${data?.length ?? 0})`);

  const spot = mapTourAttractionRow(data?.[0] || {});
  assert(Boolean(spot?.contentId && spot?.name), 'mapTourAttractionRow fields');
  assert(
    Boolean(scenicRegionForAreaCode(data?.[0]?.area_code) || spot?.region),
    `region map (${data?.[0]?.area_code} → ${spot?.region})`,
  );

  const withGeo = (data || []).find(
    (r) => Number.isFinite(Number(r.mapx)) && Number.isFinite(Number(r.mapy)),
  );
  if (withGeo) {
    const nearby = await nearbyViaClient(
      sb,
      Number(withGeo.mapy),
      Number(withGeo.mapx),
    );
    assert(!nearby.error, `nearby hook (${nearby.error || 'ok'})`);
    assert(
      Array.isArray(nearby.spots) && nearby.spots.length >= 1,
      `nearby≥1 (got ${nearby.spots?.length ?? 0})`,
    );
  } else {
    console.log('SKIP  nearby (no geo in sample)');
  }

  if (failed) {
    console.error(`\n${failed} smoke assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nsmoke:tourapi-attractions PASS');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
