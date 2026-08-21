import { sidoListPhrase } from '../Korea/festivalRegionTags.js';
import {
  localizedAreaCodeLabel,
  localizedScenicMajorRegion,
  localizedSidoListPhrase,
} from '../../i18n/koreaRegionLabels.js';
import {
  labelScenicAreaCode,
  listScenicRegionAreas,
} from '../Home/lib/koreaTourAttractionMap.js';

/**
 * @param {string | null | undefined} region
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} [hubName]
 * @param {import('i18next').TFunction} [t]
 * @param {string} [locale]
 */
export function scenicDbCatalogHeading(region, areaCode, hubName, t, locale = 'ko') {
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
    const phrase = localizedSidoListPhrase(
      locale,
      code,
      sidoListPhrase(code) || labelScenicAreaCode(code) || '',
    );
    const place =
      phrase ||
      localizedAreaCodeLabel(locale, code, labelScenicAreaCode(code) || '') ||
      (t ? t('korea.common.nationwide') : '전국');
    return t
      ? t('korea.theme.scenicCatalogAttractions', { place })
      : `${place} 관광지`;
  }
  const r = String(region || '').trim();
  if (r) {
    const place = localizedScenicMajorRegion(locale, r);
    return t
      ? t('korea.theme.scenicCatalogAttractions', { place })
      : `${place} 관광지`;
  }
  const nationwide = t ? t('korea.common.nationwide') : '전국';
  return t
    ? t('korea.theme.scenicCatalogAttractions', { place: nationwide })
    : '전국 관광지';
}
