import { i18n } from '../../../i18n/config.js';
import { normalizeAppLocale } from '../../../i18n/constants.js';
import { getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay.js';
import { normalizeDestinationKey } from './mooniPlaceChatLabel.js';
import { settlementIntroUsesParentCityKeyOnly } from './settlementIntroParentOnly.js';

const INVALID_DESTINATIONS = new Set(['', 'new session', 'scanning...', 'mooni']);
const INTRO_LOCALE_SUFFIX = { en: '@en' };

function introLocaleKey(lng = i18n.language) {
  const locale = normalizeAppLocale(lng?.slice?.(0, 2) ?? lng);
  return INTRO_LOCALE_SUFFIX[locale] ?? '';
}

function withPlaceChatIntroLocale(destinationKey, lng = i18n.language) {
  const base = normalizeDestinationKey(destinationKey);
  const suffix = introLocaleKey(lng);
  return suffix && base ? `${base}${suffix}` : base;
}

function resolveIntroLocale(lng = i18n.language) {
  return normalizeAppLocale(lng?.slice?.(0, 2) ?? lng);
}

function isValidIntroDestination(key) {
  const lower = key.trim().toLowerCase();
  return key.length > 0 && !INVALID_DESTINATIONS.has(lower);
}

/** ko·en storage destination_key for one logical intro key */
export function introLocaleStorageKeys(logicalKey) {
  const base = normalizeDestinationKey(logicalKey);
  if (!base) return [];
  const ko = withPlaceChatIntroLocale(base, 'ko');
  const en = withPlaceChatIntroLocale(base, 'en');
  return [...new Set([ko, en])];
}

/** @param {string} destinationKey @param {string} bareName */
export function destinationKeyMatchesBareName(destinationKey, bareName) {
  const b = normalizeDestinationKey(bareName);
  const k = String(destinationKey || '')
    .replace(/@en$/u, '')
    .trim();
  if (!b || !k) return false;
  return k === b || k.endsWith(` ${b}`);
}

/**
 * Distinct logical keys (locale suffix stripped) that share a bare place name.
 * @param {{ destination_key?: string }[]} rows
 * @param {string} bareName
 */
export function distinctIntroLogicalKeysForBareName(rows, bareName) {
  const keys = new Set();
  for (const row of rows ?? []) {
    const storage = String(row.destination_key || '').trim();
    if (!destinationKeyMatchesBareName(storage, bareName)) continue;
    keys.add(storage.replace(/@en$/u, '').trim());
  }
  return keys;
}

/** @param {{ destination_key?: string }[]} rows @param {string} bareName */
export function isBareIntroNameUnambiguous(rows, bareName) {
  return distinctIntroLogicalKeysForBareName(rows, bareName).size === 1;
}

/** SETTLEMENT_INTRO_PARENT_ONLY_IDS — bare·country 폴백 금지. */
export function shouldSkipBareIntroFallbackForLocation(locOrName) {
  return settlementIntroUsesParentCityKeyOnly(locOrName);
}

/**
 * When parentCity-qualified keys miss, try bare name and country+name (not in primary key list).
 * @param {object} locOrName
 * @param {string} [lng]
 * @returns {string[]}
 */
export function buildPlaceChatIntroBareFallbackKeys(locOrName, lng = i18n.language) {
  if (!locOrName || typeof locOrName !== 'object') return [];
  const parentCity = normalizeDestinationKey(locOrName.parentCity || '');
  if (!parentCity) return [];

  const locale = resolveIntroLocale(lng);
  const name = normalizeDestinationKey(
    getLocalizedPlaceName(locOrName, locale) || locOrName.displayLabel || locOrName.name || '',
  );
  if (!name || name.includes(parentCity)) return [];
  if (shouldSkipBareIntroFallbackForLocation(locOrName)) return [];

  const keys = [];
  const push = (k) => {
    const n = normalizeDestinationKey(k);
    if (!isValidIntroDestination(n)) return;
    if (!keys.includes(n)) keys.push(n);
  };

  push(name);
  return keys;
}

/**
 * Pick summary from rows when bare name is unambiguous (ko then en).
 * @param {{ destination_key?: string, summary?: string }[]} rows
 * @param {string} bareName
 * @param {string} [lng]
 * @returns {{ logicalKey: string, summary: string, lngUsed: string } | null}
 */
export function pickBareFallbackIntroFromRows(rows, bareName, lng = i18n.language) {
  if (!isBareIntroNameUnambiguous(rows, bareName)) return null;
  const logicalKey = [...distinctIntroLogicalKeysForBareName(rows, bareName)][0];
  if (!logicalKey) return null;

  const localeOrder = [
    resolveIntroLocale(lng),
    'ko',
    'en',
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  for (const loc of localeOrder) {
    const storageKey = withPlaceChatIntroLocale(logicalKey, loc);
    const row = (rows ?? []).find((r) => r.destination_key === storageKey);
    const summary = String(row?.summary ?? '').trim();
    if (summary) return { logicalKey, summary, lngUsed: loc };
  }
  return null;
}
