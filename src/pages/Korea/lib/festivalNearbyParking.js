import { invokeTourApiProxy } from '../../../utils/tourApiProxy.js';

function clean(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parkingTextFromIntro(intro) {
  if (!intro || typeof intro !== 'object') return '';
  return clean(intro.parking || intro.parkingculture || intro.parkingfood || intro.parkingleports);
}

/**
 * Closest nearby sights' TourAPI parking field.
 * Lot names are not invented; an empty field stays off the list.
 * Name matches (the sight name sits inside the festival title or venue) are
 * preferred so a same-place lot is not dropped behind closer unrelated sights.
 * @param {Array<Record<string, unknown>>} spots
 * @param {number | { limit?: number, matchBlob?: string }} [options]
 */
export async function loadNearbyParkingFacts(spots, options = {}) {
  const opts = typeof options === 'number' ? { limit: options } : (options || {});
  const limit = Math.min(Math.max(Number(opts.limit) || 3, 1), 8);
  const blob = String(opts.matchBlob || '').replace(/\s+/g, '');
  const rows = (Array.isArray(spots) ? spots : [])
    .filter((spot) => /^\d+$/.test(String(spot?.contentId || spot?.id || '')))
    .slice()
    .sort((a, b) => (Number(a?.distKm) || 99) - (Number(b?.distKm) || 99));
  const matched = blob
    ? rows.filter((spot) => {
      const name = String(spot.name || spot.title || '').replace(/\s+/g, '');
      return name.length >= 2 && blob.includes(name);
    })
    : rows;
  const picked = matched.slice(0, limit);
  const facts = await Promise.all(picked.map(async (spot) => {
    const contentId = String(spot.contentId || spot.id);
    const data = await invokeTourApiProxy('detailIntro', {
      contentId,
      contentTypeId: String(spot.contentTypeId || '12'),
    }, { locale: 'ko' });
    const intro = data?.items?.[0] || null;
    const text = parkingTextFromIntro(intro);
    if (!text) return null;
    const distKm = Number(spot.distKm);
    return {
      name: String(spot.name || spot.title || '').trim(),
      text,
      addr1: clean(spot.addr1),
      distKm: Number.isFinite(distKm) ? distKm : null,
      contentId,
    };
  }));
  return facts.filter(Boolean);
}
