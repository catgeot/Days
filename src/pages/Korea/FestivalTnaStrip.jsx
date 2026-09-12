import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localizedHubLabel } from '../../i18n/koreaRegionLabels';
import EventTnaStrip from '../WorldEvents/EventTnaStrip';

/**
 * 축제 상세 바텀시트 — 마이리얼트립 투어·티켓 카드 스트립.
 *
 * @param {{
 *   item: Record<string, unknown>,
 *   festivalCross: ReturnType<import('../Home/lib/koreaThemeCrossLinks').resolveFestivalThemeCrossLinks>,
 *   locale?: string,
 * }} props
 */
export default function FestivalTnaStrip({ item, festivalCross, locale = 'ko' }) {
  const { t } = useTranslation();
  const location = festivalCross?.tna?.location || festivalCross?.stay?.location;
  const tna = festivalCross?.tna;
  const nearestHub = festivalCross?.nearbyHubs?.[0];

  const placeLabel = useMemo(() => {
    return (
      localizedHubLabel(locale, {
        hubId: nearestHub?.hubId,
        name: tna?.keyword,
      }) ||
      tna?.keyword ||
      ''
    );
  }, [locale, nearestHub?.hubId, tna?.keyword]);

  if (!location || !tna?.keyword) return null;

  return (
    <EventTnaStrip
      location={location}
      keyword={tna.keyword}
      altKeywords={tna.altKeywords}
      nearbyKeywords={tna.nearbyKeywords}
      locale={locale}
      placeLabel={placeLabel}
      title={t('korea.festival.detail.tnaStripTitle')}
      hint={t('korea.festival.detail.tnaStripHint')}
    />
  );
}
