import React from 'react';
import { useTranslation } from 'react-i18next';

const THEME = {
  light: {
    shell: 'border-stone-200/90 bg-stone-50/90',
    notice: 'text-[11px] leading-snug text-stone-600',
    partner: 'text-[10px] text-stone-500',
  },
  dark: {
    shell: 'border-amber-300/35 bg-amber-500/10',
    notice: 'text-[11px] leading-snug text-amber-50/90',
    partner: 'text-[10px] text-amber-100/70',
  },
};

/**
 * 숙소·투어 목록 상단 1회 — 제휴·가격·잔여 기준 고지.
 * @param {{ theme?: 'light' | 'dark', className?: string }} props
 */
export default function StayListPartnerNotice({ theme = 'dark', className = '' }) {
  const { t } = useTranslation();
  const styles = THEME[theme] || THEME.dark;
  const partner = t('partnerBookingHandoff.partnerMyRealTrip', { defaultValue: '마이리얼트립' });

  return (
    <div
      className={`mb-2.5 rounded-xl border px-3 py-2 ${styles.shell} ${className}`.trim()}
      data-stay-list-partner-notice=""
    >
      <p className={`${styles.notice} sm:hidden`}>{t('partnerBookingHandoff.noticeNarrow')}</p>
      <p className={`${styles.notice} hidden sm:block`}>{t('partnerBookingHandoff.noticeDefault')}</p>
      <p className={`mt-1 ${styles.partner}`}>
        {t('partnerBookingHandoff.affiliatePartner', { partner })}
      </p>
    </div>
  );
}
