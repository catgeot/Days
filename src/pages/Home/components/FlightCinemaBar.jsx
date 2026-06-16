import React from 'react';
import { Plane } from 'lucide-react';

/**
 * Flight OD arc cinema — 홈 지구본 미리보기 전용 (바로 보기 · 닫기).
 */
export default function FlightCinemaBar({
  originIata,
  destIata,
  flightHours,
  onSkip,
  onClose,
  className = '',
}) {
  const routeLabel = `${originIata} → ${destIata}`;
  const durationLabel = `약 ${flightHours}시간 · 직항 · 대권 항로`;

  return (
    <div
      className={`pointer-events-auto animate-fade-in-down ${className}`}
      role="region"
      aria-label="항공 경로 시네마"
    >
      <div className="tour-mobile-bar-shell relative">
        <div className="tour-mobile-bar-halo" aria-hidden="true" />
        <div className="tour-mobile-bar-card relative z-[1] flex items-center gap-2 rounded-2xl border border-white/15 bg-black/80 px-3 py-2 backdrop-blur-xl md:px-4 md:py-2.5">
          <Plane size={16} className="shrink-0 text-sky-300" aria-hidden="true" />
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-sm font-bold text-white truncate">{routeLabel}</p>
            <p className="text-[10px] font-medium text-sky-200/90 truncate">{durationLabel}</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="tour-mobile-bar-skip shrink-0 rounded-lg border border-blue-400/45 bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-50 transition-all active:scale-[0.98]"
          >
            바로 보기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-[0.98]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
