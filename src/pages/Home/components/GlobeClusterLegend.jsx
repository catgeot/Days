import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { getClusterForSlug, getRelatedTravelSpots } from '../../../utils/travelSpotClusters.js';

/**
 * Phase 3 권역 클러스터 — 좌하단 범례를 탭하면 같은 권역·다른 관문 여행지 목록 노출
 */
export default function GlobeClusterLegend({
  focusSlug,
  travelSpots = [],
  onSelectSpot,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef(null);

  const cluster = useMemo(() => getClusterForSlug(focusSlug), [focusSlug]);
  const related = useMemo(() => getRelatedTravelSpots(focusSlug), [focusSlug]);
  const spotBySlug = useMemo(
    () => new Map(travelSpots.map((spot) => [spot.slug, spot])),
    [travelSpots]
  );

  useEffect(() => {
    setExpanded(false);
  }, [focusSlug]);

  useEffect(() => {
    if (!expanded) return undefined;

    const handlePointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      setExpanded(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [expanded]);

  if (!cluster || !related.length) return null;

  const handleSelect = (slug) => {
    const spot = spotBySlug.get(slug);
    if (!spot || !onSelectSpot) return;
    onSelectSpot({ ...spot, type: 'major' }, 'globe');
    setExpanded(false);
  };

  return (
    <div ref={panelRef} className={`pointer-events-auto ${className}`}>
      <div className="rounded-2xl border border-amber-400/20 bg-black/60 text-[11px] text-white/85 shadow-lg backdrop-blur-sm max-w-[15rem]">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/5 rounded-2xl"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-bold tracking-wide text-amber-100/95 break-keep">
              {cluster.labelKo}
            </span>
            <span className="mt-0.5 block text-[10px] text-white/60 break-keep">
              {expanded ? '다른 관문 여행지' : '탭하면 주변 여행지 목록'}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`mt-0.5 shrink-0 text-amber-200/80 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>

        {expanded && (
          <ul className="border-t border-amber-400/15 px-2 py-2 space-y-1 max-h-[min(40vh,14rem)] overflow-y-auto custom-scrollbar">
            {related.map((spot) => (
              <li key={spot.slug}>
                <button
                  type="button"
                  onClick={() => handleSelect(spot.slug)}
                  className="flex w-full flex-col gap-0.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-amber-400/10 active:bg-amber-400/15"
                >
                  <span className="text-xs font-bold text-white break-keep">{spot.name}</span>
                  {spot.name_en ? (
                    <span className="text-[10px] font-medium text-white/55 break-keep">{spot.name_en}</span>
                  ) : null}
                  {spot.gatewayIata ? (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-200/90">
                      <MapPin size={10} className="shrink-0" aria-hidden />
                      {spot.gatewayIata}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
