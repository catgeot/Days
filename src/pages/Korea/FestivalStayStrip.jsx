import React, { useEffect, useMemo, useState } from 'react';
import { visitWindowPresetsFromEvent } from '../../shared/eventVisitWindows.js';
import { localizedHubLabel } from '../../i18n/koreaRegionLabels';
import EventStayStrip from '../WorldEvents/EventStayStrip';
import {
  tripWindowFromTourApiFestival,
  worldEventFromTourApiFestival,
} from './worldEventFromTourApiFestival';

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

  const visitPresets = useMemo(
    () => (event ? visitWindowPresetsFromEvent(event) : []),
    [event],
  );

  const defaultWindow = useMemo(
    () => tripWindowFromTourApiFestival(item),
    [item],
  );

  const [tripDates, setTripDates] = useState(() => ({
    checkIn: defaultWindow?.checkIn || visitPresets[0]?.checkIn || '',
    checkOut: defaultWindow?.checkOut || visitPresets[0]?.checkOut || '',
  }));

  useEffect(() => {
    if (!defaultWindow) return;
    setTripDates({
      checkIn: defaultWindow.checkIn,
      checkOut: defaultWindow.checkOut,
    });
  }, [item?.contentId, defaultWindow?.checkIn, defaultWindow?.checkOut]);

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

  if (!event || !location || !tripDates.checkIn || !tripDates.checkOut) return null;

  return (
    <EventStayStrip
      event={event}
      location={location}
      checkIn={tripDates.checkIn}
      checkOut={tripDates.checkOut}
      visitPresets={visitPresets}
      onDatesChange={setTripDates}
      locale={locale}
      placeLabel={placeLabel}
    />
  );
}
