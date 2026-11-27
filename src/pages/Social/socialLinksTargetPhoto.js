import {
  getVisibleKoreaScenicSpotByPlaceSlug,
  resolveKoreaScenicGalleryUrlsForPlace,
} from '../Home/lib/placeScenicGateway.js';
import {
  fetchKoreaTourAttractionFirstImagesByIds,
  peekKoreaTourAttractionFirstImagesByIds,
  resolveKoreaTourContentId,
} from '../Home/lib/koreaTourAttractions.js';
import { fetchTourApiFirstImage } from '../../utils/fetchTourApiAttractionDetail.js';
import { fetchTourApiFestivalDetail } from '../../utils/fetchTourApiFestivals.js';
import { festivalItemFromDetail } from '../Korea/festivalDeepLinkItem.js';
import { getManualFestivalEntry } from '../Korea/manualFestivalEntries.js';
import { readFestivalOpenDetail } from '../Korea/lib/festivalOpenDetailCache.js';

function pickHttps(url) {
  const text = String(url ?? '').trim();
  if (!text) return '';
  if (text.startsWith('//')) return `https:${text}`;
  if (text.startsWith('http://')) return `https://${text.slice('http://'.length)}`;
  return text;
}

export function socialPhotoCreditFor(imageUrl, explicit) {
  const text = String(explicit || '').trim();
  if (text) return { kind: 'text', label: text };
  if (/visitkorea\.or\.kr/i.test(String(imageUrl || ''))) {
    return { kind: 'kto', label: '한국관광공사' };
  }
  return null;
}

/** @param {string | null | undefined} slug */
export function tourContentIdFromPlaceSlug(slug) {
  const match = String(slug || '').trim().toLowerCase().match(/^tour-(\d{1,32})$/);
  return match ? resolveKoreaTourContentId(match[1]) : '';
}

/**
 * Same ordering as place-card gallery hero: scenic SSOT gallery first, then tour peek cache.
 * @param {{ type: 'place', slug: string }} target
 */
export function syncSocialPlaceTargetPhotoUrl(target) {
  const slug = String(target?.slug || '').trim().toLowerCase();
  if (!slug) return '';
  const contentId = tourContentIdFromPlaceSlug(slug);
  const scenicUrls = resolveKoreaScenicGalleryUrlsForPlace({
    slug,
    contentId: contentId || undefined,
    country: '대한민국',
  });
  if (scenicUrls[0]) return pickHttps(scenicUrls[0]);
  if (contentId) {
    const peeked = peekKoreaTourAttractionFirstImagesByIds([contentId]);
    const cached = peeked.get(contentId);
    if (cached) return pickHttps(cached);
  }
  const spot = getVisibleKoreaScenicSpotByPlaceSlug(slug);
  if (spot?.imageUrl) return pickHttps(spot.imageUrl);
  return '';
}

/**
 * Manual SSOT, then festival open-detail session cache (sheet hero fields).
 * @param {{ type: 'festival', id: string }} target
 */
export function syncSocialFestivalTargetPhotoUrl(target) {
  const id = String(target?.id || '').trim();
  if (!id) return '';
  const manual = getManualFestivalEntry(id);
  const manualUrl = manual?.images?.[0]?.url;
  if (manualUrl) return pickHttps(manualUrl);
  const cached = readFestivalOpenDetail(id);
  const item = cached ? festivalItemFromDetail(cached) : null;
  if (item?.firstimage) return pickHttps(item.firstimage);
  if (item?.imageUrl) return pickHttps(item.imageUrl);
  return '';
}

/** @param {{ type: string, slug?: string, id?: string }} target */
export function syncSocialTargetPhotoUrl(target) {
  if (!target) return '';
  if (target.type === 'festival') return syncSocialFestivalTargetPhotoUrl(target);
  if (target.type === 'place') return syncSocialPlaceTargetPhotoUrl(target);
  return '';
}

const defaultDeps = {
  fetchKoreaTourAttractionFirstImagesByIds,
  fetchTourApiFirstImage,
  fetchTourApiFestivalDetail,
  festivalItemFromDetail,
};

/**
 * @param {{ type: string, slug?: string, id?: string }} target
 * @param {typeof defaultDeps} [deps]
 */
export async function fetchSocialTargetPhotoUrl(target, deps = defaultDeps) {
  const sync = syncSocialTargetPhotoUrl(target);
  if (sync) return sync;
  if (!target) return '';

  if (target.type === 'place') {
    const contentId = tourContentIdFromPlaceSlug(target.slug);
    if (!contentId) return '';
    try {
      const dbMap = await deps.fetchKoreaTourAttractionFirstImagesByIds([contentId]);
      const dbUrl = dbMap.get(contentId);
      if (dbUrl) return pickHttps(dbUrl);
    } catch {
      /* read-only miss */
    }
    try {
      const live = await deps.fetchTourApiFirstImage(contentId);
      return pickHttps(live);
    } catch {
      return '';
    }
  }

  if (target.type === 'festival') {
    const id = String(target.id || '').trim();
    if (!id) return '';
    try {
      const detail = await deps.fetchTourApiFestivalDetail({ contentId: id });
      const item = deps.festivalItemFromDetail(detail);
      const festUrl = item?.firstimage || item?.imageUrl;
      if (festUrl) return pickHttps(festUrl);
    } catch {
      /* fall through */
    }
    try {
      const live = await deps.fetchTourApiFirstImage(id);
      return pickHttps(live);
    } catch {
      return '';
    }
  }

  return '';
}

/**
 * @param {{ photoUrl?: string | null, targets?: object[] }} card
 */
export function resolveSocialCardPhotoUrl(card) {
  const committed = pickHttps(card?.photoUrl);
  if (committed) return committed;
  const target = card?.targets?.[0];
  return syncSocialTargetPhotoUrl(target);
}