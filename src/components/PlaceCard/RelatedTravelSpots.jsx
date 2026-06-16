import React, { useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { getClusterForSlug, getRelatedTravelSpots } from '../../utils/travelSpotClusters.js';
import { getPlaceStableKey } from '../../utils/travelSpotResolve.js';
import { plannerCaption, plannerMicroLabel } from './tabs/planner/readableText';

const DRAG_CLICK_THRESHOLD_PX = 5;

/**
 * 같은 권역·다른 관문 여행지 교차 링크 (PlannerTab 배너 아래)
 */
export default function RelatedTravelSpots({ location, className = '' }) {
  const currentSlug = getPlaceStableKey(location);
  const related = useMemo(() => getRelatedTravelSpots(currentSlug), [currentSlug]);
  const cluster = useMemo(() => getClusterForSlug(currentSlug), [currentSlug]);

  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });

  const handleMouseDown = useCallback((event) => {
    if (event.button !== 0 || !scrollRef.current) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    event.preventDefault();
    const delta = event.pageX - dragRef.current.startX;
    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD_PX) {
      dragRef.current.moved = true;
    }
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - delta;
  }, []);

  const endDrag = useCallback(() => {
    if (!scrollRef.current) return;
    dragRef.current.active = false;
    scrollRef.current.style.cursor = 'grab';
    scrollRef.current.style.removeProperty('user-select');
  }, []);

  const handleLinkClick = useCallback((event) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  }, []);

  if (!related.length || !cluster) return null;

  return (
    <section
      className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04] ${className}`}
      aria-label="연관 여행지"
    >
      <style>{`
        .related-spots-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgb(148 163 184) rgb(226 232 240);
        }
        .related-spots-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .related-spots-scroll::-webkit-scrollbar-track {
          margin: 0 4px;
          background: rgb(226 232 240);
          border-radius: 9999px;
        }
        .related-spots-scroll::-webkit-scrollbar-thumb {
          background: rgb(100 116 139);
          border-radius: 9999px;
          border: 2px solid rgb(226 232 240);
        }
        .related-spots-scroll::-webkit-scrollbar-thumb:hover {
          background: rgb(71 85 105);
        }
      `}</style>
      <div className="mb-3">
        <p className={`${plannerMicroLabel} text-slate-500`}>
          {cluster.labelKo}
        </p>
        <p className="mt-1 text-sm font-bold text-gray-800 break-keep">
          같은 권역이지만 관문 공항·일정이 다릅니다
        </p>
        {cluster.notes ? (
          <p className={`mt-1 ${plannerCaption}`}>{cluster.notes}</p>
        ) : null}
      </div>
      <div
        ref={scrollRef}
        role="list"
        aria-label="같은 권역 여행지 목록"
        className="related-spots-scroll -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain pb-2 pt-0.5 px-1 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={endDrag}
        onMouseUp={endDrag}
        onMouseMove={handleMouseMove}
      >
        {related.map((spot) => (
          <Link
            key={spot.slug}
            role="listitem"
            to={`/place/${spot.slug}/planner`}
            draggable={false}
            onClick={handleLinkClick}
            className="flex min-w-[9.5rem] shrink-0 flex-col gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/60"
          >
            <span className="text-sm font-bold text-gray-900 break-keep">{spot.name}</span>
            {spot.name_en ? (
              <span className={`${plannerCaption} font-medium`}>{spot.name_en}</span>
            ) : null}
            {spot.gatewayIata ? (
              <span className={`mt-0.5 inline-flex items-center gap-1 ${plannerCaption} font-bold text-blue-700`}>
                <MapPin size={12} className="shrink-0" aria-hidden />
                {spot.gatewayIata}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
