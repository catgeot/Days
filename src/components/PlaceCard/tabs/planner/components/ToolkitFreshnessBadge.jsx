import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatToolkitCheckedBadgeDate,
  toolkitSectionFreshnessBand,
} from '../../../../../data/toolkitFreshness/policy.js';

export default function ToolkitFreshnessBadge({ section, checkedIso, className = '' }) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en' : 'ko';
  const band = toolkitSectionFreshnessBand(section, checkedIso);
  const dateLabel = formatToolkitCheckedBadgeDate(checkedIso, locale);
  if (!dateLabel) return null;

  const isOverdue = band === 'overdue' || band === 'critical';

  return (
    <span
      data-toolkit-freshness-badge=""
      data-toolkit-freshness-band={band}
      data-toolkit-section={section}
      className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
        isOverdue
          ? 'bg-[#fff0e0] text-[#b25b00] border-[#f0d4b8]'
          : 'bg-[#e6f4ea] text-[#1e7a43] border-[#c8e6d0]'
      } ${className}`.trim()}
    >
      {isOverdue
        ? t('place.planner.toolkitFreshness.badgeOverdue', { date: dateLabel })
        : t('place.planner.toolkitFreshness.badgeChecked', { date: dateLabel })}
    </span>
  );
}
