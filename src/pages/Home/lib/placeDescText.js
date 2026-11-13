import { isGateoPlaceIntroOverSsotEnabled } from '../../../shared/gateoFeatureFlags.js';
import {
  isPlaceIntroCuratedCopyProtected,
  isPlaceIntroLocked,
} from './placeIntroProtection.js';

/**
 * hub 「부모의 종류 · 명소명」 등 실문장 없는 합성 desc 여부.
 * 비어 있으면 true.
 */
export function isSyntheticOrEmptyPlaceDesc(location) {
  const desc = String(location?.desc || location?.description || '').trim();
  if (!desc) return true;

  const parent = String(location?.parentCity || '').trim();
  const name = String(location?.name || '').trim();
  const badge = String(location?.badge || location?.attractionKind || '').trim();
  const d = desc.replace(/\s+/g, ' ');

  if (parent && name) {
    if (d === `${parent} · ${name}` || d === `${name} · ${parent}`) return true;
    // attractionToPlacePin: `${hub.name}의 ${kindLabel} · ${attraction.name}`
    if (d.startsWith(`${parent}의 `) && d.includes(' · ') && d.endsWith(name)) {
      return true;
    }
  }
  if (name && badge && (d === `${name} · ${badge}` || d === `${badge} · ${name}`)) {
    return true;
  }
  if (parent && badge && d === `${parent} · ${badge}`) return true;

  // hubToPlacePin / hubToSuggestion 고정 문구
  if (name && /지역을 탐색합니다\.?\s*$/.test(d)) return true;
  if (name && d === `${name}의 명소·명물을 둘러보세요.`) return true;

  // EN hub/suggestion placeholders
  if (name && /(?:explore|discover)\s+(?:the\s+)?region/i.test(d)) return true;
  if (name && /browse\s+(?:attractions|highlights|local\s+specialties)/i.test(d)) return true;
  if (name && new RegExp(`^Explore\\s+${escapeRegExp(name)}`, 'i').test(d)) return true;

  return false;
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * location.desc를 place_chat_intro 본문으로 교체할지(써머리 카드·합성 hub).
 * SSOT·팔경 오버레이 실문장 desc는 유지 — 생성·저장과 분리.
 * VITE_GATEO_PLACE_INTRO_OVER_SSOT=1이면 SSOT 실문장도 교체(잠금·팔경·큐레이션 제외).
 */
export function needsPlaceChatIntroHydration(location) {
  if (!location?.name) return false;
  if (location.placeChatIntroApplied) return false;
  if (isPlaceIntroLocked(location)) return false;
  if (isPlaceIntroCuratedCopyProtected(location)) return false;
  if (isGateoPlaceIntroOverSsotEnabled()) return true;
  return isSyntheticOrEmptyPlaceDesc(location);
}

export { shouldEnsurePlaceChatIntroForLocation } from '../../../shared/place/placeChatIntroEligibility.js';

/**
 * flag ON 갤러리 overview — Home ensure·AI desc 무시, 읽기 전용 hydrate만.
 */
export function shouldUsePlaceGalleryReadonlyOverview(location) {
  if (!location?.name) return false;
  if (location.uiPlace && location.parentCity) return true;
  return isSyntheticOrEmptyPlaceDesc(location);
}
