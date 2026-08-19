import { supabase } from '../shared/api/supabase';
import { formatTourAttractionLocality } from '../pages/Home/lib/koreaTourAttractionLocality';
import { scenicRegionForAreaCode } from '../pages/Home/lib/koreaTourAttractionMap';
import {
  fetchNearbyTourAreaBasedFallback,
  isTourApiQuotaError,
} from './nearbyTourAreaFallback';
import { getTourApiLocale, withTourApiTimeout } from './tourApiProxy';

export const RESTAURANT_CONTENT_TYPE_ID = '39';

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

/**
 * TourAPI locationBasedList 응답 → 주변 맛집 spot.
 * @param {Record<string, unknown>} item
 * @param {number} originLat
 * @param {number} originLng
 */
function mapRestaurantItem(item, originLat, originLng) {
  const contentId = String(item?.contentId || '').trim();
  const title = String(item?.title || '').trim();
  if (!contentId || !title) return null;
  const lat = Number(item?.mapy);
  const lng = Number(item?.mapx);
  const addr1 = item?.addr1 != null ? String(item.addr1) : '';
  const addr2 = item?.addr2 != null ? String(item.addr2) : '';
  const addr = [addr1, addr2].filter(Boolean).join(' ').trim();
  const locality = formatTourAttractionLocality(addr1, addr2);
  const areaCode = item?.areaCode != null ? String(item.areaCode) : null;
  const region = scenicRegionForAreaCode(areaCode) || '기타';
  const distRaw = Number(item?.distance);
  let distKm = Number.isFinite(distRaw) && distRaw >= 0 ? distRaw / 1000 : null;
  if (
    distKm == null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(originLat) &&
    Number.isFinite(originLng)
  ) {
    const cos = Math.cos((originLat * Math.PI) / 180);
    const dy = (lat - originLat) * 111;
    const dx = (lng - originLng) * 111 * cos;
    distKm = Math.sqrt(dy * dy + dx * dx);
  }
  return {
    id: contentId,
    name: title,
    blurb: addr || 'TourAPI 맛집',
    region,
    locality,
    addr1: addr1 || null,
    addr2: addr2 || null,
    hubId: null,
    attractionName: title,
    attractionNameEn: null,
    placeSlug: null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    contentId,
    contentTypeId: RESTAURANT_CONTENT_TYPE_ID,
    firstImage: toHttps(item?.imageUrl || item?.firstimage),
    areaCode,
    tel: item?.tel != null ? String(item.tel) : null,
    distKm,
    source: 'api',
  };
}

/**
 * 축제장·명소 좌표 기준 주변 맛집(type39) — LIVE locationBasedList (전량 DB 금지).
 * locationBasedList 한도(429) 실패 시 areaCode(+sigungu) areaBasedList 폴백.
 *
 * @param {{
 *   lat: number,
 *   lng: number,
 *   radiusKm?: number,
 *   limit?: number,
 *   areaCode?: string | null,
 *   sigunguCode?: string | null,
 * }} opts
 */
export async function fetchNearbyTourRestaurants(opts) {
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { spots: [], error: 'lat/lng required' };
  }
  const radiusKm = Math.min(Math.max(Number(opts?.radiusKm) || 3, 0.5), 20);
  const limit = Math.min(Math.max(Number(opts?.limit) || 8, 1), 20);
  const radiusM = Math.min(Math.round(radiusKm * 1000), 20_000);
  const areaCode = String(opts?.areaCode || '').trim();
  const sigunguCode = String(opts?.sigunguCode || '').trim();

  const runAreaFallback = async (reason) => {
    if (!/^\d{1,10}$/.test(areaCode)) {
      return { spots: [], error: reason || 'locationBasedList failed' };
    }
    console.warn(
      '[nearbyTourRestaurants] areaBasedList fallback:',
      reason || 'locationBasedList failed',
    );
    return fetchNearbyTourAreaBasedFallback({
      lat,
      lng,
      areaCode,
      sigunguCode: /^\d{1,10}$/.test(sigunguCode) ? sigunguCode : null,
      contentTypeId: RESTAURANT_CONTENT_TYPE_ID,
      radiusKm: Math.max(radiusKm, 8),
      limit,
      mapItem: mapRestaurantItem,
    });
  };

  try {
    const { data, error } = await withTourApiTimeout(
      supabase.functions.invoke('tourapi-proxy', {
        body: {
          action: 'locationBasedList',
          locale: getTourApiLocale(),
          mapX: lng,
          mapY: lat,
          radius: radiusM,
          contentTypeId: RESTAURANT_CONTENT_TYPE_ID,
          numOfRows: Math.min(Math.max(limit, 8), 20),
          pageNo: 1,
          arrange: 'E',
        },
      }),
      14_000,
      'tourapi:locationBasedList',
    );
    if (error) {
      console.warn('[nearbyTourRestaurants]', error.message || error);
      return runAreaFallback(error.message || String(error));
    }
    if (!data?.ok) {
      const msg = data?.message || data?.error || 'locationBasedList failed';
      console.warn('[nearbyTourRestaurants]', msg);
      if (isTourApiQuotaError(msg) || /^\d{1,10}$/.test(areaCode)) {
        return runAreaFallback(msg);
      }
      return { spots: [], error: msg };
    }

    const spots = [];
    const seen = new Set();
    for (const item of data.items || []) {
      const spot = mapRestaurantItem(item, lat, lng);
      if (!spot || seen.has(spot.contentId)) continue;
      seen.add(spot.contentId);
      spots.push(spot);
      if (spots.length >= limit) break;
    }
    spots.sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));
    return { spots, error: null };
  } catch (err) {
    console.warn('[nearbyTourRestaurants]', err?.message || err);
    return runAreaFallback(err?.message || String(err));
  }
}
