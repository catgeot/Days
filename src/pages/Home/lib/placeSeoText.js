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

const TAB_INTENT_KO = {
  gallery: ['여행', '갤러리', '사진', '여행 사진'],
  video: ['여행', '영상', '여행 영상'],
  planner: ['여행', '플래너', '여행 준비', '여행 가이드'],
  wiki: ['여행', '여행 스케치', '가이드'],
  reviews: ['여행', '후기', '리뷰'],
};

const TAB_INTENT_EN = {
  gallery: ['travel', 'photos', 'gallery', 'pictures'],
  video: ['travel', 'video', 'videos'],
  planner: ['travel', 'trip planner', 'plan a trip'],
  wiki: ['travel guide', 'travel sketch'],
  reviews: ['travel', 'reviews'],
};

/**
 * External search — tab-aware page title (before "| GATEO").
 * Matches queries like 「푸켓 여행」「푸켓 갤러리」「Phuket travel photos」.
 */
export function getPlaceTabSeoTitle(location, locale, tabKey) {
  const koName = getLocalizedPlaceName(location, 'ko') || location?.name || '';
  const enName = getLocalizedPlaceName(location, 'en') || location?.name_en || koName;

  if (locale === 'en') {
    switch (tabKey) {
      case 'gallery':
        return `${enName} travel photos · gallery`;
      case 'video':
        return `${enName} travel videos`;
      case 'planner':
        return `${enName} travel · trip planner`;
      case 'wiki':
        return `${enName} travel sketch · guide`;
      case 'reviews':
        return `${enName} travel reviews`;
      default:
        return `${enName} travel guide`;
    }
  }

  switch (tabKey) {
    case 'gallery':
      return `${koName} 여행 사진 · 갤러리`;
    case 'video':
      return `${koName} 여행 영상`;
    case 'planner':
      return `${koName} 여행 · 준비 가이드`;
    case 'wiki':
      return `${koName} 여행 스케치`;
    case 'reviews':
      return `${koName} 여행 후기`;
    default:
      return `${koName} 여행 가이드`;
  }
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
      return `${name} 여행 영상과 현장 Vlog. ${richDesc}`;
    }
    if (tabKey === 'planner') {
      return `${name} 여행 준비·항공·숙소·현지 팁. ${richDesc}`;
    }
    if (tabKey === 'reviews') {
      return `${name} 여행 후기와 평점. ${richDesc}`;
    }
    return richDesc;
  }

  return t(`place.tab.${tabKey}.desc`, { name });
}

export function getPlaceTabSeoKeywords(location, locale, tabKey) {
  const koName = getLocalizedPlaceName(location, 'ko') || location?.name || '';
  const enName = getLocalizedPlaceName(location, 'en') || location?.name_en || '';
  const base = getLocalizedPlaceKeywords(location, locale);
  const intents = locale === 'en' ? TAB_INTENT_EN[tabKey] || [] : TAB_INTENT_KO[tabKey] || [];
  const displayName = locale === 'en' ? enName : koName;

  const compound =
    locale === 'en'
      ? intents.map((w) => `${displayName} ${w}`).concat(intents)
      : intents.map((w) => `${displayName} ${w}`).concat(intents);

  return [...new Set([...base, ...compound, displayName, enName].filter(Boolean))];
}

export function getPlaceSeoKeywords(location, locale, tabKey = 'gallery') {
  return getPlaceTabSeoKeywords(location, locale, tabKey).join(', ');
}
