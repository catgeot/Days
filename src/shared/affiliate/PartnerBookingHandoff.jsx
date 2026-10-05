import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import {
  partnerBookingHandoffCtaKey,
  resolveLodgingHandoffVariant,
} from './partnerBookingHandoff.js';

const THEME = {
  light: {
    notice: 'text-[10px] leading-snug text-stone-500',
    button:
      'inline-flex w-full items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-950 no-underline transition-colors hover:border-amber-400 hover:bg-amber-100 active:scale-[0.98]',
    partner: 'text-[9px] text-stone-400',
  },
  dark: {
    notice: 'text-[10px] leading-snug text-amber-100/75',
    button:
      'inline-flex w-full items-center justify-center gap-1 rounded-lg border border-amber-300/45 bg-amber-500/20 px-2 py-1.5 text-[11px] font-bold text-amber-50 no-underline transition-colors hover:border-amber-200/55 hover:bg-amber-500/30 active:scale-[0.98]',
    partner: 'text-[9px] text-amber-100/55',
  },
};

/**
 * @param {{
 *   href: string,
 *   kind: 'lodging' | 'tour',
 *   item?: { itemName?: string, category?: string },
 *   theme?: 'light' | 'dark',
 *   partnerName?: string,
 *   showPartnerLabel?: boolean,
 *   className?: string,
 * }} props
 */
export default function PartnerBookingHandoff({
  href,
  kind,
  item,
  theme = 'light',
  partnerName,
  showPartnerLabel = true,
  className = '',
}) {
  const { t } = useTranslation();
  const url = String(href || '').trim();
  if (!url) return null;

  const variant =
    kind === 'tour' ? 'tour-product' : resolveLodgingHandoffVariant(item);
  const ctaLabel = t(partnerBookingHandoffCtaKey(variant));
  const partner =
    partnerName ||
    t('partnerBookingHandoff.partnerMyRealTrip', { defaultValue: '마이리얼트립' });
  const styles = THEME[theme] || THEME.light;

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <p className={`${styles.notice} sm:hidden`}>{t('partnerBookingHandoff.noticeNarrow')}</p>
      <p className={`${styles.notice} hidden sm:block`}>
        {t('partnerBookingHandoff.noticeDefault')}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={styles.button}
        data-partner-booking-handoff="cta"
      >
        <span className="min-w-0 break-keep text-center">{ctaLabel}</span>
        <ExternalLink size={12} className="shrink-0 opacity-80" aria-hidden />
      </a>
      {showPartnerLabel ? (
        <p className={styles.partner}>
          {t('partnerBookingHandoff.affiliatePartner', { partner })}
        </p>
      ) : null}
    </div>
  );
}
