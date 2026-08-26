import { parseEventYmd, tripWindowFromEvent } from '../../shared/tripWindow.js';

/**
 * TourAPI KorService2 festival row → WorldEvent-shaped runtime object.
 * 국내 축제는 worldEvents.json에 저장하지 않음 (P0-b 어댑터 초안).
 *
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {import('../../../scripts/lib/world-event-schema.mjs').WorldEventOverride | null}
 */
export function worldEventFromTourApiFestival(item) {
  const contentId = String(item?.contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const startDate = parseEventYmd(item?.eventStartDate);
  if (!startDate) return null;

  const endDate = parseEventYmd(item?.eventEndDate) || startDate;
  const title = String(item?.title || '').trim();
  if (!title) return null;

  const titleEnRaw = item?.titleEn != null ? String(item.titleEn).trim() : '';
  const addr = item?.addr1 != null ? String(item.addr1).trim() : '';

  /** @type {import('../../../scripts/lib/world-event-schema.mjs').WorldEventOverride} */
  const event = {
    id: `korea-festival-${contentId}`,
    slug: 'korea-domestic',
    type: 'festival',
    title,
    startDate,
    endDate,
    recurrence: 'fixed',
    source: 'tourapi',
  };

  if (titleEnRaw) event.titleEn = titleEnRaw;
  if (addr) event.venue = { name: addr };

  return event;
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @param {Parameters<typeof tripWindowFromEvent>[1]} [opts]
 * @returns {ReturnType<typeof tripWindowFromEvent> | null}
 */
export function tripWindowFromTourApiFestival(item, opts) {
  const event = worldEventFromTourApiFestival(item);
  if (!event) return null;
  return tripWindowFromEvent(event, opts);
}
