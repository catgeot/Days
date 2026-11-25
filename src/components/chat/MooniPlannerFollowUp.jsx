import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { normalizePlacePlannerPath, buildPlacePlannerPath } from '../../utils/placePlannerPath';
import {
  getMooniPlannerCtaLabel,
  isMooniTransportPlannerChip,
} from '../../utils/placePlannerFocus';
import MooniTransportPlannerLinks from './MooniTransportPlannerLinks';

/**
 * 탐색·소개·prep 답변 하단 — 주제별 플래너 연결 (가짜 [대괄호] CTA 대체).
 *
 * @param {{
 *   destinationName?: string,
 *   plannerUrl?: string | null,
 *   plannerFocus?: string | null,
 *   chipId?: string | null,
 *   userText?: string,
 *   essentialGuide?: object | null,
 *   onPlannerNavigate?: (path: string) => void,
 *   className?: string,
 * }} props
 */
export default function MooniPlannerFollowUp({
  destinationName = '',
  plannerUrl = null,
  plannerFocus = null,
  chipId = null,
  userText = '',
  essentialGuide = null,
  onPlannerNavigate = null,
  className = '',
  variant = 'dark',
}) {
  const { t } = useTranslation();
  const focusedPath = normalizePlacePlannerPath(plannerUrl);
  const slugFromPath = focusedPath?.match(/\/place\/([^/?#]+)/)?.[1];
  const basePlannerPath = slugFromPath ? buildPlacePlannerPath(slugFromPath) : focusedPath;

  if (!focusedPath || !onPlannerNavigate) return null;

  const transportChip = isMooniTransportPlannerChip(chipId, userText, plannerFocus);
  const light = variant === 'light';
  const headingClass = light
    ? 'text-[10px] font-bold uppercase tracking-wide text-cyan-900 break-keep'
    : 'text-[10px] font-bold uppercase tracking-wide text-cyan-200 break-keep';
  const primaryButtonClass = light
    ? 'border-cyan-800 bg-cyan-700 text-white hover:bg-cyan-800'
    : 'border-cyan-500/40 bg-cyan-950/40 text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/50';
  const secondaryButtonClass = light
    ? 'border-slate-500 bg-white text-slate-900 hover:bg-slate-100'
    : 'border-gray-600/50 bg-gray-800/40 text-gray-200 hover:border-gray-500/60 hover:bg-gray-800/70';

  if (transportChip && slugFromPath) {
    return (
      <div className={`mt-3 space-y-2 w-full ${className}`}>
        <MooniTransportPlannerLinks
          slug={slugFromPath}
          destinationName={destinationName}
          essentialGuide={essentialGuide}
          onPlannerNavigate={onPlannerNavigate}
          variant={variant}
        />
        {basePlannerPath ? (
          <button
            type="button"
            onClick={() => onPlannerNavigate(basePlannerPath)}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors break-keep pointer-events-auto text-left ${secondaryButtonClass}`}
          >
            <MapPin size={14} className="shrink-0" />
            <span className="flex-1">{t('mooni.planner.openFull')}</span>
          </button>
        ) : null}
      </div>
    );
  }

  const contextualLabel = getMooniPlannerCtaLabel({
    destinationName,
    plannerFocus,
    chipId,
    userText,
  });

  const baseClass =
    'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-bold break-keep transition-colors pointer-events-auto text-left';

  return (
    <div className={`mt-3 space-y-2 w-full ${className}`}>
      <p className={headingClass}>
        {t('mooni.planner.heading')}
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onPlannerNavigate(focusedPath)}
          className={`${baseClass} ${primaryButtonClass}`}
        >
          <MapPin size={14} className="shrink-0" />
          <span className="flex-1">{contextualLabel}</span>
        </button>
        {basePlannerPath && basePlannerPath !== focusedPath ? (
          <button
            type="button"
            onClick={() => onPlannerNavigate(basePlannerPath)}
            className={`${baseClass} ${secondaryButtonClass}`}
          >
            <MapPin size={14} className="shrink-0" />
            <span className="flex-1">{t('mooni.planner.openFull')}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
