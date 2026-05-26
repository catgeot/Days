/** slug별 예약 여정 프로필 — Phase 2a S2 SSOT (확장 가능) */
const PROFILES = {
  'gili-meno': {
    legs: ['flight', 'transfer', 'ferry'],
    arrivalIata: 'DPS',
    ferryRequired: true,
    noCarOnIsland: true,
    defaultFerryStep: '발리 → 길리 제도',
  },
  bali: {
    legs: ['flight', 'ground'],
    arrivalIata: 'DPS',
    ferryRequired: false,
  },
  jakarta: {
    legs: ['flight', 'ground'],
    arrivalIata: 'CGK',
    ferryRequired: false,
  },
};

const DEFAULT_PROFILE = {
  legs: ['flight'],
  arrivalIata: null,
  ferryRequired: false,
  noCarOnIsland: false,
};

/**
 * @param {string | null | undefined} slug
 */
export function getDestinationBookingProfile(slug) {
  if (!slug) return { ...DEFAULT_PROFILE, slug: null };
  const key = String(slug).trim().toLowerCase();
  return { slug: key, ...(PROFILES[key] ?? DEFAULT_PROFILE) };
}

/**
 * intent + profile → 이번 턴에 노출할 CTA leg 목록
 * @param {import('./chatIntentClassifier.js').ChatIntent} primary
 * @param {ReturnType<typeof getDestinationBookingProfile>} profile
 */
export function resolveBookingLegsForIntent(primary, profile, intents = []) {
  if (primary === 'none') return [];

  if (primary === 'access_route') {
    const legs = ['flight'];
    if (profile.ferryRequired) legs.push('ferry');
    return legs;
  }

  if (primary === 'book_ferry' || intents.includes('book_ferry')) {
    return profile.ferryRequired ? ['ferry'] : [];
  }

  if (primary === 'book_flight' || intents.includes('book_flight')) {
    return ['flight'];
  }

  if (primary === 'book_transfer' || intents.includes('book_transfer')) {
    return ['transfer'];
  }

  if (primary === 'info_visa' || intents.includes('info_visa')) {
    return ['visa'];
  }

  if (primary === 'info_fees' || intents.includes('info_fees')) {
    return ['prep_fees'];
  }

  if (primary === 'book_general') {
    const legs = ['flight'];
    if (profile.ferryRequired) legs.push('ferry');
    return legs;
  }

  return [];
}
