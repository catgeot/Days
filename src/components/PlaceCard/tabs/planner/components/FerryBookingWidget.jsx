import React from 'react';
import { ExternalLink, Ship } from 'lucide-react';
import {
  getDfRecommendations,
  resolveFerryBookings,
  resolveFerryProfile,
  resolveBookingUrl,
} from '../../../../../utils/ferryBookingMatch';

const PROVIDER_BUTTON_STYLES = {
  direct: 'bg-slate-700 hover:bg-slate-800 text-white border-slate-600',
  direct_ferries: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500',
  twelve_go: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500',
  klook_ferry: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-400',
};

const FerryBookingWidget = ({ location, aiFerryData }) => {
  const slug = location?.slug;
  const profile = resolveFerryProfile(slug);
  const dfRecommendations = getDfRecommendations(slug);
  const { route, bookings, fallbacks } = resolveFerryBookings(slug);

  const aiUrl = aiFerryData?.url?.trim?.() ?? '';
  const aiExtraBooking =
    aiUrl && !bookings.some((b) => b.url === aiUrl)
      ? resolveBookingUrl({ provider: 'direct', name: '공식 예약', url: aiUrl })
      : null;

  const allRoutes = profile?.routes ?? [];
  const showRouteList = allRoutes.length > 1;

  if (!profile && !aiExtraBooking) return null;

  return (
    <div className="mt-4 space-y-3">
      {profile?.summary && (
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

      {showRouteList ? (
        <div className="space-y-3">
          {allRoutes.map((r) => {
            const routeBookings = (r.bookings ?? [])
              .map(resolveBookingUrl)
              .filter((b) => b.url);
            if (!routeBookings.length) return null;
            return (
              <div key={r.id} className="border border-gray-200 rounded-xl p-3 bg-white">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-800 break-keep">{r.label}</p>
                  {r.duration && (
                    <p className="text-xs text-gray-500 mt-0.5">{r.duration}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {routeBookings.map((b, idx) => (
                    <a
                      key={`${r.id}-${idx}`}
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
              </div>
            );
          })}
        </div>
      ) : (
        route && (
          <div className="border border-gray-200 rounded-xl p-3 bg-white">
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-800 break-keep">{route.label}</p>
              {route.duration && (
                <p className="text-xs text-gray-500 mt-0.5">{route.duration}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {bookings.map((b, idx) => (
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
          </div>
        )
      )}

      {aiExtraBooking?.url && (
        <a
          href={aiExtraBooking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 transition-colors"
        >
          {aiExtraBooking.name}
          <ExternalLink size={12} />
        </a>
      )}

      {fallbacks.length > 0 && showRouteList && (
        <div className="pt-1">
          <p className="text-xs text-gray-500 mb-2">기타 페리 검색</p>
          <div className="flex flex-wrap gap-2">
            {fallbacks.map((b, idx) => (
              <a
                key={idx}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${PROVIDER_BUTTON_STYLES[b.provider] ?? PROVIDER_BUTTON_STYLES.klook_ferry}`}
              >
                {b.name}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      )}

      {!showRouteList && bookings.some((b) => b.provider === 'direct_ferries') && (
        <p className="text-xs text-gray-500 text-center leading-relaxed break-keep">
          Direct Ferries 제휴 링크 · 예약 시 사이트 운영에 도움이 됩니다.
        </p>
      )}

      {!showRouteList && !bookings.length && !aiExtraBooking && (
        <a
          href={resolveBookingUrl({ provider: 'klook_ferry', name: 'Klook 페리' }).url}
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
