import React from 'react';
import { MapPin } from 'lucide-react';
import { normalizePlacePlannerPath } from '../../utils/placePlannerPath';

/**
 * 탐색·소개 답변 하단 — 플래너로만 연결 (가짜 [대괄호] CTA 대체).
 *
 * @param {{
 *   destinationName?: string,
 *   plannerUrl?: string | null,
 *   onPlannerNavigate?: (path: string) => void,
 *   className?: string,
 * }} props
 */
export default function MooniPlannerFollowUp({
  destinationName = '',
  plannerUrl = null,
  onPlannerNavigate = null,
  className = '',
}) {
  const plannerPath = normalizePlacePlannerPath(plannerUrl);
  if (!plannerPath || !onPlannerNavigate) return null;

  const placeLabel = String(destinationName ?? '').trim() || '여행지';
  const buttons = [
    { key: 'plan', label: 'GATEO 플래너에서 여행 계획 보기' },
    { key: 'travel', label: `${placeLabel} 항공·입국 정보 (플래너)` },
  ];

  const baseClass =
    'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-bold break-keep transition-colors pointer-events-auto text-left';

  return (
    <div className={`mt-3 space-y-2 w-full ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-400/90 break-keep">
        플래너에서 확인
      </p>
      <div className="flex flex-col gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.key}
            type="button"
            onClick={() => onPlannerNavigate(plannerPath)}
            className={`${baseClass} border-cyan-500/40 bg-cyan-950/40 text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/50`}
          >
            <MapPin size={14} className="shrink-0 opacity-90" />
            <span className="flex-1">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
