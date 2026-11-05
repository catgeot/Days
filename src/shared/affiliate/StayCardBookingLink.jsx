import React from 'react';
import { useTranslation } from 'react-i18next';
import { stayCardBookingAccessibleName } from './partnerBookingHandoff.js';

/**
 * 숙소 카드 전체 — 기존 PartnerBookingHandoff CTA와 동일 href·rel·접근 가능 이름.
 */
export default function StayCardBookingLink({
  href,
  item,
  className = '',
  children,
}) {
  const { t } = useTranslation();
  const url = String(href || '').trim();
  if (!url) return null;

  const ariaLabel = stayCardBookingAccessibleName(item, t);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      data-partner-booking-handoff="cta"
      aria-label={ariaLabel}
      className={`block no-underline outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`.trim()}
    >
      {children}
    </a>
  );
}
