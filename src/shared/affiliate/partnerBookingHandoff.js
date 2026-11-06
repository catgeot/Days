/** @typedef {'lodging-hotel' | 'lodging-mixed' | 'tour-product'} PartnerBookingHandoffVariant */

const LODGING_MIXED_RE =
  /펜션|민박|게스트|guest\s*house|guesthouse|pension|homestay|bnb|한옥\s*스테이|캠핑|글램핑/i;

/**
 * @param {{ itemName?: string, category?: string } | null | undefined} item
 * @returns {PartnerBookingHandoffVariant}
 */
export function resolveLodgingHandoffVariant(item) {
  const blob = `${item?.itemName || ''} ${item?.category || ''}`.trim();
  if (blob && LODGING_MIXED_RE.test(blob)) return 'lodging-mixed';
  return 'lodging-hotel';
}

/**
 * @param {PartnerBookingHandoffVariant | 'tour-product'} variant
 * @param {(key: string) => string} t
 */
export function partnerBookingHandoffCtaKey(variant) {
  if (variant === 'lodging-mixed') return 'partnerBookingHandoff.ctaLodgingMixed';
  if (variant === 'tour-product') return 'partnerBookingHandoff.ctaTourProduct';
  return 'partnerBookingHandoff.ctaLodgingHotel';
}

/**
 * 숙소 카드 전체 링크 — 스크린리더에서 숙소명·예약 CTA를 함께 읽도록.
 * @param {{ itemName?: string, category?: string } | null | undefined} item
 * @param {(key: string, opts?: object) => string} t
 */
export function stayCardBookingAccessibleName(item, t) {
  const variant = resolveLodgingHandoffVariant(item);
  const base = t(partnerBookingHandoffCtaKey(variant));
  const name = String(item?.itemName || '').trim();
  if (!name) return base;
  const namedKey =
    variant === 'lodging-mixed'
      ? 'partnerBookingHandoff.ctaLodgingMixedNamed'
      : 'partnerBookingHandoff.ctaLodgingHotelNamed';
  return t(namedKey, { name, defaultValue: `${name} — ${base}` });
}

export const PARTNER_BOOKING_HANDOFF_FORBIDDEN_CTA = [
  '지금 결제',
  '바로 결제',
  'GATEO에서 예약',
  '예약하기',
];
