/** In-app place cards mentioned in the Cairo day-by-day line. Longer phrase first. */
const ITINERARY_PLACE_LINKS = [
  ['Sultan Hassan Mosque', '/place/sultan-hassan-mosque'],
  ['술탄 하산 모스크', '/place/sultan-hassan-mosque'],
  ['GEM', '/place/grand-egyptian-museum'],
];

const ITINERARY_PLACE_RE = /(Sultan Hassan Mosque|술탄 하산 모스크|GEM)/g;

/**
 * @param {unknown} text
 * @returns {{ type: 'text' | 'link', text: string, href?: string }[]}
 */
export function splitItineraryPlaceMentions(text) {
  const value = String(text || '');
  /** @type {{ type: 'text' | 'link', text: string, href?: string }[]} */
  const parts = [];
  let last = 0;
  for (const match of value.matchAll(ITINERARY_PLACE_RE)) {
    const index = match.index ?? 0;
    const phrase = match[1];
    if (index > last) parts.push({ type: 'text', text: value.slice(last, index) });
    const href = ITINERARY_PLACE_LINKS.find(([label]) => label === phrase)?.[1] || '';
    parts.push({ type: 'link', text: phrase, href });
    last = index + phrase.length;
  }
  if (last < value.length) parts.push({ type: 'text', text: value.slice(last) });
  if (!parts.length && value) parts.push({ type: 'text', text: value });
  return parts;
}
