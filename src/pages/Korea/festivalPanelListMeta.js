import {
  localizedFestivalCityListLabel,
  localizedSidoListPhrase,
  localizedSubregionUnitLabel,
} from '../../i18n/koreaRegionLabels.js';
import { JEONNAM_GWANGJU_INTEGRATED_SIDO_LEGAL_NAME } from '../Home/lib/koreaTourAddrNormalize.js';
import { JEONNAM_GWANGJU_INTEGRATED_LEGAL_EN } from '../../i18n/koreaRegionEn.js';
import { sidoListPhrase } from './festivalRegionTags.js';
import { isNationwideRegionFilter } from './socialPromoFestivalsLogic.js';

const INTEGRATED_PANEL_SIDO = new Set(['5', '38']);

function isEnLocale(locale) {
  return String(locale || '').startsWith('en');
}

/**
 * @param {{ areaCode: string, cityName: string, count: number, t: import('i18next').TFunction, locale?: string }} p
 * @returns {{ id: string, text: string, wrap?: boolean, nowrap?: boolean }[]}
 */
export function buildFestivalPanelListMetaSegments({
  areaCode,
  cityName,
  count,
  t,
  locale = 'ko',
}) {
  const code = String(areaCode || '');
  /** @type {{ id: string, text: string, wrap?: boolean, nowrap?: boolean }[]} */
  const segments = [];

  if (isNationwideRegionFilter(code, cityName)) {
    segments.push({
      id: 'scope',
      text: isEnLocale(locale)
        ? t('korea.festival.panelNationwideScope', { defaultValue: 'All of Korea' })
        : t('korea.common.nationwide'),
      nowrap: true,
    });
    segments.push({
      id: 'count',
      text: t('korea.common.countUnit', { count }),
      nowrap: true,
    });
    segments.push({
      id: 'regionGroup',
      text: isEnLocale(locale)
        ? t('korea.festival.panelNationwideGroup', { defaultValue: 'By region' })
        : t('korea.common.regionGroup'),
      nowrap: true,
    });
    return segments;
  }

  const city = localizedFestivalCityListLabel(locale, areaCode, cityName);
  const sidoPhrase = localizedSidoListPhrase(
    locale,
    areaCode,
    sidoListPhrase(areaCode),
  );

  const integratedSidoLevel =
    INTEGRATED_PANEL_SIDO.has(code) && !city && sidoPhrase;

  if (integratedSidoLevel) {
    segments.push({
      id: 'count',
      text: t('korea.common.countUnit', { count }),
      nowrap: true,
    });
    const unit = localizedSubregionUnitLabel(locale, areaCode, t);
    segments.push({
      id: 'bySubregion',
      text: t('korea.festival.panelBySubregion', { unit }),
      nowrap: true,
    });
    const legalName = isEnLocale(locale)
      ? JEONNAM_GWANGJU_INTEGRATED_LEGAL_EN
      : JEONNAM_GWANGJU_INTEGRATED_SIDO_LEGAL_NAME;
    segments.push({
      id: 'addrListedAs',
      text: t('korea.festival.panelAddrListedAs', { legalName }),
      wrap: true,
    });
    return segments;
  }

  if (city) {
    if (sidoPhrase) {
      segments.push({ id: 'sido', text: sidoPhrase, nowrap: true });
    }
    segments.push({ id: 'city', text: city, nowrap: true });
  } else if (sidoPhrase) {
    segments.push({ id: 'place', text: sidoPhrase, nowrap: true });
  }

  segments.push({
    id: 'count',
    text: t('korea.common.countUnit', { count }),
    nowrap: true,
  });

  if ((sidoPhrase || city) && !city) {
    const unit = localizedSubregionUnitLabel(locale, areaCode, t);
    segments.push({
      id: 'bySubregion',
      text: t('korea.festival.panelBySubregion', { unit }),
      nowrap: true,
    });
  } else if (!sidoPhrase && !city) {
    segments.push({
      id: 'regionGroup',
      text: t('korea.common.regionGroup'),
      nowrap: true,
    });
  }

  return segments;
}

/**
 * @param {{ id: string, text: string, wrap?: boolean, nowrap?: boolean }[]} segments
 */
export function formatFestivalPanelListMetaPlain(segments) {
  const list = segments || [];
  const last = list.length - 1;
  return list
    .map((seg, i) => (i < last ? `${seg.text} · ` : seg.text))
    .join('');
}
