import { supabase } from '../shared/api/supabase';
import { NEARBY_TOUR_API_LOCALE, withTourApiTimeout } from './tourApiProxy';

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * locationBasedList 일일 한도(429) 등 실패 시 areaBasedList(시·군)로 주변 POI 폴백.
 *
 * @param {{
 *   lat: number,
 *   lng: number,
 *   areaCode: string,
 *   sigunguCode?: string | null,
 *   contentTypeId: string,
 *   radiusKm: number,
 *   limit: number,
 *   mapItem: (item: Record<string, unknown>, lat: number, lng: number) =>
 *     | { contentId: string, distKm?: number | null, [k: string]: unknown }
 *     | null,
 * }} opts
 */
export async function fetchNearbyTourAreaBasedFallback(opts) {
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  const areaCode = String(opts?.areaCode || '').trim();
  const sigunguCode = String(opts?.sigunguCode || '').trim();
  const contentTypeId = String(opts?.contentTypeId || '').trim();
  const radiusKm = Math.min(Math.max(Number(opts?.radiusKm) || 5, 0.5), 40);
  const limit = Math.min(Math.max(Number(opts?.limit) || 8, 1), 20);
  const mapItem = opts?.mapItem;
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !/^\d{1,10}$/.test(areaCode) ||
    !/^\d{1,4}$/.test(contentTypeId) ||
    typeof mapItem !== 'function'
  ) {
    return { spots: [], error: 'areaBased fallback args invalid' };
  }

  const maxPages = sigunguCode ? 6 : 10;
  const spots = [];
  const seen = new Set();

  try {
    for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
      const body = {
        action: 'areaBasedList',
        locale: NEARBY_TOUR_API_LOCALE,
        areaCode,
        contentTypeId,
        numOfRows: 50,
        pageNo,
        listYN: 'Y',
        arrange: 'A',
      };
      if (/^\d{1,10}$/.test(sigunguCode)) body.sigunguCode = sigunguCode;

      const { data, error } = await withTourApiTimeout(
        supabase.functions.invoke('tourapi-proxy', { body }),
        14_000,
        `tourapi:areaBasedList:${contentTypeId}`,
      );
      if (error || !data?.ok) {
        if (!spots.length) {
          return {
            spots: [],
            error:
              error?.message ||
              data?.message ||
              data?.error ||
              'areaBasedList failed',
          };
        }
        break;
      }

      const batch = Array.isArray(data.items) ? data.items : [];
      for (const item of batch) {
        const mapped = mapItem(item, lat, lng);
        if (!mapped?.contentId || seen.has(mapped.contentId)) continue;
        let distKm = Number(mapped.distKm);
        if (!Number.isFinite(distKm)) {
          const ilat = Number(item?.mapy);
          const ilng = Number(item?.mapx);
          if (!Number.isFinite(ilat) || !Number.isFinite(ilng)) continue;
          distKm = haversineKm(lat, lng, ilat, ilng);
          mapped.distKm = distKm;
        }
        if (distKm > radiusKm) continue;
        seen.add(mapped.contentId);
        spots.push(mapped);
      }

      if (batch.length < 50) break;
      if (spots.length >= limit * 3) break;
    }

    spots.sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));
    return { spots: spots.slice(0, limit), error: null };
  } catch (err) {
    return { spots: [], error: err?.message || String(err) };
  }
}

export function isTourApiQuotaError(message) {
  const s = String(message || '');
  return (
    /429/.test(s) ||
    /LIMITED_NUMBER_OF_SERVICE_REQUESTS/i.test(s) ||
    /일일 서비스 요청제한/i.test(s) ||
    /rate.?limit/i.test(s)
  );
}
