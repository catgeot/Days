import React, { useEffect, useMemo, useState } from 'react';
import { localizedHubLabel } from '../../i18n/koreaRegionLabels';
import { tripWindowPresetsFromEvent } from '../../utils/worldEventTripPresets';
import EventStayStrip from '../WorldEvents/EventStayStrip';
import { worldEventFromTourApiFestival } from './worldEventFromTourApiFestival';

/**
 * @param {{
 *   item: Record<string, unknown>,
 *   festivalCross: ReturnType<import('../Home/lib/koreaThemeCrossLinks').resolveFestivalThemeCrossLinks>,
 *   locale?: string,
 * }} props
 */
export default function FestivalStayStrip({ item, festivalCross, locale = 'ko' }) {
  const event = useMemo(() => worldEventFromTourApiFestival(item), [item]);
  const location = festivalCross?.stay?.location;
  const nearestHub = festivalCross?.nearbyHubs?.[0];

  const presets = useMemo(() => (event ? tripWindowPresetsFromEvent(event) : null), [event]);

  const [tripDates, setTripDates] = useState(() => ({
    checkIn: presets?.tripWindow.checkIn || '',
    checkOut: presets?.tripWindow.checkOut || '',
  }));

  useEffect(() => {
    if (!presets) return;
    setTripDates({
      checkIn: presets.tripWindow.checkIn,
      checkOut: presets.tripWindow.checkOut,
    });
  }, [item?.contentId, presets?.tripWindow.checkIn, presets?.tripWindow.checkOut]);

  const placeLabel = useMemo(() => {
    return (
      localizedHubLabel(locale, {
        hubId: nearestHub?.hubId,
        name: festivalCross?.stay?.keyword,
      }) ||
      festivalCross?.stay?.keyword ||
      ''
    );
  }, [locale, nearestHub?.hubId, festivalCross?.stay?.keyword]);

  if (!event || !location || !presets || !tripDates.checkIn || !tripDates.checkOut) return null;

  return (
    <EventStayStrip
      event={event}
      location={location}
      checkIn={tripDates.checkIn}
      checkOut={tripDates.checkOut}
      visitPresets={presets.visitPresets}
      onDatesChange={setTripDates}
      locale={locale}
      placeLabel={placeLabel}
    />
  );
}
