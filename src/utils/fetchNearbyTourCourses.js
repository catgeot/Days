import { fetchTourApiTravelCourses } from './fetchTourApiCourses.js';
import { formatTourAttractionLocality } from '../pages/Home/lib/koreaTourAttractionLocality.js';
import { scenicRegionForAreaCode } from '../pages/Home/lib/koreaTourAttractionMap.js';

export const COURSE_CONTENT_TYPE_ID = '25';

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const cos = Math.cos((lat1 * Math.PI) / 180);
  const dy = (lat2 - lat1) * 111;
  const dx = (lng2 - lng1) * 111 * cos;
  return Math.sqrt(dy * dy + dx * dx);
}

/**
 * TourAPI areaBasedList(type25) 항목 → 주변 코스 spot.
 * locationBasedList는 type25가 축제장 근처에서 자주 0건이라 시도 목록+거리 정렬을 쓴다.
 *
 * @param {Record<string, unknown>} item
 * @param {number | null} originLat
 * @param {number | null} originLng
 * @param {string} areaCode
 */
function mapCourseItem(item, originLat, originLng, areaCode) {
  const contentId = String(item?.contentId || '').trim();
  const title = String(item?.title || '').trim();
  if (!contentId || !title) return null;
  const lat = Number(item?.mapy);
  const lng = Number(item?.mapx);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0);
  const addr1 = item?.addr1 != null ? String(item.addr1) : '';
  const addr2 = item?.addr2 != null ? String(item.addr2) : '';
  const addr = [addr1, addr2].filter(Boolean).join(' ').trim();
  const locality = formatTourAttractionLocality(addr1, addr2);
  const region = scenicRegionForAreaCode(areaCode) || '기타';
  let distKm = null;
  if (
    hasCoords &&
    Number.isFinite(originLat) &&
    Number.isFinite(originLng)
  ) {
    distKm = haversineKm(originLat, originLng, lat, lng);
  }
  return {
    id: contentId,
    name: title,
    title,
    blurb: addr || 'TourAPI 여행코스',
    region,
    locality,
    hubId: null,
    placeSlug: null,
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
    mapx: hasCoords ? lng : null,
    mapy: hasCoords ? lat : null,
    contentId,
    contentTypeId: COURSE_CONTENT_TYPE_ID,
    firstImage: toHttps(item?.imageUrl || item?.firstimage),
    imageUrl: toHttps(item?.imageUrl || item?.firstimage),
    areaCode,
    addr1: addr1 || null,
    distKm,
    source: 'api',
    _raw: item,
  };
}

/**
 * 축제장·명소 좌표·시도 기준 인근 여행코스(type25).
 * 전량 DB 없음 · areaBasedList 라이브(소량).
 *
 * @param {{
 *   lat?: number,
 *   lng?: number,
 *   areaCode: string | number,
 *   radiusKm?: number,
 *   limit?: number,
 * }} opts
 */
export async function fetchNearbyTourCourses(opts) {
  const areaCode = String(opts?.areaCode ?? '').trim();
  if (!areaCode || areaCode === 'all') {
    return { spots: [], error: 'areaCode required' };
  }
  const lat = Number(opts?.lat);
  const lng = Number(opts?.lng);
  const originLat = Number.isFinite(lat) ? lat : null;
  const originLng = Number.isFinite(lng) ? lng : null;
  const radiusKm = Math.min(Math.max(Number(opts?.radiusKm) || 80, 10), 200);
  const limit = Math.min(Math.max(Number(opts?.limit) || 6, 1), 12);

  try {
    const data = await fetchTourApiTravelCourses({
      areaCode,
      numOfRows: 30,
      pageNo: 1,
    });
    if (!data) {
      return { spots: [], error: 'areaBasedList failed' };
    }

    const spots = [];
    const seen = new Set();
    for (const item of data.items || []) {
      const spot = mapCourseItem(item, originLat, originLng, areaCode);
      if (!spot || seen.has(spot.contentId)) continue;
      seen.add(spot.contentId);
      spots.push(spot);
    }

    const near = spots
      .filter((s) => s.distKm != null && s.distKm <= radiusKm)
      .sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));
    const rest = spots
      .filter((s) => !(s.distKm != null && s.distKm <= radiusKm))
      .sort((a, b) => {
        if (a.distKm != null && b.distKm != null) return a.distKm - b.distKm;
        if (a.distKm != null) return -1;
        if (b.distKm != null) return 1;
        return String(a.name).localeCompare(String(b.name), 'ko');
      });

    const ranked = [...near, ...rest].slice(0, limit);
    return { spots: ranked, error: null };
  } catch (err) {
    console.warn('[nearbyTourCourses]', err?.message || err);
    return { spots: [], error: err?.message || String(err) };
  }
}
