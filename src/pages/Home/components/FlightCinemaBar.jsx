import React from 'react';
import { ExternalLink, Plane } from 'lucide-react';

/**
 * Flight OD arc cinema — 홈 지구본 미리보기 (바로 보기 · 항공권 확인 · 닫기).
 */
export default function FlightCinemaBar({
  routeIatas,
  flightHours,
  isConnecting = false,
  flightUrl = null,
  onSkip,
  onClose,
  className = '',
}) {
  const routeLabel = Array.isArray(routeIatas) && routeIatas.length >= 2
    ? routeIatas.join(' → ')
    : '';
  const connectionLabel = isConnecting ? '경유' : '직항';
  const durationLabel = `약 ${flightHours}시간 · ${connectionLabel} · 대권 항로`;

  return (
    <div
      className={`pointer-events-auto animate-fade-in-down ${className}`}
      role="region"
      aria-label="항공 경로 시네마"
    >
      <div className="flight-cinema-bar-shell relative">
        <div className="flight-cinema-bar-halo" aria-hidden="true" />
        <div className="flight-cinema-bar-card relative z-[1] flex flex-col gap-2 rounded-2xl border bg-black/85 px-3 py-2 backdrop-blur-xl md:px-4 md:py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Plane size={16} className="shrink-0 text-sky-300" aria-hidden="true" />
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-sm font-bold text-white truncate">{routeLabel}</p>
              <p className="text-[10px] font-medium text-sky-200/90 truncate">{durationLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="tour-mobile-bar-skip shrink-0 rounded-lg border border-blue-400/45 bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-bold text-blue-50 transition-all active:scale-[0.98] sm:px-3 sm:text-xs"
            >
              바로 보기
            </button>
            {flightUrl ? (
              <a
                href={flightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flight-cinema-bar-cta shrink-0 inline-flex items-center gap-1 rounded-lg border border-sky-300/50 bg-gradient-to-r from-sky-500/90 to-blue-600/90 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:from-sky-400 hover:to-blue-500 active:scale-[0.98] sm:gap-1.5 sm:px-3 sm:text-xs"
              >
                항공권 확인
                <ExternalLink size={12} className="opacity-90" aria-hidden="true" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto shrink-0 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all active:scale-[0.98] sm:px-3 sm:text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
