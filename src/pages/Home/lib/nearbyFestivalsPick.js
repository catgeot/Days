import { festivalLngLat } from '../../Korea/koreaFestivalCorridors.js';
import { detectSidoCode } from '../../Korea/festivalRegionTags.js';
import { scenicRegionForAreaCode } from './koreaTourAttractionMap.js';
import { formatTourAttractionLocality } from './koreaTourAttractionLocality.js';

function haversineKm(lat1, lng1, lat2, lng2) {
  const cos = Math.cos((lat1 * Math.PI) / 180);
  const dy = (lat2 - lat1) * 111;
  const dx = (lng2 - lng1) * 111 * cos;
  return Math.sqrt(dy * dy + dx * dx);
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

/**
 * 코스·명소 좌표 기준 인근 축제 후보 정렬 (캐시 목록 필터).
 *
 * @param {object[]} items
 * @param {{
 *   lat?: number,
 *   lng?: number,
 *   areaCode?: string | number,
 *   radiusKm?: number,
 *   limit?: number,
 *   excludeContentId?: string,
 * }} opts
 */
export function pickNearbyFestivals(items, opts = {}) {
  const list = Array.isArray(items) ? items : [];
  const lat = Number(opts.lat);
  const lng = Number(opts.lng);
  const originLat = Number.isFinite(lat) ? lat : null;
  const originLng = Number.isFinite(lng) ? lng : null;
  const areaCode = String(opts.areaCode ?? '').trim();
  const radiusKm = Math.min(Math.max(Number(opts.radiusKm) || 50, 5), 150);
  const limit = Math.min(Math.max(Number(opts.limit) || 6, 1), 12);
  const exclude = String(opts.excludeContentId || '').trim();

  /** @type {any[]} */
  const scored = [];
  for (const item of list) {
    const contentId = String(item?.contentId || '').trim();
    if (!contentId || (exclude && contentId === exclude)) continue;
    const title = String(item?.title || '').trim();
    if (!title) continue;

    const itemArea = String(
      item?.areaCode ?? item?.areacode ?? detectSidoCode(item?.addr1) ?? '',
    ).trim();
    if (areaCode && itemArea && itemArea !== areaCode) continue;

    const pt = festivalLngLat(item?.mapx, item?.mapy);
    let distKm = null;
    if (pt && originLat != null && originLng != null) {
      distKm = haversineKm(originLat, originLng, pt.lat, pt.lng);
    }

    const addr1 = item?.addr1 != null ? String(item.addr1) : '';
    scored.push({
      id: contentId,
      contentId,
      name: title,
      title,
      blurb: addr1 || '축제',
      region: scenicRegionForAreaCode(itemArea) || '',
      locality: formatTourAttractionLocality(addr1),
      areaCode: itemArea || areaCode || null,
      lat: pt?.lat ?? null,
      lng: pt?.lng ?? null,
      mapx: item?.mapx,
      mapy: item?.mapy,
      firstImage: toHttps(item?.firstimage || item?.imageUrl),
      eventStartDate: item?.eventStartDate || null,
      eventEndDate: item?.eventEndDate || null,
      distKm,
      item,
    });
  }

  const near = scored
    .filter((s) => s.distKm != null && s.distKm <= radiusKm)
    .sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));
  const rest = scored
    .filter((s) => !(s.distKm != null && s.distKm <= radiusKm))
    .sort((a, b) => {
      if (a.distKm != null && b.distKm != null) return a.distKm - b.distKm;
      if (a.distKm != null) return -1;
      if (b.distKm != null) return 1;
      return String(a.eventStartDate || '').localeCompare(
        String(b.eventStartDate || ''),
      );
    });

  return [...near, ...rest].slice(0, limit);
}
