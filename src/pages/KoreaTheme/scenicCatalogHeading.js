import { sidoListPhrase } from '../Korea/festivalRegionTags.js';
import {
  labelScenicAreaCode,
  listScenicRegionAreas,
} from '../Home/lib/koreaTourAttractionMap.js';

/**
 * 명승 DB 목록 제목 — 상단 권역·시도 대분류에 맞춤 (예: 강원도 관광지).
 * @param {string | null | undefined} region
 * @param {string | null | undefined} areaCode
 */
export function scenicDbCatalogHeading(region, areaCode) {
  const areas = listScenicRegionAreas(region);
  const code =
    areaCode || (areas.length === 1 ? areas[0].code : null);
  if (code) {
    const phrase =
      sidoListPhrase(code) || labelScenicAreaCode(code) || region || '전국';
    return `${phrase} 관광지`;
  }
  const r = String(region || '').trim();
  if (r) return `${r} 관광지`;
  return '전국 관광지';
}
