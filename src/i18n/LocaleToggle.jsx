import React from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from './LocaleProvider';

/**
 * @param {{ className?: string; compact?: boolean }} props
 */
export default function LocaleToggle({ className = '', compact = false }) {
  const { t } = useTranslation();
  const { locale, toggleLocale } = useLocale();
  const isEnglish = locale === 'en';
  const label = isEnglish ? t('layout.locale.labelKo') : t('layout.locale.labelEn');
  const title = isEnglish ? t('layout.locale.switchToKo') : t('layout.locale.switchToEn');

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`h-8 min-w-[2rem] rounded-full bg-black/50 backdrop-blur-md border border-white/25 px-2 text-[10px] font-bold tracking-wide text-white shadow-lg transition-colors hover:border-white/40 hover:bg-black/65 ${className}`}
        title={title}
        aria-label={title}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/10 hover:border-white/25 transition-all shadow-lg group ${className}`}
      title={title}
      aria-label={title}
    >
      <span className="text-[10px] font-bold tracking-wide group-hover:scale-105 transition-transform">
        {label}
      </span>
    </button>
  );
}
