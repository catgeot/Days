import { eventCtaMaxNights, visitWindowPresetsFromEvent } from '../shared/eventVisitWindows.js';
import { tripWindowFromEvent } from '../shared/tripWindow.js';
import { buildWorldEventDetailPath } from './worldEventDetailPath.js';
import {
  buildPlaceDetailPathFromEvent,
  buildPlacePlannerPathFromEvent,
} from './placePlannerPath.js';

/**
 * WorldEvent → TripWindow + planner·상세 URL 프리셋 (허브·PlaceCard SSOT).
 * @param {{ startDate?: string, endDate?: string, id?: string, slug?: string, sourceUrl?: string, recommendedNights?: number }} event
 * @param {Parameters<typeof tripWindowFromEvent>[1]} [opts]
 */
export function tripWindowPresetsFromEvent(event, opts = {}) {
  const maxNights = opts.maxNights ?? eventCtaMaxNights(event);
  const tripWindow = tripWindowFromEvent(event, { ...opts, maxNights });
  const visitPresets = visitWindowPresetsFromEvent(event, { ...opts, maxNights });
  const slug = String(event?.slug || '').trim().toLowerCase();
  const eventId = tripWindow.eventId || event?.id || '';
  const windowArgs = {
    checkIn: tripWindow.checkIn,
    checkOut: tripWindow.checkOut,
    eventId,
  };

  return {
    tripWindow,
    visitPresets,
    slug,
    eventId,
    eventDetailHref: buildWorldEventDetailPath(eventId),
    detailHref: buildPlaceDetailPathFromEvent(slug, windowArgs),
    plannerHref: buildPlacePlannerPathFromEvent(slug, windowArgs),
    sourceUrl: String(event?.sourceUrl ?? '').trim(),
  };
}
