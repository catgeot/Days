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

  const handlePointerDown = (event) => {
    event.stopPropagation();
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleLocale();
  };

  if (compact) {
    return (
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`relative z-20 h-7 min-w-[1.75rem] rounded-full bg-black/80 backdrop-blur-md border border-white/35 px-1.5 text-[10px] font-bold tracking-wide text-white shadow-[0_0_10px_rgba(255,255,255,0.12)] transition-colors hover:border-white/50 hover:bg-black/90 touch-manipulation ${className}`}
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
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`relative z-20 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/10 hover:border-white/25 transition-all shadow-lg group touch-manipulation ${className}`}
      title={title}
      aria-label={title}
    >
      <span className="text-[10px] font-bold tracking-wide group-hover:scale-105 transition-transform">
        {label}
      </span>
    </button>
  );
}
