/**
 * Nominatim 역지오코딩은 해외 영토에서 country=宗主国(France 등)만 반환하는 경우가 많음.
 * ISO3166-2-lvl3·state 필드로 여행 표기용 country/country_en을 복원한다.
 */

/** @type {Record<string, { ko: string, en: string }>} */
const ISO3166_TRAVEL_COUNTRY = {
  'FR-PF': { ko: '프랑스령 폴리네시아', en: 'French Polynesia' },
  'FR-NC': { ko: '누벨칼레도니', en: 'New Caledonia' },
  'FR-GP': { ko: '과들루프', en: 'Guadeloupe' },
  'FR-MQ': { ko: '마르티니크', en: 'Martinique' },
  'FR-RE': { ko: '레위니옹', en: 'La Réunion' },
  'FR-YT': { ko: '마요트', en: 'Mayotte' },
  'FR-BL': { ko: '생바르텔레미', en: 'Saint Barthélemy' },
  'FR-MF': { ko: '생마르탱', en: 'Saint Martin' },
  'FR-PM': { ko: '생피에르 미클롱', en: 'Saint Pierre and Miquelon' },
  'FR-WF': { ko: '왈리스 푸투나', en: 'Wallis and Futuna' },
  'US-HI': { ko: '하와이', en: 'Hawaii' },
  'US-PR': { ko: '푸에르토리코', en: 'Puerto Rico' },
  'US-GU': { ko: '괌', en: 'Guam' },
  'US-VI': { ko: '미국령 버진아일랜드', en: 'U.S. Virgin Islands' },
  'US-AS': { ko: '아메리칸사모아', en: 'American Samoa' },
  'US-MP': { ko: '북마리아나 제도', en: 'Northern Mariana Islands' },
  'GB-GIB': { ko: '지브롤터', en: 'Gibraltar' },
  'DK-GL': { ko: '그린란드', en: 'Greenland' },
  'NL-AW': { ko: '아루바', en: 'Aruba' },
  'NL-CW': { ko: '퀴라소', en: 'Curaçao' },
};

/** state/region 표기 변형 → 여행 country */
/** @type {Record<string, { ko: string, en: string }>} */
const STATE_TRAVEL_COUNTRY = {
  'French Polynesia': { ko: '프랑스령 폴리네시아', en: 'French Polynesia' },
  'Polynésie française': { ko: '프랑스령 폴리네시아', en: 'French Polynesia' },
  '프랑스령 폴리네시아': { ko: '프랑스령 폴리네시아', en: 'French Polynesia' },
  'New Caledonia': { ko: '누벨칼레도니', en: 'New Caledonia' },
  'Nouvelle-Calédonie': { ko: '누벨칼레도니', en: 'New Caledonia' },
  'Hawaii': { ko: '하와이', en: 'Hawaii' },
  'Hawaiʻi': { ko: '하와이', en: 'Hawaii' },
  '하와이': { ko: '하와이', en: 'Hawaii' },
  'Greenland': { ko: '그린란드', en: 'Greenland' },
  'Kalaallit Nunaat': { ko: '그린란드', en: 'Greenland' },
  'Cook Islands': { ko: '쿡 제도', en: 'Cook Islands' },
  'Faroe Islands': { ko: '페로 제도', en: 'Faroe Islands' },
  'Puerto Rico': { ko: '푸에르토리코', en: 'Puerto Rico' },
  '푸에르토리코': { ko: '푸에르토리코', en: 'Puerto Rico' },
  'Guam': { ko: '괌', en: 'Guam' },
  '괌': { ko: '괌', en: 'Guam' },
  'United States Virgin Islands': { ko: '미국령 버진아일랜드', en: 'U.S. Virgin Islands' },
  'U.S. Virgin Islands': { ko: '미국령 버진아일랜드', en: 'U.S. Virgin Islands' },
  'American Samoa': { ko: '아메리칸사모아', en: 'American Samoa' },
  'Northern Mariana Islands': { ko: '북마리아나 제도', en: 'Northern Mariana Islands' },
  'Commonwealth of the Northern Mariana Islands': { ko: '북마리아나 제도', en: 'Northern Mariana Islands' },
  '북마리아나 제도': { ko: '북마리아나 제도', en: 'Northern Mariana Islands' },
  'Marshall Islands': { ko: '마셜 제도', en: 'Marshall Islands' },
  '마셜 제도': { ko: '마셜 제도', en: 'Marshall Islands' },
  '마샬 군도': { ko: '마셜 제도', en: 'Marshall Islands' },
  'Pitcairn Islands': { ko: '핏케언 제도', en: 'Pitcairn Islands' },
  'Pitcairn, Henderson, Ducie and Oeno Islands': { ko: '핏케언 제도', en: 'Pitcairn Islands' },
  '핏케언 제도': { ko: '핏케언 제도', en: 'Pitcairn Islands' },
  'Midway Atoll': { ko: '미드웨이 환초', en: 'Midway Atoll' },
  'United States Minor Outlying Islands': { ko: '미국령 군소 제도', en: 'U.S. Minor Outlying Islands' },
};

