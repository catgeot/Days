import { fetchKoreaFestivalsRolling12 } from '../pages/Korea/fetchKoreaFestivalsWindow';
import { pickNearbyFestivals } from '../pages/Home/lib/nearbyFestivalsPick';

export { pickNearbyFestivals } from '../pages/Home/lib/nearbyFestivalsPick';

/**
 * 여행코스·명소 좌표 기준 인근 축제 — 기존 festivalWindow 캐시 재사용.
 *
 * @param {{
 *   lat?: number,
 *   lng?: number,
 *   areaCode?: string | number,
 *   radiusKm?: number,
 *   limit?: number,
 *   excludeContentId?: string,
 *   locale?: string,
 * }} opts
 */
export async function fetchNearbyFestivals(opts) {
  const areaCode = String(opts?.areaCode ?? '').trim();
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  if (
    (!areaCode || areaCode === 'all') &&
    !(Number.isFinite(lat) && Number.isFinite(lng))
  ) {
    return { festivals: [], error: 'areaCode or lat/lng required' };
  }

  try {
    const res = await fetchKoreaFestivalsRolling12({ locale: opts?.locale });
    if (!res?.ok) {
      return {
        festivals: [],
        error: res?.error || 'festival window failed',
      };
    }
    const festivals = pickNearbyFestivals(res.items, opts);
    return { festivals, error: null };
  } catch (err) {
    console.warn('[nearbyFestivals]', err?.message || err);
    return { festivals: [], error: err?.message || String(err) };
  }
}
