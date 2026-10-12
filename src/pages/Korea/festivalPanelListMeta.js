import {
  localizedFestivalCityListLabel,
  localizedSidoPanelHeadingPhrase,
  localizedSidoListPhrase,
  localizedSubregionUnitLabel,
} from '../../i18n/koreaRegionLabels.js';
import { sidoListPhrase } from './festivalRegionTags.js';

const INTEGRATED_PANEL_SIDO = new Set(['5', '38']);

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
  const sido = localizedSidoPanelHeadingPhrase(
    locale,
    areaCode,
    sidoListPhrase(areaCode),
  );
  const city = localizedFestivalCityListLabel(locale, areaCode, cityName);
  const segments = [];
  const sidoWrap = INTEGRATED_PANEL_SIDO.has(String(areaCode));

  if (city) {
    if (sido) {
      segments.push({ id: 'sido', text: sido, wrap: sidoWrap });
    }
    segments.push({ id: 'city', text: city, nowrap: true });
  } else if (sido) {
    segments.push({ id: 'place', text: sido, wrap: sidoWrap });
  }

  segments.push({
    id: 'count',
    text: t('korea.common.countUnit', { count }),
    nowrap: true,
  });

  if ((sido || city) && !city) {
    const unit = localizedSubregionUnitLabel(locale, areaCode, t);
    segments.push({
      id: 'bySubregion',
      text: t('korea.festival.panelBySubregion', { unit }),
      nowrap: true,
    });
  } else if (!sido && !city) {
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
  return (segments || [])
    .map((seg) => seg.text)
    .filter(Boolean)
    .join(' · ');
}
