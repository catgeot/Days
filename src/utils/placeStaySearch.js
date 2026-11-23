import { getPlaceStayBaseArea, getPlaceStayLodgingGuidance } from '../data/placeStayLodgingGuidance.js';
import { getLocalizedPlaceName } from '../components/PlaceCard/common/locationDisplay.js';
import { isMrtDomesticLocation, resolveMrtStayQuery } from './mrtStayQuery.js';

function isEnglishLang(lang) {
  return String(lang || '').toLowerCase().startsWith('en');
}

export function resolvePlannerStayDisplayName(location, lang) {
  const slug = String(location?.slug || '').trim().toLowerCase();
  const base = getPlaceStayBaseArea(slug);
  if (base) {
    return isEnglishLang(lang) ? base.en : base.ko;
  }
  const localized = getLocalizedPlaceName(location, lang);
  if (localized) return localized;
  return String(location?.name || location?.name_en || '').trim();
}

function overseasCountryTokens(location, queryMeta) {
  const tokens = [];
  const hint = String(queryMeta?.countryHint || '').trim();
  if (hint) tokens.push(hint);
  const country = String(location?.country || '').trim();
  if (country) tokens.push(country);
  const countryEn = String(location?.country_en || '').trim();
  if (countryEn) tokens.push(countryEn);
  const base = getPlaceStayBaseArea(String(location?.slug || '').trim().toLowerCase());
  if (base?.countryKo) tokens.push(base.countryKo);
  if (base?.countryEn) tokens.push(base.countryEn);
  return tokens;
}

function keywordIncludesCountry(keyword, tokens) {
  const kw = String(keyword || '');
  if (!kw) return false;
  const lower = kw.toLowerCase();
  for (const raw of tokens) {
    const t = String(raw || '').trim();
    if (t.length < 2) continue;
    if (kw.includes(t)) return true;
    if (lower.includes(t.toLowerCase())) return true;
  }
  return false;
}

/**
 * Planner·제휴 URL용 MRT 숙소 키워드 — resolveMrtStayQuery SSOT + 해외 나라명 보강.
 */
export function resolvePlannerMrtStayKeyword(location) {
  const q = resolveMrtStayQuery(location);
  let keyword = String(q.keyword || '').trim();
  if (!keyword) {
    keyword = String(location?.name || location?.name_ko || '').trim();
  }
  if (!keyword || isMrtDomesticLocation(location)) return keyword;

  const tokens = overseasCountryTokens(location, q);
  if (keywordIncludesCountry(keyword, tokens)) return keyword;

  const country =
    String(q.countryHint || '').trim() ||
    String(location?.country || '').trim() ||
    getPlaceStayBaseArea(String(location?.slug || '').trim().toLowerCase())?.countryKo ||
    '';
  if (country) return `${keyword} ${country}`.trim();
  return keyword;
}

export function buildPlannerMrtStayQuery(location, suffix) {
  const kw = resolvePlannerMrtStayKeyword(location);
  const suf = String(suffix || '').trim();
  return suf ? `${kw} ${suf}`.trim() : kw;
}

export function locationHasNoOnSiteLodging(slug) {
  return Boolean(getPlaceStayLodgingGuidance(slug));
}