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
  listLoading = false,
}) {
  const code = String(areaCode || '');
  /** @type {{ id: string, text: string, wrap?: boolean, nowrap?: boolean }[]} */
  const segments = [];

  const showCount = !(listLoading && count === 0);

  if (isNationwideRegionFilter(code, cityName)) {
    segments.push({
      id: 'scope',
      text: isEnLocale(locale)
        ? t('korea.festival.panelNationwideScope', { defaultValue: 'Nationwide' })
        : t('korea.common.nationwide'),
      nowrap: true,
    });
    if (showCount) {
      segments.push({
        id: 'count',
        text: t('korea.common.countUnit', { count }),
        nowrap: true,
      });
    }
    segments.push({
      id: 'regionGroup',
      text: t('korea.festival.panelNationwideGroup', {
        defaultValue: isEnLocale(locale) ? 'By province' : '시·도별',
      }),
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
    if (showCount) {
      segments.push({
        id: 'count',
        text: t('korea.common.countUnit', { count }),
        nowrap: true,
      });
    }
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

  if (showCount) {
    segments.push({
      id: 'count',
      text: t('korea.common.countUnit', { count }),
      nowrap: true,
    });
  }

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

const META_PLACE_SEGMENT_IDS = new Set(['scope', 'sido', 'city', 'place']);

/**
 * Insert window30 until label after region place segments, before count (e.g. 서울특별시 · 11.14까지 · 43건).
 * @param {{ id: string, text: string, wrap?: boolean, nowrap?: boolean }[]} segments
 * @param {string} untilLabel
 */
export function insertWindow30MetaPeriodSegment(segments, untilLabel) {
  const label = String(untilLabel || '').trim();
  if (!label || !segments?.length) return segments;
  const list = [...segments];
  let insertAt = -1;
  for (let i = 0; i < list.length; i++) {
    if (META_PLACE_SEGMENT_IDS.has(list[i].id)) insertAt = i;
  }
  if (insertAt >= 0) {
    list.splice(insertAt + 1, 0, { id: 'periodUntil', text: label, nowrap: true });
    return list;
  }
  const countIdx = list.findIndex((seg) => seg.id === 'count');
  if (countIdx >= 0) {
    list.splice(countIdx, 0, { id: 'periodUntil', text: label, nowrap: true });
    return list;
  }
  list.unshift({ id: 'periodUntil', text: label, nowrap: true });
  return list;
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
