import React, { useMemo } from 'react';
import { ExternalLink, Ship } from 'lucide-react';
import {
  getDfRecommendations,
  partitionFerryBookings,
  resolveFerryBookings,
  resolveFerryProfile,
  resolveBookingUrl,
  resolveTwelveGoBannerLabel,
} from '../../../../../utils/ferryBookingMatch';
import TwelveGoSearchWidget from './TwelveGoSearchWidget';

const PROVIDER_BUTTON_STYLES = {
  direct: 'bg-slate-700 hover:bg-slate-800 text-white border-slate-600',
  direct_ferries: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500',
  twelve_go: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500',
  klook_ferry: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-400',
};

const FerryBookingWidget = ({ location, aiFerryData }) => {
  const slug = location?.slug;
  const bookingContext = { slug, campaign: 'planner' };
  const profile = resolveFerryProfile(slug);
  const dfRecommendations = getDfRecommendations(slug);
  const { route, bookings, fallbacks } = resolveFerryBookings(slug);

  const isCompactFerry = Boolean(profile?.twelveGoWidget);
  const allRoutes = profile?.routes ?? [];
  const showRouteList = !isCompactFerry && allRoutes.length > 1;

  const aiUrl = aiFerryData?.url?.trim?.() ?? '';
  const aiExtraBooking =
    !isCompactFerry &&
    aiUrl &&
    !bookings.some((b) => b.url === aiUrl)
      ? resolveBookingUrl({ provider: 'direct', name: '공식 예약', url: aiUrl }, bookingContext)
      : null;

  const compactDirectBookings = useMemo(
    () => bookings.filter((b) => b.provider === 'direct'),
    [bookings],
  );

  const singleRoutePartition = useMemo(
    () => partitionFerryBookings(bookings),
    [bookings],
  );

  if (!profile && !aiExtraBooking) return null;

  const renderBookingButtons = (items) => {
    if (!items.length) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((b, idx) => (
          <a
            key={idx}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${PROVIDER_BUTTON_STYLES[b.provider] ?? PROVIDER_BUTTON_STYLES.direct}`}
          >
            {b.name}
            <ExternalLink size={12} />
          </a>
        ))}
      </div>
    );
  };

  const renderRouteSection = (routeDef, resolvedBookings, { hideHeader = false } = {}) => {
    const { twelveGo, others } = partitionFerryBookings(resolvedBookings);
    if (!twelveGo && !others.length) return null;

    return (
      <div className="space-y-3">
        {!hideHeader && (
          <div>
            <p className="text-sm font-semibold text-gray-800 break-keep">{routeDef.label}</p>
            {routeDef.duration && (
              <p className="text-xs text-gray-500 mt-0.5">{routeDef.duration}</p>
            )}
          </div>
        )}
        {twelveGo && (
          <TwelveGoSearchWidget
            slug={slug}
            targetUrl={twelveGo.url}
            routeLabel={resolveTwelveGoBannerLabel(routeDef, profile)}
          />
        )}
        {renderBookingButtons(others)}
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-3">
      {!isCompactFerry && profile?.summary && (
        <p className="text-xs text-gray-600 leading-relaxed break-keep">{profile.summary}</p>
      )}

      {dfRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <h4 className="font-semibold text-blue-900 text-sm">추천 노선</h4>
          </div>
          <ul className="space-y-1.5">
            {dfRecommendations.map((tip, idx) => (
              <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span className="break-keep">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCompactFerry && (
        <>
          {singleRoutePartition.twelveGo && (
            <TwelveGoSearchWidget
              slug={slug}
              targetUrl={singleRoutePartition.twelveGo.url}
              routeLabel={resolveTwelveGoBannerLabel(route, profile)}
            />
          )}
          {renderBookingButtons(compactDirectBookings)}
        </>
      )}

      {!isCompactFerry && showRouteList && (
        <div className="space-y-4">
          {allRoutes.map((r) => {
            const routeBookings = (r.bookings ?? [])
              .map((b) => resolveBookingUrl(b, bookingContext))
              .filter((b) => b.url);
            const section = renderRouteSection(r, routeBookings);
            if (!section) return null;
            return (
              <div key={r.id} className="border border-gray-200 rounded-xl p-3 bg-white space-y-3">
                {section}
              </div>
            );
          })}
        </div>
      )}

      {!isCompactFerry && !showRouteList && route && (
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          {renderRouteSection(route, bookings, { hideHeader: false })}
        </div>
      )}

      {aiExtraBooking?.url && renderBookingButtons([aiExtraBooking])}

      {!isCompactFerry && fallbacks.length > 0 && (
        <div className="pt-1">
          <p className="text-xs text-gray-500 mb-2">기타 페리 검색</p>
          {renderBookingButtons(fallbacks)}
        </div>
      )}

      {!isCompactFerry && !showRouteList && bookings.some((b) => b.provider === 'direct_ferries') && (
        <p className="text-xs text-gray-500 text-center leading-relaxed break-keep">
          Direct Ferries 제휴 링크 · 예약 시 사이트 운영에 도움이 됩니다.
        </p>
      )}

      {!isCompactFerry && !showRouteList && !bookings.length && !aiExtraBooking && (
        <a
          href={resolveBookingUrl({ provider: 'klook_ferry', name: 'Klook 페리' }, bookingContext).url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 rounded-xl p-5 shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Ship className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Klook 페리</h3>
                  <p className="text-white/90 text-xs mt-0.5">전 세계 페리·쾌속선 통합 예약</p>
                </div>
              </div>
              <span className="bg-white text-orange-600 px-3 py-1.5 rounded-lg font-bold text-xs group-hover:bg-orange-50">
                검색 →
              </span>
            </div>
          </div>
        </a>
      )}
    </div>
  );
};

export default FerryBookingWidget;
