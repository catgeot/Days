import {
  formatWorldEventDateRange,
  getWorldEventTitle,
} from './worldEvents';

/** Wave1.5 D2 pilot — matches EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS. */
export const WORLD_EVENT_D2_PILOT_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
];

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function getWorldEventActionChips(event, locale = 'ko') {
  if (!event?.actionChips?.length) return [];
  return event.actionChips.map((chip) => ({
    ...chip,
    label: locale === 'en' && chip.labelEn ? chip.labelEn : chip.labelKo,
  }));
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function getWorldEventMooniChips(event, locale = 'ko') {
  if (!event?.mooniChips?.length) return [];
  return event.mooniChips.map((chip) => ({
    id: chip.id,
    label: locale === 'en' && chip.promptEn ? chip.promptEn : chip.promptKo,
    prompt: locale === 'en' && chip.promptEn ? chip.promptEn : chip.promptKo,
  }));
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function buildWorldEventMooniSeed(event, locale = 'ko') {
  if (!event) return null;
  const title = getWorldEventTitle(event, locale);
  const dateLabel = formatWorldEventDateRange(event, locale);
  const venue = event.venue?.name ? String(event.venue.name).trim() : '';
  const overview = event.detailOverview ? String(event.detailOverview).trim() : '';
  const highlights = Array.isArray(event.highlights)
    ? event.highlights.slice(0, 3).map((item) => String(item).trim()).filter(Boolean)
    : [];

  const lines = [];
  if (title) lines.push(title);
  if (dateLabel) lines.push(dateLabel);
  if (venue) lines.push(venue);
  if (overview) lines.push(overview);
  if (highlights.length) lines.push(highlights.join(' · '));

  const seedText = lines.join('\n');
  if (!seedText) return null;

  return {
    eventId: event.id,
    title,
    dateLabel,
    venue,
    overview,
    highlights,
    seedText,
  };
}

/**
 * @param {string | null | undefined} eventId
 */
export function hasWorldEventD2Chips(eventId) {
  const id = String(eventId ?? '').trim();
  return WORLD_EVENT_D2_PILOT_EVENT_IDS.includes(id);
}
