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
    notice: 'text-[11px] leading-snug text-slate-100',
    button:
      'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-400 bg-amber-600 px-3 py-2.5 text-xs font-bold text-white no-underline shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-500 active:scale-[0.98]',
    partner: 'text-[10px] text-slate-300',
  },
};

const EMPHASIS_BUTTON = {
  light: {
    default: THEME.light.button,
    low:
      'inline-flex w-full items-center justify-center gap-1 rounded-lg border border-stone-300 bg-transparent px-2 py-1 text-[13px] font-semibold text-stone-800 no-underline transition-colors hover:border-amber-400 hover:bg-amber-50/40 active:scale-[0.98]',
  },
  dark: {
    default: THEME.dark.button,
    low:
      'inline-flex w-full items-center justify-center gap-1 rounded-md border border-white/25 bg-transparent px-2 py-1 text-[13px] font-medium text-amber-50/90 no-underline transition-colors hover:border-amber-300/50 hover:bg-white/5 active:scale-[0.98]',
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
 *   showNotice?: boolean,
 *   ctaLabel?: string,
 *   emphasis?: 'default' | 'low',
 *   className?: string,
 * }} props
 */
export default function PartnerBookingHandoff({
  href,
  kind,
  item,
  theme = 'light',
  emphasis = 'default',
  partnerName,
  showPartnerLabel = true,
  showNotice = true,
  ctaLabel: ctaLabelOverride,
  className = '',
}) {
  const { t } = useTranslation();
  const url = String(href || '').trim();
  if (!url) return null;

  const variant =
    kind === 'tour' ? 'tour-product' : resolveLodgingHandoffVariant(item);
  const ctaLabel =
    String(ctaLabelOverride || '').trim() || t(partnerBookingHandoffCtaKey(variant));
  const partner =
    partnerName ||
    t('partnerBookingHandoff.partnerMyRealTrip', { defaultValue: '마이리얼트립' });
  const styles = THEME[theme] || THEME.light;
  const emphasisKey = emphasis === 'low' ? 'low' : 'default';
  const buttonClass =
    (EMPHASIS_BUTTON[theme] || EMPHASIS_BUTTON.light)[emphasisKey] ||
    styles.button;

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {showNotice ? (
        <>
          <p className={`${styles.notice} sm:hidden`}>{t('partnerBookingHandoff.noticeNarrow')}</p>
          <p className={`${styles.notice} hidden sm:block`}>
            {t('partnerBookingHandoff.noticeDefault')}
          </p>
        </>
      ) : null}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={buttonClass}
        data-partner-booking-handoff="cta"
      >
        <span className="min-w-0 break-keep text-center">{ctaLabel}</span>
        <ExternalLink
          size={emphasis === 'low' ? 11 : 12}
          className="shrink-0 opacity-80"
          aria-hidden
        />
      </a>
      {showPartnerLabel ? (
        <p className={styles.partner}>
          {t('partnerBookingHandoff.affiliatePartner', { partner })}
        </p>
      ) : null}
    </div>
  );
}
