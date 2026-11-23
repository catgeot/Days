import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, ExternalLink, PlaneTakeoff } from 'lucide-react';
import { localizeMooniPlaceLabel } from '../../pages/Home/lib/placeChatIntro';
import { localizeDepartureLabel } from '../../pages/Home/lib/flightCinemaOriginOptions';

/**
 * MOONi 채팅 — 목적지 확인·후보·출발지·PlaceCard 칩 (M1)
 */
export default function DestinationResolutionChips({
  confirmed,
  candidates = [],
  departure,
  onSelectCandidate,
  showPlaceLink = true,
  variant = 'dark',
}) {
  const { t, i18n } = useTranslation();
  const isLight = variant === 'light';

  // slug 없는 uiPlace(레소토·에스와티니 등)도 name만으로 확정 — 후보 칩으로 떨어지지 않음
  if (confirmed?.name) {
    const destLabel = localizeMooniPlaceLabel(confirmed, i18n.language);
    const departureLabel = localizeDepartureLabel(departure, i18n.language);
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="mooni-destination-resolution">
        {departureLabel && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              isLight
                ? 'border-slate-400 bg-slate-100 text-slate-900'
                : 'border-slate-600/80 bg-slate-800/95 text-slate-50'
            }`}
          >
            <PlaneTakeoff size={12} className="shrink-0 opacity-90" aria-hidden="true" />
            {t('mooni.resolution.departure')} · {departureLabel}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            isLight
              ? 'border-cyan-700 bg-cyan-50 text-cyan-950'
              : 'border-cyan-500/40 bg-cyan-950/40 text-cyan-200'
          }`}
        >
          <MapPin size={12} className="shrink-0" />
          {t('mooni.resolution.destination')} · {destLabel}
        </span>
        {showPlaceLink && confirmed.slug && (
          <a
            href={`/place/${confirmed.slug}`}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              isLight
                ? 'border-slate-300 bg-white text-slate-800 hover:border-cyan-700 hover:text-cyan-900'
                : 'border-gray-600 bg-gray-800/80 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-200'
            }`}
          >
            {t('mooni.resolution.viewInfo', { name: destLabel })}
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    );
  }

  if (!candidates?.length) return null;

  return (
    <div className="mt-3 space-y-2" data-testid="mooni-destination-resolution">
      <p className={`text-xs px-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
        {t('mooni.resolution.pickDestination')}
      </p>
      <div className="flex flex-wrap gap-2">
        {candidates.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelectCandidate?.(c)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              isLight
                ? 'border-amber-600 bg-amber-50 text-amber-950 hover:bg-amber-100'
                : 'border-amber-500/35 bg-amber-950/30 text-amber-100 hover:border-amber-400/60 hover:bg-amber-900/40'
            }`}
          >
            <MapPin size={12} className="shrink-0 opacity-80" />
            {localizeMooniPlaceLabel(c, i18n.language)}
          </button>
        ))}
      </div>
    </div>
  );
}
