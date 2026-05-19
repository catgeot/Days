import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { getClusterForSlug, getRelatedTravelSpots } from '../../utils/travelSpotClusters.js';
import { getPlaceStableKey } from '../../utils/travelSpotResolve.js';

/**
 * 같은 권역·다른 관문 여행지 교차 링크 (PlannerTab 배너 아래)
 */
export default function RelatedTravelSpots({ location, className = '' }) {
  const currentSlug = getPlaceStableKey(location);
  const related = useMemo(() => getRelatedTravelSpots(currentSlug), [currentSlug]);
  const cluster = useMemo(() => getClusterForSlug(currentSlug), [currentSlug]);

  if (!related.length || !cluster) return null;

  return (
    <section
      className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04] ${className}`}
      aria-label="연관 여행지"
    >
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {cluster.labelKo}
        </p>
        <p className="mt-1 text-sm font-bold text-gray-800 break-keep">
          같은 권역이지만 관문 공항·일정이 다릅니다
        </p>
        {cluster.notes ? (
          <p className="mt-1 text-xs text-gray-500 break-keep">{cluster.notes}</p>
        ) : null}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {related.map((spot) => (
          <Link
            key={spot.slug}
            to={`/place/${spot.slug}/planner`}
            className="flex min-w-[9.5rem] shrink-0 flex-col gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/60"
          >
            <span className="text-sm font-bold text-gray-900 break-keep">{spot.name}</span>
            {spot.name_en ? (
              <span className="text-[11px] font-medium text-gray-500 break-keep">{spot.name_en}</span>
            ) : null}
            {spot.gatewayIata ? (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
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
