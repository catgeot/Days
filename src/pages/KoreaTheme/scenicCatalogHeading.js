import { sidoListPhrase } from '../Korea/festivalRegionTags.js';
import {
  labelScenicAreaCode,
  listScenicRegionAreas,
} from '../Home/lib/koreaTourAttractionMap.js';

/**
 * @param {string | null | undefined} region
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} [hubName]
 * @param {import('i18next').TFunction} [t]
 */
export function scenicDbCatalogHeading(region, areaCode, hubName, t) {
  const hub = String(hubName || '').trim();
  const placeFromHub = hub || null;
  if (placeFromHub) {
    return t
      ? t('korea.theme.scenicCatalogAttractions', { place: placeFromHub })
      : `${placeFromHub} 관광지`;
  }
  const areas = listScenicRegionAreas(region);
  const code =
    areaCode || (areas.length === 1 ? areas[0].code : null);
  if (code) {
    const phrase =
      sidoListPhrase(code) || labelScenicAreaCode(code) || region || null;
    const place =
      phrase || (t ? t('korea.common.nationwide') : '전국');
    return t
      ? t('korea.theme.scenicCatalogAttractions', { place })
      : `${place} 관광지`;
  }
  const r = String(region || '').trim();
  if (r) {
    return t
      ? t('korea.theme.scenicCatalogAttractions', { place: r })
      : `${r} 관광지`;
  }
  const nationwide = t ? t('korea.common.nationwide') : '전국';
  return t
    ? t('korea.theme.scenicCatalogAttractions', { place: nationwide })
    : '전국 관광지';
}
