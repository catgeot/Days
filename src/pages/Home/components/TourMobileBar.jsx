import React from 'react';
import { getPlaceTitleLines } from '../../../components/PlaceCard/common/locationDisplay';
import { GLOBE_MODE, canEndTour, canSkipTour } from '../lib/globeMode';

/** Mobile 3D tour — compact card for header row (beside logo). */
export default function TourMobileBar({ location, globeMode, onSkip, onEndTour, className = '' }) {
  const { primaryName } = getPlaceTitleLines(location);
  const showSkip = canSkipTour(globeMode);
  const show2d = canEndTour(globeMode) && globeMode === GLOBE_MODE.TOUR_READY;

  return (
    <div className={`min-w-0 flex-1 pointer-events-auto animate-fade-in-down ${className}`}>
      <div className="tour-mobile-bar-shell relative">
        <div className="tour-mobile-bar-halo" aria-hidden="true" />
        <div className="tour-mobile-bar-card relative z-[1] flex items-center gap-2 rounded-2xl border border-white/15 bg-black/80 px-2.5 py-1.5 backdrop-blur-xl">
          <div className="flex-1 min-w-0 leading-none">
            <p className="text-[9px] font-bold tracking-widest uppercase text-blue-300/90 truncate leading-none">
              {location?.country || 'Global'}
            </p>
            <p className="mt-px text-sm font-bold text-white truncate leading-none">
              {primaryName || location?.name}
            </p>
          </div>
          {showSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="tour-mobile-bar-skip shrink-0 rounded-lg border border-blue-400/45 bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-50 transition-all active:scale-[0.98]"
            >
              Skip
            </button>
          )}
          {show2d && (
            <button
              type="button"
              onClick={onEndTour}
              className="shrink-0 rounded-lg border border-blue-400/45 bg-blue-500/20 px-2.5 py-1.5 text-xs font-bold text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all active:scale-[0.98]"
            >
              2D로 복귀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
