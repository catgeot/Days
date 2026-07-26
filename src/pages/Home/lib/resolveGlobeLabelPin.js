/**
 * 지구본 지명 라벨 클릭 → uiPlace slug/name_en (순수 · 스모크용).
 * 네트워크·React 없음.
 */
import {
  formatUrlName,
  isUrlSafeEnglishLabel,
  pickUrlSafeEnglishName,
} from './formatUrlName.js';
import { canonTravelCountryKey } from './travelRegionCountry.js';

/**
 * @param {{
 *   clickedLabel: string,
 *   clickedLabelEn?: string,
 *   address?: {
 *     name_en?: string,
 *     name_ko?: string,
 *     country?: string,
 *     country_en?: string,
 *   } | null,
 *   lat: number,
 *   lng: number,
 * }} input
 * @returns {{
 *   slug: string,
 *   name: string,
 *   name_en: string,
 *   name_ko: string,
 *   country: string,
 *   country_en: string,
 *   display_name: string,
 *   labelMatchesCountry: boolean,
 * }}
 */
export function resolveGlobeLabelPinFields({
  clickedLabel,
  clickedLabelEn: clickedLabelEnRaw = '',
  address = null,
  lat,
  lng,
}) {
  const label = String(clickedLabel || '').trim();
  const clickedLabelEn = isUrlSafeEnglishLabel(clickedLabelEnRaw)
    ? String(clickedLabelEnRaw).trim()
    : '';
  const countryEn = String(address?.country_en || '').trim();
  const countryKo = String(address?.country || '').trim();

  const labelCountryKey = canonTravelCountryKey(label) || canonTravelCountryKey(clickedLabelEn);
  const geoCountryKey = canonTravelCountryKey(countryKo) || canonTravelCountryKey(countryEn);
  const labelMatchesCountry =
    Boolean(labelCountryKey) &&
    Boolean(geoCountryKey) &&
    (labelCountryKey === geoCountryKey ||
      (countryKo && label === countryKo) ||
      (countryEn && label.toLowerCase() === countryEn.toLowerCase()) ||
      (clickedLabelEn && countryEn && clickedLabelEn.toLowerCase() === countryEn.toLowerCase()));

  const geoEnglish =
    labelMatchesCountry && isUrlSafeEnglishLabel(countryEn)
      ? countryEn
      : pickUrlSafeEnglishName({
          name_en: address?.name_en,
          country_en: address?.country_en,
        });
  const slugBase = clickedLabelEn || geoEnglish || '';
  const slug = formatUrlName(slugBase) || `label-${lat}-${lng}`;
  const displayName = labelMatchesCountry ? countryKo || label : label;

  return {
    slug,
    name: displayName,
    name_en: slugBase,
    name_ko: displayName,
    country: countryKo || 'Explore',
    country_en: countryEn || 'Explore',
    display_name: displayName,
    labelMatchesCountry,
  };
}
