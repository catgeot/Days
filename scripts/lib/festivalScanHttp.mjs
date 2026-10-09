import { createClient } from '@supabase/supabase-js';
import { mapTourAttractionRow } from '../../src/pages/Home/lib/koreaTourAttractionMap.js';
import { isNearbyTourAttractionCandidate } from '../../src/pages/Home/lib/koreaTourAttractionNearbyFilter.js';

export function scanSupabaseConfig() {
  const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required for LIVE scan');
  }
  return { url: url.replace(/\/$/, ''), anon };
}

export function scanSupabase() {
  const { url, anon } = scanSupabaseConfig();
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function invokeTourApiProxyScan(action, payload = {}) {
  const { url, anon } = scanSupabaseConfig();
  const res = await fetch(`${url}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, locale: 'ko', ...payload }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.ok) return null;
  return data;
}

export async function scanFetchNearbyAttractions(opts) {
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { spots: [], error: 'lat/lng required' };
  }
  const radiusKm = Math.min(Math.max(Number(opts?.radiusKm) || 8, 0.5), 50);
  const limit = Math.min(Math.max(Number(opts?.limit) || 8, 1), 40);
  const dLat = radiusKm / 111;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusKm / (111 * Math.max(Math.abs(cos), 0.2));
  const sb = scanSupabase();
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
    .limit(120);
  if (error) return { spots: [], error: error.message || String(error) };
  const r2 = radiusKm * radiusKm;
  const scored = [];
  for (const row of data || []) {
    if (!isNearbyTourAttractionCandidate(row)) continue;
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

async function scanLocationBased(contentTypeId, opts) {
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  const limit = Math.min(Math.max(Number(opts?.limit) || 8, 1), 20);
  const radiusKm = Math.min(Math.max(Number(opts?.radiusKm) || 5, 0.5), 20);
  const radiusM = Math.min(Math.round(radiusKm * 1000), 20_000);
  const data = await invokeTourApiProxyScan('locationBasedList', {
    mapX: lng,
    mapY: lat,
    radius: radiusM,
    contentTypeId,
    numOfRows: limit,
    pageNo: 1,
  });
  const items = Array.isArray(data?.items) ? data.items : [];
  return { spots: items, error: items.length ? null : 'empty' };
}

export function scanFetchNearbyRestaurants(opts) {
  return scanLocationBased('39', opts);
}

export function scanFetchNearbyLeports(opts) {
  return scanLocationBased('28', opts);
}

export function scanFetchNearbyCulture(opts) {
  return scanLocationBased('14', opts);
}

export async function scanFetchNearbyCourses(opts) {
  const areaCode = String(opts?.areaCode ?? '').trim();
  if (!areaCode) return { spots: [], error: 'areaCode required' };
  const data = await invokeTourApiProxyScan('areaBasedList', {
    areaCode,
    contentTypeId: '25',
    numOfRows: 30,
    pageNo: 1,
  });
  const items = Array.isArray(data?.items) ? data.items : [];
  return { spots: items, error: items.length ? null : 'empty' };
}
