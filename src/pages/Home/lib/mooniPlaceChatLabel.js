import { isPlaceholderCountry } from '../../../utils/travelSpotResolve.js';
import { i18n } from '../../../i18n/config.js';
import { normalizeAppLocale } from '../../../i18n/constants.js';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../../../components/PlaceCard/common/locationDisplay.js';
import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { resolveCatalogPlaceSlug } from './formatUrlName.js';
import { festivalChatHeaderTitle } from '../../Korea/lib/festivalMooniContext.js';

export function normalizeDestinationKey(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function resolveIntroLocale(lng = i18n.language) {
  return normalizeAppLocale(lng?.slice?.(0, 2) ?? lng);
}

/** MOONi 칩·헤더 — slug 카탈로그 lookup 후 locale 표시명 */
export function localizeMooniPlaceLabel(place, lng = i18n.language) {
  if (!place) return '';
  const locale = resolveIntroLocale(lng);
  if (place.festivalContext) {
    if (locale === 'en') {
      const english = festivalChatHeaderTitle(place.festivalContext, 'en');
      if (english) return english;
    }
    const explicit = normalizeDestinationKey(
      place.displayLabel || place.festivalContext.title || '',
    );
    if (explicit) return explicit;
  }
  const catalogSlug = place.slug ? resolveCatalogPlaceSlug(place.slug) : null;
  if (catalogSlug) {
    const spot = TRAVEL_SPOTS.find((s) => s.slug === catalogSlug);
    if (spot) {
      const label = formatPlaceChatLabel(spot, locale);
      if (label) return label;
    }
  }
  return formatPlaceChatLabel(place, locale) || String(place.name || '').trim();
}

export function formatPlaceChatLabel(loc, lng = i18n.language) {
  if (!loc || typeof loc !== 'object') {
    return normalizeDestinationKey(loc);
  }
  const locale = resolveIntroLocale(lng);
  const name = normalizeDestinationKey(
    getLocalizedPlaceName(loc, locale) || loc.displayLabel || loc.name || '',
  );
  if (!name) return '';
  const country = normalizeDestinationKey(getLocalizedCountryName(loc, locale) || loc.country || '');
  if (!country || isPlaceholderCountry(country)) return name;
  if (name.includes(country) || country.includes(name)) return name;
  return `${country} ${name}`;
}

/**
 * Festival destination chip: English UI uses the English festival name.
 * @param {{ name?: string } | null | undefined} confirmed
 * @param {Record<string, unknown> | null | undefined} festivalContext
 * @param {string} [locale]
 */
export function festivalResolutionLabel(confirmed, festivalContext, locale = 'ko') {
  const name = normalizeDestinationKey(confirmed?.name || '');
  if (!name || !festivalContext) return name;
  const title = normalizeDestinationKey(festivalContext.title || '');
  const hub = normalizeDestinationKey(festivalContext.hubLabel || '');
  const display = [title, hub].filter(Boolean).join(' · ');
  if (name !== title && name !== display) return name;
  return festivalChatHeaderTitle(festivalContext, locale) || name;
}

/** 장소카드 → 무니 boundSpot 시드 (SSOT slug 없어도 국가·지명 유지) */
export function buildMooniBoundSpotFromLocation(loc) {
  if (!loc?.name) return null;
  const displayLabel = loc.festivalContext
    ? normalizeDestinationKey(loc.displayLabel || '') || formatPlaceChatLabel(loc)
    : formatPlaceChatLabel(loc);
  const rawSlug = typeof loc.slug === 'string' ? loc.slug.trim() : '';
  return {
    slug: rawSlug || null,
    name: String(loc.name).trim(),
    displayLabel,
    name_en: loc.name_en ?? null,
    country: isPlaceholderCountry(loc.country) ? null : (loc.country ?? null),
    country_en: isPlaceholderCountry(loc.country_en) ? null : (loc.country_en ?? null),
    lat: Number.isFinite(Number(loc.lat)) ? Number(loc.lat) : null,
    lng: Number.isFinite(Number(loc.lng)) ? Number(loc.lng) : null,
    uiPlace: Boolean(loc.uiPlace),
    festivalContext: loc.festivalContext ?? null,
    eventContext: loc.eventContext ?? null,
  };
}
