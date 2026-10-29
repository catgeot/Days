/**
 * MOONi last-chat scope when VITE_GATEO_MOONI_SCOPED_FESTIVAL=1.
 * Keys: general | place:<slug> | festival:<contentId>
 */

/** @param {{ boundSpot?: object | null, mooniPlaceContext?: object | null } | null | undefined} input */
export function resolveMooniChatScope(input) {
  const spot = input?.boundSpot ?? input?.mooniPlaceContext ?? null;
  const festId = String(spot?.festivalContext?.contentId || '').trim();
  if (festId) return `festival:${festId}`;
  const slug = String(spot?.slug || '').trim();
  if (slug) return `place:${slug}`;
  return 'general';
}

export const MOONI_GENERAL_CHAT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
