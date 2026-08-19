import { supabase } from '../shared/api/supabase';
import { formatTourAttractionLocality } from '../pages/Home/lib/koreaTourAttractionLocality';
import { scenicRegionForAreaCode } from '../pages/Home/lib/koreaTourAttractionMap';
import {
  fetchNearbyTourAreaBasedFallback,
  isTourApiQuotaError,
} from './nearbyTourAreaFallback';
import { NEARBY_TOUR_API_LOCALE, withTourApiTimeout } from './tourApiProxy';

export const LEPORTS_CONTENT_TYPE_ID = '28';
export const CULTURE_CONTENT_TYPE_ID = '14';

const TYPE_META = {
  [LEPORTS_CONTENT_TYPE_ID]: {
    label: '레포츠',
    blurb: 'TourAPI 레포츠',
  },
  [CULTURE_CONTENT_TYPE_ID]: {
    label: '문화',
    blurb: 'TourAPI 문화시설',
  },
};

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, label) {
  return withTourApiTimeout(promise, ms, label);
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

/**
 * @param {Record<string, unknown>} item
 * @param {number} originLat
 * @param {number} originLng
 * @param {string} contentTypeId
 */
function mapNearbyItem(item, originLat, originLng, contentTypeId) {
  const contentId = String(item?.contentId || '').trim();
  const title = String(item?.title || '').trim();
  if (!contentId || !title) return null;
  const typeId = String(item?.contentTypeId || contentTypeId).trim() || contentTypeId;
  const meta = TYPE_META[typeId] || TYPE_META[contentTypeId];
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
    blurb: addr || meta?.blurb || 'TourAPI',
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
    contentTypeId: typeId,
    firstImage: toHttps(item?.imageUrl || item?.firstimage),
    areaCode,
    tel: item?.tel != null ? String(item.tel) : null,
    distKm,
    source: 'api',
  };
}

/**
 * 축제장·명소 좌표 기준 주변 레포츠(28)·문화(14) — LIVE locationBasedList (전량 DB 금지).
 * locationBasedList 한도(429) 실패 시 areaCode(+sigungu) areaBasedList 폴백.
 *
 * @param {{
 *   lat: number,
 *   lng: number,
 *   contentTypeId: string,
 *   radiusKm?: number,
 *   limit?: number,
 *   areaCode?: string | null,
 *   sigunguCode?: string | null,
 * }} opts
 */
export async function fetchNearbyTourByContentType(opts) {
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  const contentTypeId = String(opts?.contentTypeId || '').trim();
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { spots: [], error: 'lat/lng required' };
  }
  if (
    contentTypeId !== LEPORTS_CONTENT_TYPE_ID &&
    contentTypeId !== CULTURE_CONTENT_TYPE_ID
  ) {
    return { spots: [], error: 'unsupported contentTypeId' };
  }
  const radiusKm = Math.min(Math.max(Number(opts?.radiusKm) || 5, 0.5), 20);
  const limit = Math.min(Math.max(Number(opts?.limit) || 6, 1), 20);
  const radiusM = Math.min(Math.round(radiusKm * 1000), 20_000);
  const meta = TYPE_META[contentTypeId];
  const areaCode = String(opts?.areaCode || '').trim();
  const sigunguCode = String(opts?.sigunguCode || '').trim();

  const runAreaFallback = async (reason) => {
    if (!/^\d{1,10}$/.test(areaCode)) {
      return { spots: [], error: reason || 'locationBasedList failed' };
    }
    console.warn(
      `[nearbyTour${meta.label}] areaBasedList fallback:`,
      reason || 'locationBasedList failed',
    );
    return fetchNearbyTourAreaBasedFallback({
      lat,
      lng,
      areaCode,
      sigunguCode: /^\d{1,10}$/.test(sigunguCode) ? sigunguCode : null,
      contentTypeId,
      radiusKm: Math.max(radiusKm, 10),
      limit,
      mapItem: (item, oLat, oLng) =>
        mapNearbyItem(item, oLat, oLng, contentTypeId),
    });
  };

  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('tourapi-proxy', {
        body: {
          action: 'locationBasedList',
          locale: NEARBY_TOUR_API_LOCALE,
          mapX: lng,
          mapY: lat,
          radius: radiusM,
          contentTypeId,
          numOfRows: Math.min(Math.max(limit, 8), 20),
          pageNo: 1,
          arrange: 'E',
        },
      }),
      14_000,
      `tourapi:locationBasedList:${meta.label}`,
    );
    if (error) {
      console.warn(`[nearbyTour${meta.label}]`, error.message || error);
      return runAreaFallback(error.message || String(error));
    }
    if (!data?.ok) {
      const msg = data?.message || data?.error || 'locationBasedList failed';
      console.warn(`[nearbyTour${meta.label}]`, msg);
      if (isTourApiQuotaError(msg) || /^\d{1,10}$/.test(areaCode)) {
        return runAreaFallback(msg);
      }
      return { spots: [], error: msg };
    }

    const spots = [];
    const seen = new Set();
    for (const item of data.items || []) {
      const spot = mapNearbyItem(item, lat, lng, contentTypeId);
      if (!spot || seen.has(spot.contentId)) continue;
      seen.add(spot.contentId);
      spots.push(spot);
      if (spots.length >= limit) break;
    }
    spots.sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));
    return { spots, error: null };
  } catch (err) {
    console.warn(`[nearbyTour${meta.label}]`, err?.message || err);
    return runAreaFallback(err?.message || String(err));
  }
}

/** @param {{ lat: number, lng: number, radiusKm?: number, limit?: number }} opts */
export function fetchNearbyTourLeports(opts) {
  return fetchNearbyTourByContentType({
    ...opts,
    contentTypeId: LEPORTS_CONTENT_TYPE_ID,
  });
}

/** @param {{ lat: number, lng: number, radiusKm?: number, limit?: number }} opts */
export function fetchNearbyTourCulture(opts) {
  return fetchNearbyTourByContentType({
    ...opts,
    contentTypeId: CULTURE_CONTENT_TYPE_ID,
  });
}