/** ISO 3166-1 alpha-2 (country_code) — 독립국·영토 */
/** @type {Record<string, { ko: string, en: string }>} */
const ISO3166_1_TRAVEL_COUNTRY = {
  mh: { ko: '마셜 제도', en: 'Marshall Islands' },
  pn: { ko: '핏케언 제도', en: 'Pitcairn Islands' },
  pf: { ko: '프랑스령 폴리네시아', en: 'French Polynesia' },
  gu: { ko: '괌', en: 'Guam' },
};

const GENERIC_SOVEREIGN_COUNTRIES = new Set([
  '',
  'explore',
  'global',
  '미국',
  'usa',
  'u.s.',
  'u.s.a.',
  'united states',
  '영국',
  'uk',
  'u.k.',
  'united kingdom',
  'great britain',
  '프랑스',
  'france',
]);

function normalizeCountryKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isGenericSovereignCountry(country, countryEn) {
  return (
    GENERIC_SOVEREIGN_COUNTRIES.has(normalizeCountryKey(country)) ||
    GENERIC_SOVEREIGN_COUNTRIES.has(normalizeCountryKey(countryEn))
  );
}

function hasSpecificTravelCountry(country, countryEn) {
  const ko = String(country ?? '').trim();
  const en = String(countryEn ?? '').trim();
  if (!ko && !en) return false;
  return !isGenericSovereignCountry(ko, en);
}

function lookupStateRegion(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return STATE_TRAVEL_COUNTRY[trimmed] || null;
}

/**
 * @param {Record<string, string>|null|undefined} addressEn
 * @param {Record<string, string>|null|undefined} addressKo
 * @returns {{ country: string, country_en: string }}
 */
export function resolveTravelCountryFromAddresses(addressEn, addressKo) {
  const iso =
    addressEn?.['ISO3166-2-lvl3'] ||
    addressKo?.['ISO3166-2-lvl3'] ||
    addressEn?.['ISO3166-2-lvl4'] ||
    addressKo?.['ISO3166-2-lvl4'];
  if (iso && ISO3166_TRAVEL_COUNTRY[iso]) {
    const hit = ISO3166_TRAVEL_COUNTRY[iso];
    return { country: hit.ko, country_en: hit.en };
  }

  const countryCode = String(addressEn?.country_code || addressKo?.country_code || '')
    .trim()
    .toLowerCase();
  if (countryCode && ISO3166_1_TRAVEL_COUNTRY[countryCode]) {
    const hit = ISO3166_1_TRAVEL_COUNTRY[countryCode];
    return { country: hit.ko, country_en: hit.en };
  }

  for (const field of [
    addressEn?.state,
    addressKo?.state,
    addressEn?.region,
    addressKo?.region,
    addressEn?.country,
    addressKo?.country,
  ]) {
    const hit = lookupStateRegion(field);
    if (hit) return { country: hit.ko, country_en: hit.en };
  }

  const sovereignEn = String(addressEn?.country || addressKo?.country || '').trim();
  const sovereignKo = String(addressKo?.country || addressEn?.country || '').trim();

  return {
    country: sovereignKo || sovereignEn,
    country_en: sovereignEn || sovereignKo,
  };
}

/**
 * Mapbox uiPlace — 표시명은 유지하고 country·갤러리 맥락만 근처 SSOT 여행지에서 보강
 * @param {object} location
 * @param {number} lat
 * @param {number} lng
 * @param {{ spot: object }|null} nearbyResolved
 */
export function enrichUiPlaceFromNearbySpot(location, lat, lng, nearbyResolved) {
  if (!location || !nearbyResolved?.spot) return location;

  const spot = nearbyResolved.spot;
  const locationSpecific = hasSpecificTravelCountry(location.country, location.country_en);
  const spotGeneric = isGenericSovereignCountry(spot.country, spot.country_en);

  return {
    ...location,
    country: locationSpecific && spotGeneric ? location.country : (spot.country ?? location.country),
    country_en:
      locationSpecific && spotGeneric ? location.country_en : (spot.country_en ?? location.country_en),
    galleryRegionSpot: {
      slug: spot.slug,
      name: spot.name,
      name_en: spot.name_en,
    },
  };
}
