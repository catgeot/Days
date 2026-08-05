#!/usr/bin/env node
/**
 * 테마여행 #26 — 축제 상세 주변 관광지 연결 스모크.
 *
 *   npm run smoke:korea-festival-nearby
 *
 * 정적 검사 + (Secrets 있을 때) DB nearby LIVE.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { mapTourAttractionRow } from '../src/pages/Home/lib/koreaTourAttractionMap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetSrc.includes('fetchNearbyTourAttractions'),
  'FestivalDetailSheet imports fetchNearbyTourAttractions',
);
assert(sheetSrc.includes('주변 관광지'), 'FestivalDetailSheet shows 주변 관광지');
assert(
  sheetSrc.includes('ThemeSpotDetailModal'),
  'FestivalDetailSheet opens ThemeSpotDetailModal',
);
assert(sheetSrc.includes('overlayZClass'), 'nearby modal elevated over festival sheet');
assert(
  !sheetSrc.includes('KoreaFestivalMap'),
  'FestivalDetailSheet does not touch map component',
);

const nearbySrc = readFileSync(
  join(root, 'src/utils/fetchNearbyTourAttractions.js'),
  'utf8',
);
assert(
  nearbySrc.includes("from('tourapi_attraction')"),
  'nearby reads tourapi_attraction',
);
assert(nearbySrc.includes('content_type_id'), 'nearby filters type12');

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(modalSrc.includes('overlayZClass'), 'ThemeSpotDetailModal accepts overlayZClass');
assert(
  modalSrc.includes('e.stopPropagation()'),
  'ThemeSpotDetailModal stops backdrop bubble',
);

const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (url && anon) {
  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from('tourapi_attraction')
    .select(
      'content_id, title, addr1, addr2, area_code, mapx, mapy, first_image, active',
    )
    .eq('active', true)
    .eq('content_type_id', '12')
    .not('mapx', 'is', null)
    .not('mapy', 'is', null)
    .limit(3);

  assert(!error, `sample query (${error?.message || 'ok'})`);
  const withGeo = (data || []).find(
    (r) => Number.isFinite(Number(r.mapx)) && Number.isFinite(Number(r.mapy)),
  );
  if (withGeo) {
    const lat = Number(withGeo.mapy);
    const lng = Number(withGeo.mapx);
    const radiusKm = 8;
    const dLat = radiusKm / 111;
    const cos = Math.cos((lat * Math.PI) / 180);
    const dLng = radiusKm / (111 * Math.max(Math.abs(cos), 0.2));
    const { data: nearRows, error: nearErr } = await sb
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
    assert(!nearErr, `nearby LIVE (${nearErr?.message || 'ok'})`);
    const r2 = radiusKm * radiusKm;
    let hits = 0;
    for (const row of nearRows || []) {
      const spot = mapTourAttractionRow(row);
      if (!spot || spot.lat == null || spot.lng == null) continue;
      const dy = (spot.lat - lat) * 111;
      const dx = (spot.lng - lng) * 111 * cos;
      if (dy * dy + dx * dx <= r2) hits += 1;
    }
    assert(hits >= 1, `nearby LIVE ≥1 (got ${hits})`);
  } else {
    console.log('SKIP  nearby LIVE (no geo sample)');
  }
} else {
  console.log('SKIP  nearby LIVE (no supabase secrets)');
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:korea-festival-nearby PASS');
