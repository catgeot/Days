import React from 'react';
import { MapPin } from 'lucide-react';
import { normalizePlacePlannerPath, buildPlacePlannerPath } from '../../utils/placePlannerPath';
import { getMooniPlannerCtaLabel } from '../../utils/placePlannerFocus';

/**
 * 탐색·소개·prep 답변 하단 — 주제별 플래너 연결 (가짜 [대괄호] CTA 대체).
 *
 * @param {{
 *   destinationName?: string,
 *   plannerUrl?: string | null,
 *   plannerFocus?: string | null,
 *   chipId?: string | null,
 *   userText?: string,
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
  onPlannerNavigate = null,
  className = '',
}) {
  const focusedPath = normalizePlacePlannerPath(plannerUrl);
  const slugFromPath = focusedPath?.match(/\/place\/([^/?#]+)/)?.[1];
  const basePlannerPath = slugFromPath ? buildPlacePlannerPath(slugFromPath) : focusedPath;

  if (!focusedPath || !onPlannerNavigate) return null;

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
      <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-400/90 break-keep">
        플래너에서 확인
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onPlannerNavigate(focusedPath)}
          className={`${baseClass} border-cyan-500/40 bg-cyan-950/40 text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/50`}
        >
          <MapPin size={14} className="shrink-0 opacity-90" />
          <span className="flex-1">{contextualLabel}</span>
        </button>
        {basePlannerPath && basePlannerPath !== focusedPath ? (
          <button
            type="button"
            onClick={() => onPlannerNavigate(basePlannerPath)}
            className={`${baseClass} border-gray-600/50 bg-gray-800/40 text-gray-200 hover:border-gray-500/60 hover:bg-gray-800/70`}
          >
            <MapPin size={14} className="shrink-0 opacity-70" />
            <span className="flex-1">GATEO 플래너에서 여행 계획 보기</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
