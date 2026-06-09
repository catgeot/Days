import React, { useCallback } from 'react';
import { Plus, Minus, Compass } from 'lucide-react';

const BTN =
  'h-11 w-11 rounded-full bg-black/55 border border-white/20 text-gray-100 shadow-lg backdrop-blur-sm flex items-center justify-center active:scale-95 hover:bg-black/70 transition-colors';

/**
 * Mapbox NavigationControl 대체 — z-[70] 레이어에 렌더 (Summary·MOONi 위).
 */
export default function GlobeExploreNavControls({
  mapRef,
  hasPlaceSummary = false
}) {
  const getMap = useCallback(() => mapRef.current?.getMap?.(), [mapRef]);

  const handleZoomIn = useCallback(() => {
    getMap()?.zoomIn({ duration: 280 });
  }, [getMap]);

  const handleZoomOut = useCallback(() => {
    getMap()?.zoomOut({ duration: 280 });
  }, [getMap]);

  const handleResetNorth = useCallback(() => {
    const map = getMap();
    if (!map) return;
    map.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 480,
      essential: true
    });
  }, [getMap]);

  const positionClass = hasPlaceSummary
    ? 'bottom-[calc(6.75rem+9.5rem+env(safe-area-inset-bottom,0px))] left-3 lg:bottom-[calc(1.5rem+11.5rem+env(safe-area-inset-bottom,0px))] lg:left-auto lg:right-8'
    : 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-3 lg:bottom-8 lg:right-8';

  return (
    <div
      className={`absolute z-[70] pointer-events-auto flex flex-col gap-1 ${positionClass}`}
      role="toolbar"
      aria-label="지도 탐색"
    >
      <button type="button" onClick={handleZoomIn} className={BTN} aria-label="확대" title="확대">
        <Plus size={20} strokeWidth={2.2} />
      </button>
      <button type="button" onClick={handleZoomOut} className={BTN} aria-label="축소" title="축소">
        <Minus size={20} strokeWidth={2.2} />
      </button>
      <button type="button" onClick={handleResetNorth} className={`${BTN} border-blue-400/35 text-blue-300`} aria-label="북쪽·수평 맞추기" title="북쪽·수평 맞추기">
        <Compass size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
