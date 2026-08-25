import { isSyntheticOrEmptyPlaceDesc } from './placeDescText.js';
import { PLACE_SEO_EN_OVERRIDES } from '../../../data/placeSeoEnOverrides.js';
import { getLocalizedCountryName, getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay.js';

const HANGUL_REGEX = /[\u3131-\u318e\uac00-\ud7a3]/;

const CATEGORY_LABEL_EN = {
  paradise: 'beach and island getaway',
  culture: 'cultural heritage destination',
  urban: 'city travel guide',
  nature: 'nature and wildlife destination',
  adventure: 'adventure travel destination',
};

const CATEGORY_KEYWORDS_EN = {
  paradise: ['beach', 'island', 'resort', 'vacation'],
  culture: ['heritage', 'landmark', 'temple', 'history'],
  nature: ['wildlife', 'nature', 'national park', 'scenery'],
  urban: ['city guide', 'city break', 'sightseeing'],
  adventure: ['adventure', 'outdoors', 'hiking'],
};

function hasHangul(value) {
  return HANGUL_REGEX.test(String(value || ''));
}

function getCategory(location) {
  return location?.primaryCategory || location?.category || location?.categories?.[0] || '';
}

/**
 * Locale-aware place blurb for summary cards and rich snippets.
 */
export function getLocalizedPlaceDesc(location, locale = 'ko') {
  const slug = String(location?.slug || '').trim();
  const koDesc = String(location?.desc || location?.description || '').trim();

  if (locale !== 'en') {
    return koDesc;
  }

  const override = slug ? PLACE_SEO_EN_OVERRIDES[slug] : null;
  if (override?.desc_en) {
    return override.desc_en.trim();
  }

  if (koDesc && !hasHangul(koDesc)) {
    return koDesc;
  }

  const name = getLocalizedPlaceName(location, 'en') || location?.name_en || location?.name || 'this destination';
  const country = getLocalizedCountryName(location, 'en');
  const category = getCategory(location);
  const categoryLabel = CATEGORY_LABEL_EN[category] || 'travel destination';

  return `Discover ${name}${country ? `, ${country}` : ''} — a ${categoryLabel} with photos, videos, and trip planning on GATEO.`;
}

export function getLocalizedPlaceKeywords(location, locale = 'ko') {
  const slug = String(location?.slug || '').trim();
  const koKeywords = Array.isArray(location?.keywords) ? location.keywords.filter(Boolean) : [];

  if (locale !== 'en') {
    return koKeywords;
  }

  const override = slug ? PLACE_SEO_EN_OVERRIDES[slug] : null;
  if (override?.keywords_en?.length) {
    return override.keywords_en;
  }

  const name = getLocalizedPlaceName(location, 'en') || location?.name_en || '';
  const country = getLocalizedCountryName(location, 'en') || '';
  const category = getCategory(location);
  const categoryKeywords = CATEGORY_KEYWORDS_EN[category] || ['travel'];

  return [name, country, `${name} travel`, ...categoryKeywords, 'GATEO'].filter(Boolean);
}

/**
 * Tab-aware meta description — photo/video queries get search-friendly lead-ins.
 */
export function getPlaceTabSeoDescription(location, locale, tabKey, t) {
  const name = getLocalizedPlaceName(location, locale) || t('place.fallback.destination');
  const richDesc = getLocalizedPlaceDesc(location, locale);
  const hasRichDesc =
    Boolean(richDesc) && !isSyntheticOrEmptyPlaceDesc({ ...location, desc: richDesc });

  if (hasRichDesc) {
    if (locale === 'en') {
      if (tabKey === 'gallery') {
        return `Browse ${name} travel photos and gallery images. ${richDesc}`;
      }
      if (tabKey === 'video') {
        return `Watch ${name} travel videos and on-the-ground footage. ${richDesc}`;
      }
      if (tabKey === 'planner') {
        return `Plan a trip to ${name} — flights, stays, and local tips. ${richDesc}`;
      }
      if (tabKey === 'reviews') {
        return `Read traveler reviews for ${name}. ${richDesc}`;
      }
      return richDesc;
    }

    if (tabKey === 'gallery') {
      return `${name} 여행 사진과 갤러리. ${richDesc}`;
    }
    if (tabKey === 'video') {
      return `${name} 여행 영상. ${richDesc}`;
    }
    return richDesc;
  }

  return t(`place.tab.${tabKey}.desc`, { name });
}

export function getPlaceSeoKeywords(location, locale) {
  return getLocalizedPlaceKeywords(location, locale).join(', ');
}
