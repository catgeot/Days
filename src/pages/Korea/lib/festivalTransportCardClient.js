import { fetchFestivalTransportCard } from './festivalTransportCardFetch.js';
import {
  buildAccessView,
  preferredOriginId,
  resolveFestivalTrainDate,
  shouldQueryFestivalTransport,
  transportFactsFromView,
} from './festivalTransportCardCore.js';

/**
 * Card facts already on the festival, or a fresh proxy read for the same content id.
 * Client-only — inject `fetchTransport` in tests; Edge must not import this module.
 *
 * @param {Record<string, unknown>} festivalContext
 * @param {string} [locale]
 * @param {{ fetchTransport?: (args: { contentId: string, trainDate?: string|null }) => Promise<{ status: string, card?: Record<string, unknown> }> }} [options]
 */
export async function transportForFestivalAsk(festivalContext, locale = 'ko', options = {}) {
  const fetchTransport = options.fetchTransport ?? fetchFestivalTransportCard;
  if (festivalContext?.transport?.origins?.length) return festivalContext.transport;
  const contentId = String(festivalContext?.contentId || '').trim();
  if (!shouldQueryFestivalTransport(contentId)) return festivalContext?.transport || null;
  const trainDate = resolveFestivalTrainDate(
    festivalContext?.eventStartDate,
    festivalContext?.eventEndDate,
  );
  const result = await fetchTransport({ contentId, trainDate });
  if (result.status !== 'ready') return null;
  const view = buildAccessView(result.card);
  if (view.status !== 'ready') return null;
  const originId = preferredOriginId(view.origins, contentId);
  const origin = view.origins.find((row) => row.originId === originId) || view.origins[0];
  return transportFactsFromView(view, origin, locale);
}
