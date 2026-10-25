import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ToolkitFreshnessBanner({ variant = 'warn' }) {
  const { t } = useTranslation();
  const isCritical = variant === 'critical';

  return (
    <div
      data-toolkit-freshness-banner=""
      data-toolkit-freshness-banner-variant={variant}
      className={`mb-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed border ${
        isCritical
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-[#fff8e6] border-[#f0e0c0] text-[#5c4a32]'
      }`}
      role="status"
    >
      {isCritical
        ? t('place.planner.toolkitFreshness.bannerCritical')
        : t('place.planner.toolkitFreshness.bannerWarn')}
    </div>
  );
}
