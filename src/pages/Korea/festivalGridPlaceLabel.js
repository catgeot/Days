import {
  localizedFestivalCityListLabel,
  localizedSidoListPhrase,
  localizedSubregionLabel,
} from '../../i18n/koreaRegionLabels.js';
import { SIDO_ADDR_HINTS, resolveFestivalItemSidoCode } from './koreaAreaFilter.js';
import {
  cityListPhrase,
  extractSubregionLabels,
  sidoListPhrase,
} from './festivalRegionTags.js';
import { isNationwideRegionFilter } from './socialPromoFestivalsLogic.js';

function shortSidoPhrase(areaCode) {
  const hints = SIDO_ADDR_HINTS[String(areaCode)] || [];
  if (hints[1]) return hints[1];
  const long = hints[0] || sidoListPhrase(areaCode);
  return cityListPhrase(long) || long;
}

/**
 * Grid card region line — city only when a sido is selected; «경남 진주» nationwide.
 * @param {Record<string, unknown> | null | undefined} item
 * @param {{ areaCode?: string, cityName?: string, locale?: string }} ctx
 */
export function festivalGridPlaceLabel(item, ctx = {}) {
  const locale = ctx.locale || 'ko';
  const filterCode = String(ctx.areaCode || 'all');
  const filterCity = String(ctx.cityName || 'all');
  const itemCode = resolveFestivalItemSidoCode(item) || filterCode;
  const subRaw = extractSubregionLabels(item?.addr1, itemCode)[0] || '';
  const subKo = subRaw ? cityListPhrase(subRaw) : '';
  const sub = localizedSubregionLabel(locale, subKo);

  if (!isNationwideRegionFilter(filterCode, filterCity)) {
    if (filterCity !== 'all' && filterCity) {
      return (
        sub ||
        localizedFestivalCityListLabel(locale, filterCode, filterCity) ||
        localizedSubregionLabel(locale, cityListPhrase(filterCity))
      );
    }
    return sub;
  }

  const sidoKo = shortSidoPhrase(itemCode);
  const sido = localizedSidoListPhrase(locale, itemCode, sidoKo);
  if (sub && sido) return `${sido} ${sub}`;
  return sub || sido;
}
