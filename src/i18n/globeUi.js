/**
 * Globe face chips — subregion·country·ocean·sea basin display labels.
 * Country/subregion ids are SSOT in globeFaceSubregions / globeCountryCatalog.
 */

/**
 * @param {import('i18next').TFunction} t
 * @param {string | null | undefined} category
 * @param {{ id?: string, labelKo?: string } | null | undefined} subregion
 */
export function localizedGlobeSubregionLabel(t, category, subregion) {
  const id = subregion?.id;
  const labelKo = subregion?.labelKo || id || '';
  if (category && id) {
    return t(`home.globe.subregion.${category}.${id}`, { defaultValue: labelKo });
  }
  return labelKo;
}

/**
 * @param {import('i18next').TFunction} t
 * @param {{ id?: string, labelKo?: string } | null | undefined} region
 */
export function localizedGlobeCountryLabel(t, region) {
  const id = region?.id;
  const labelKo = region?.labelKo || id || '';
  if (!id) return labelKo;
  return t(`home.globe.country.${id}`, { defaultValue: labelKo });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {{ id?: string, name?: string } | null | undefined} ocean
 */
export function localizedSeaOceanLabel(t, ocean) {
  const id = ocean?.id;
  const labelKo = ocean?.name || id || '';
  if (!id) return labelKo;
  return t(`home.globe.ocean.${id}`, { defaultValue: labelKo });
}

/**
 * Sea basin chips — name_en in seaBasins.json when locale is en.
 * @param {string} locale
 * @param {{ id?: string, name?: string, name_en?: string, labelKo?: string } | null | undefined} basin
 */
export function localizedSeaBasinChipLabel(locale, basin) {
  const ko = basin?.labelKo || basin?.name || basin?.id || '';
  if (locale?.startsWith('en') && basin?.name_en) return basin.name_en;
  return ko;
}
