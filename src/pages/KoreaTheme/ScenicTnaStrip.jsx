import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localizedHubLabel } from '../../i18n/koreaRegionLabels';
import EventTnaStrip from '../WorldEvents/EventTnaStrip';

/**
 * 명승·테마 상세 모달 — 마이리얼트립 투어·티켓 카드 스트립.
 *
 * @param {{
 *   spot: Record<string, unknown> | null,
 *   tna: {
 *     keyword?: string,
 *     altKeywords?: string[],
 *     nearbyKeywords?: string[],
 *     location?: Record<string, unknown>,
 *   } | null,
 *   locale?: string,
 * }} props
 */
export default function ScenicTnaStrip({ spot, tna, locale = 'ko' }) {
  const { t } = useTranslation();
  const location = tna?.location;

  const placeLabel = useMemo(
    () =>
      localizedHubLabel(locale, {
        hubId: location?.hubId || spot?.hubId,
        name: tna?.keyword,
      }) ||
      tna?.keyword ||
      '',
    [locale, location?.hubId, spot?.hubId, tna?.keyword],
  );

  if (!location || !tna?.keyword) return null;

  return (
    <EventTnaStrip
      location={location}
      keyword={tna.keyword}
      altKeywords={tna.altKeywords}
      nearbyKeywords={tna.nearbyKeywords}
      locale={locale}
      placeLabel={placeLabel}
      title={t('korea.theme.spotDetail.tnaStripTitle')}
      hint={t('korea.theme.spotDetail.tnaStripHint')}
    />
  );
}
