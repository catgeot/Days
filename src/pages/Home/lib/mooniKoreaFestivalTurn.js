import { SIDO_ADDR_HINTS } from '../../Korea/koreaAreaFilter.js';
import {
  hasExplicitNonKoreaCountry,
  isDomesticKoreaLocation,
} from '../../../utils/tourApiMatch.js';

const FESTIVAL_INTENT_RE = /축제|페스티벌|festival/i;

const FESTIVAL_TIME_CUE_RE =
  /다다음\s*주말?|다음\s*주말?|이번\s*주말?|다다음\s*주|다음\s*주|내주|이번\s*주|주말/i;

const FESTIVAL_REQUEST_STRIP_RE =
  /축제|페스티벌|festival|알려\s*줘|알려줘|추천\s*해|추천해|추천|알려|있어|없어|뭐\s*있|뭐있|어떤|무엇|궁금|해\s*줘|해줘|좀|주세요|요/gi;

const FESTIVAL_TIME_STRIP_RE =
  /다다음\s*주말?|다음\s*주말?|이번\s*주말?|다다음\s*주|다음\s*주|내주|이번\s*주|주말|근처|주변|인근|쪽|부근|에서|으로|에\s*있는|있는/gi;

/** @type {string[]} */
let DOMESTIC_REGION_HINTS_CACHE = null;

function domesticRegionHintsLongestFirst() {
  if (DOMESTIC_REGION_HINTS_CACHE) return DOMESTIC_REGION_HINTS_CACHE;
  const set = new Set();
  for (const hints of Object.values(SIDO_ADDR_HINTS)) {
    for (const h of hints) {
      const word = String(h || '').trim();
      if (word.length >= 2) set.add(word);
    }
  }
  DOMESTIC_REGION_HINTS_CACHE = [...set].sort((a, b) => b.length - a.length);
  return DOMESTIC_REGION_HINTS_CACHE;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} userText
 * @returns {string}
 */
export function extractStatedDomesticRegionFromUserText(userText) {
  const text = String(userText || '');
  for (const hint of domesticRegionHintsLongestFirst()) {
    const escaped = escapeRegExp(hint);
    const re =
      hint.length <= 2
        ? new RegExp(`(?:^|[^가-힣])${escaped}(?:[^가-힣]|$)`, 'u')
        : new RegExp(escaped, 'u');
    if (re.test(text)) return hint;
  }
  return '';
}

/**
 * @param {string} userText
 */
export function hasMooniKoreaFestivalTimeCue(userText) {
  return FESTIVAL_TIME_CUE_RE.test(String(userText || ''));
}

/**
 * @param {string} userText
 */
export function isImplicitMooniKoreaFestivalQuery(userText) {
  const text = String(userText || '');
  if (!hasMooniKoreaFestivalTimeCue(text)) return false;
  return Boolean(extractStatedDomesticRegionFromUserText(text));
}

/**
 * @param {string} userText
 */
export function isMooniKoreaFestivalQueryText(userText) {
  const text = String(userText || '');
  return FESTIVAL_INTENT_RE.test(text) || isImplicitMooniKoreaFestivalQuery(text);
}

/**
 * @param {object | null | undefined} boundSpot
 * @param {string} [boundPlaceName]
 */
export function isOverseasMooniBoundSpot(boundSpot, boundPlaceName = '') {
  if (boundSpot && typeof boundSpot === 'object') {
    if (isDomesticKoreaLocation(boundSpot)) return false;
    if (hasExplicitNonKoreaCountry(boundSpot)) return true;
    const lat = Number(boundSpot.lat);
    const lng = Number(boundSpot.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return !isDomesticKoreaLocation({ lat, lng, country: boundSpot.country });
    }
  }
  const label = String(boundPlaceName || '').trim();
  if (!label || label === 'MOONi') return false;
  if (/[가-힣]/.test(label)) {
    return !extractStatedDomesticRegionFromUserText(label);
  }
  return true;
}

/**
 * @param {string} userText
 * @param {object | null | undefined} boundSpot
 * @param {string} [boundPlaceName]
 */
export function mooniKoreaFestivalQueryConflictsOverseasBound(
  userText,
  boundSpot,
  boundPlaceName = '',
) {
  if (!isMooniKoreaFestivalQueryText(userText)) return false;
  if (!isOverseasMooniBoundSpot(boundSpot, boundPlaceName)) return false;
  return Boolean(extractStatedDomesticRegionFromUserText(userText));
}

/**
 * @param {string} userText
 * @param {string} [boundPlaceName]
 * @param {object | null | undefined} [boundSpot]
 */
export function extractMooniFestivalLocationQueryText(
  userText,
  boundPlaceName = '',
  boundSpot = null,
) {
  let t = String(userText || '')
    .replace(FESTIVAL_INTENT_RE, ' ')
    .replace(FESTIVAL_TIME_STRIP_RE, ' ')
    .replace(FESTIVAL_REQUEST_STRIP_RE, ' ')
    .replace(/[?？!！.。,，]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const statedRegion = extractStatedDomesticRegionFromUserText(userText);
  const conflict = mooniKoreaFestivalQueryConflictsOverseasBound(
    userText,
    boundSpot,
    boundPlaceName,
  );

  if (statedRegion) return statedRegion;
  if (conflict) return '';

  const q = t.replace(/\s+/g, '');
  if (q.length >= 2) return t.trim();

  const bound = String(boundPlaceName || '').trim();
  if (bound && bound !== 'MOONi') return bound;
  return '';
}

/**
 * @param {string} userText
 * @param {string} [boundPlaceName]
 * @param {object | null | undefined} [boundSpot]
 */
export function resolveMooniFestivalBoundPlaceNameForHint(
  userText,
  boundPlaceName = '',
  boundSpot = null,
) {
  if (mooniKoreaFestivalQueryConflictsOverseasBound(userText, boundSpot, boundPlaceName)) {
    return extractMooniFestivalLocationQueryText(userText, '', null);
  }
  return boundPlaceName;
}

/**
 * @param {string} userText
 * @param {object | null | undefined} boundSpot
 * @param {string} [boundPlaceName]
 */
export function shouldOmitMooniGeminiHistoryForKoreaFestivalTurn(
  userText,
  boundSpot,
  boundPlaceName = '',
) {
  return mooniKoreaFestivalQueryConflictsOverseasBound(userText, boundSpot, boundPlaceName);
}
