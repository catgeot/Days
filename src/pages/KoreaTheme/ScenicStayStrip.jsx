import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localizedHubLabel } from '../../i18n/koreaRegionLabels';
import { normalizeMrtStayDates } from '../../utils/fetchMrtStays';
import EventStayStrip from '../WorldEvents/EventStayStrip';

/**
 * 명승·테마 상세 — 축제 FestivalStayStrip과 동일 EventStayStrip.
 * 행사 프리셋 없이 MRT 기본 일정(+14일 · 3박).
 *
 * @param {{
 *   spot: Record<string, unknown> | null,
 *   stay: { keyword?: string, location?: Record<string, unknown> } | null,
 *   stayAreas?: Array<{ name?: string, mrtKeyword?: string, hubId?: string }>,
 *   locale?: string,
 * }} props
 */
export default function ScenicStayStrip({ spot, stay, stayAreas, locale = 'ko' }) {
  const { t } = useTranslation();
  const location = stay?.location;
  const stayHubId = location?.hubId || stayAreas?.[0]?.hubId || spot?.hubId;
  const [tripDates, setTripDates] = useState(() => normalizeMrtStayDates());

  const event = useMemo(
    () => ({
      id: `korea-scenic-${String(spot?.id || spot?.placeSlug || spot?.contentId || 'spot')}`,
    }),
    [spot?.id, spot?.placeSlug, spot?.contentId],
  );

  const placeLabel = useMemo(
    () =>
      localizedHubLabel(locale, {
        hubId: stayHubId,
        name: stay?.keyword,
      }) ||
      stay?.keyword ||
      '',
    [locale, stayHubId, stay?.keyword],
  );

  if (!location || !tripDates.checkIn || !tripDates.checkOut) return null;

  return (
    <EventStayStrip
      event={event}
      location={location}
      checkIn={tripDates.checkIn}
      checkOut={tripDates.checkOut}
      visitPresets={[]}
      onDatesChange={setTripDates}
      locale={locale}
      placeLabel={placeLabel}
      stayAreas={stayAreas}
      title={t('korea.theme.spotDetail.stayStripTitle')}
      hint={t('korea.theme.spotDetail.stayStripHint')}
    />
  );
}
