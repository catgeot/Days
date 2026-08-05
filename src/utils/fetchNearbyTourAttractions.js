import { supabase } from '../shared/api/supabase';
import { mapTourAttractionRow } from '../pages/Home/lib/koreaTourAttractionMap';

/**
 * 축제장 등 좌표 기준 주변 type12 (DB) — 목록 bbox 근사.
 * 축제 지도 리팩터 없이 훅만 제공.
 *
 * @param {{
 *   lat: number,
 *   lng: number,
 *   radiusKm?: number,
 *   limit?: number,
 * }} opts
 */
export async function fetchNearbyTourAttractions(opts) {
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { spots: [], error: 'lat/lng required' };
  }
  const radiusKm = Math.min(Math.max(Number(opts?.radiusKm) || 5, 0.5), 50);
  const limit = Math.min(Math.max(Number(opts?.limit) || 12, 1), 40);
  const dLat = radiusKm / 111;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusKm / (111 * Math.max(Math.abs(cos), 0.2));

  const { data, error } = await supabase
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

  if (error) {
    console.warn('[nearbyTourAttractions]', error.message || error);
    return { spots: [], error: error.message || String(error) };
  }

  const r2 = radiusKm * radiusKm;
  const scored = [];
  for (const row of data || []) {
    const spot = mapTourAttractionRow(row);
    if (!spot || spot.lat == null || spot.lng == null) continue;
    const dy = (spot.lat - lat) * 111;
    const dx = (spot.lng - lng) * 111 * cos;
    const dist2 = dy * dy + dx * dx;
    if (dist2 > r2) continue;
    scored.push({ spot, distKm: Math.sqrt(dist2) });
  }
  scored.sort((a, b) => a.distKm - b.distKm);
  return {
    spots: scored.slice(0, limit).map((s) => ({ ...s.spot, distKm: s.distKm })),
    error: null,
  };
}
