import { gateoKoreaFestivalDetailUrl } from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import { festivalLngLat } from '../koreaFestivalCorridors.js';

/**
 * @param {{
 *   item?: Record<string, unknown>,
 *   intro?: Record<string, unknown>,
 *   location?: Record<string, unknown> | null,
 *   homepage?: string,
 *   summaryFields?: { dateText?: string, timeText?: string, fee?: { text?: string } },
 * }} input
 */
export function buildFestivalMooniContext(input = {}) {
  const { item, intro, homepage, summaryFields, location } = input;
  const hubLabel = String(location?.name || location?.parentCity || '').trim();
  const title = String(item?.title || '').trim();
  const contentId = String(item?.contentId || '').trim();
  if (!title && !contentId) return null;

  const pt = festivalLngLat(item?.mapx, item?.mapy);
  const venue = String(intro?.eventplace || '').trim();
  const address = String(item?.addr1 || '').trim();

  return {
    contentId,
    title,
    gateoUrl: gateoKoreaFestivalDetailUrl(contentId),
    eventStartDate: String(item?.eventStartDate || intro?.eventstartdate || intro?.eventStartDate || '').trim(),
    eventEndDate: String(item?.eventEndDate || intro?.eventenddate || intro?.eventEndDate || '').trim(),
    dateLabel: String(summaryFields?.dateText || '').trim(),
    timeText: String(summaryFields?.timeText || intro?.playtime || '').trim(),
    feeText: String(summaryFields?.fee?.text || '').trim(),
    venue,
    address,
    lat: pt?.lat ?? null,
    lng: pt?.lng ?? null,
    homepage: String(homepage || '').trim(),
    hubLabel,
  };
}

/**
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 * @param {string} [inviteLine]
 */
export function buildFestivalMooniChatOpening(festivalContext, inviteLine = '') {
  const body = buildFestivalMooniNeutralOpening(festivalContext);
  const invite = String(inviteLine || '').trim();
  if (!body) return invite;
  if (!invite) return body;
  return `${body}\n\n${invite}`;
}

/**
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 */
export function buildFestivalMooniNeutralOpening(festivalContext) {
  if (!festivalContext?.title) return '';
  const lines = [];
  lines.push(festivalContext.title);
  const meta = [festivalContext.dateLabel, festivalContext.timeText]
    .filter(Boolean)
    .join(' · ');
  if (meta) lines.push(meta);
  const placeLine = [festivalContext.venue, festivalContext.address]
    .filter(Boolean)
    .join('\n');
  if (placeLine) lines.push(placeLine);
  return lines.join('\n').trim();
}
