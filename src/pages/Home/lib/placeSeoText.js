import { isSyntheticOrEmptyPlaceDesc } from './placeDescText.js';
import { PLACE_SEO_EN_OVERRIDES } from '../../../data/placeSeoEnOverrides.js';
import {
  getPlaceSearchQuerySuffixes,
  getPlaceSearchTabDescLead,
  getPlaceSearchTabTitle,
} from '../../../data/placeSearchIntent.js';
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
 * External search — tab-aware page title (before "| GATEO").
 * Matches queries like 「푸켓 여행」「푸켓 갤러리」「Phuket travel photos」.
 */
export function getPlaceTabSeoTitle(location, locale, tabKey) {
  const koName = getLocalizedPlaceName(location, 'ko') || location?.name || '';
  const enName = getLocalizedPlaceName(location, 'en') || location?.name_en || koName;
  const localizedLocation = { ...location, name: koName, name_en: enName };
  return getPlaceSearchTabTitle(localizedLocation, locale, tabKey);
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
    const koName = getLocalizedPlaceName(location, 'ko') || location?.name || '';
    const enName = getLocalizedPlaceName(location, 'en') || location?.name_en || koName;
    const lead = getPlaceSearchTabDescLead(
      { ...location, name: koName, name_en: enName },
      locale,
      tabKey,
    );
    if (lead) {
      return `${lead} ${richDesc}`;
    }
    return richDesc;
  }

  return t(`place.tab.${tabKey}.desc`, { name });
}

export function getPlaceTabSeoKeywords(location, locale, tabKey) {
  const koName = getLocalizedPlaceName(location, 'ko') || location?.name || '';
  const enName = getLocalizedPlaceName(location, 'en') || location?.name_en || '';
  const base = getLocalizedPlaceKeywords(location, locale);
  const intents = getPlaceSearchQuerySuffixes(tabKey, locale);
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
