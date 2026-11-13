import { formatUrlName } from './formatUrlName.js';
import { isPlaceIntroLockedSlug } from '../../../data/placeIntroLocked.js';
import { isSyntheticOrEmptyPlaceDesc } from './placeDescText.js';
import { lookupCuratedScenicSpot } from './koreaLocalScenicLists.js';

export function resolvePlaceIntroSlug(location) {
  const slug = String(location?.slug || location?.canonical_slug || '').trim().toLowerCase();
  if (slug) return slug;
  const nameEn = String(location?.name_en || '').trim();
  if (nameEn) return formatUrlName(nameEn).toLowerCase();
  const name = String(location?.name || '').trim();
  return name ? formatUrlName(name).toLowerCase() : '';
}

export function isPlaceIntroLocked(location) {
  return isPlaceIntroLockedSlug(resolvePlaceIntroSlug(location));
}

/** 팔경·큐레이션·검수 오버레이 — SSOT 실문장이라도 무니 표시 hydrate 제외(#357) */
export function isPlaceIntroCuratedCopyProtected(location) {
  if (!location || typeof location !== 'object') return false;
  if (String(location.curationSummary || '').trim()) return true;
  if (String(location.originalQuery || '').trim()) return true;
  if (location.localScenicListId) return true;
  if (location.source === 'localScenicList') return true;

  const desc = String(location.desc || location.description || '').trim();
  if (!desc || isSyntheticOrEmptyPlaceDesc({ ...location, desc })) return false;

  const hubId = String(location.hubId || location.parentCity || '').trim();
  const name = String(location.name || '').trim();
  if (hubId && name) {
    const curated = lookupCuratedScenicSpot(hubId, name);
    if (curated?.overview) {
      const overview = String(curated.overview).trim();
      if (overview && (desc === overview || desc.startsWith(overview.slice(0, Math.min(48, overview.length))))) {
        return true;
      }
    }
  }
  return false;
}
