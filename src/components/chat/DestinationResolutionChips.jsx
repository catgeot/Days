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
}) {
  const { t, i18n } = useTranslation();

  // slug 없는 uiPlace(레소토·에스와티니 등)도 name만으로 확정 — 후보 칩으로 떨어지지 않음
  if (confirmed?.name) {
    const destLabel = localizeMooniPlaceLabel(confirmed, i18n.language);
    const departureLabel = localizeDepartureLabel(departure, i18n.language);
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {departureLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/35 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300">
            <PlaneTakeoff size={12} className="shrink-0 opacity-80" />
            {t('mooni.resolution.departure')} · {departureLabel}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-200">
          <MapPin size={12} className="shrink-0" />
          {t('mooni.resolution.destination')} · {destLabel}
        </span>
        {showPlaceLink && confirmed.slug && (
          <a
            href={`/place/${confirmed.slug}`}
            className="inline-flex items-center gap-1 rounded-full border border-gray-600 bg-gray-800/80 px-3 py-1.5 text-xs text-gray-300 hover:border-cyan-500/50 hover:text-cyan-200 transition-colors"
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
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-400 px-0.5">{t('mooni.resolution.pickDestination')}</p>
      <div className="flex flex-wrap gap-2">
        {candidates.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelectCandidate?.(c)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-100 hover:border-amber-400/60 hover:bg-amber-900/40 transition-colors"
          >
            <MapPin size={12} className="shrink-0 opacity-80" />
            {localizeMooniPlaceLabel(c, i18n.language)}
          </button>
        ))}
      </div>
    </div>
  );
}
