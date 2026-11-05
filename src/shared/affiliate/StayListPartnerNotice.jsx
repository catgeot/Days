import React from 'react';
import { useTranslation } from 'react-i18next';

const THEME = {
  light: {
    shell:
      'rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-stone-700',
    notice: 'text-[11px] font-medium leading-snug text-stone-600',
    partner: 'mt-1 text-[10px] font-semibold text-stone-500',
  },
  dark: {
    shell:
      'rounded-xl border border-amber-300/35 bg-amber-500/12 px-3 py-2.5 text-amber-50/95',
    notice: 'text-[11px] font-medium leading-snug text-amber-50/90 lg:text-[12px]',
    partner: 'mt-1 text-[10px] font-semibold text-amber-100/75',
  },
};

/**
 * @param {{ theme?: 'light' | 'dark', className?: string }} props
 */
export default function StayListPartnerNotice({ theme = 'dark', className = '' }) {
  const { t } = useTranslation();
  const styles = THEME[theme] || THEME.dark;
  const partner = t('partnerBookingHandoff.partnerMyRealTrip', { defaultValue: '마이리얼트립' });

  return (
    <div
      role="note"
      className={`${styles.shell} ${className}`.trim()}
      data-stay-list-partner-notice=""
    >
      <p className={`${styles.notice} sm:hidden`}>{t('partnerBookingHandoff.noticeNarrow')}</p>
      <p className={`${styles.notice} hidden sm:block`}>
        {t('partnerBookingHandoff.noticeDefault')}
      </p>
      <p className={styles.partner}>
        {t('partnerBookingHandoff.affiliatePartner', { partner })}
      </p>
    </div>
  );
}
