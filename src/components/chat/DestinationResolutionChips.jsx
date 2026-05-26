import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

/**
 * MOONi 채팅 — 목적지 확인·후보 칩 (M1)
 */
export default function DestinationResolutionChips({
  confirmed,
  candidates = [],
  onSelectCandidate,
  showPlaceLink = true,
}) {
  if (confirmed?.slug && confirmed?.name) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-200">
          <MapPin size={12} className="shrink-0" />
          {confirmed.name}
        </span>
        {showPlaceLink && (
          <a
            href={`/place/${confirmed.slug}`}
            className="inline-flex items-center gap-1 rounded-full border border-gray-600 bg-gray-800/80 px-3 py-1.5 text-xs text-gray-300 hover:border-cyan-500/50 hover:text-cyan-200 transition-colors"
          >
            PlaceCard
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    );
  }

  if (!candidates?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-400 px-0.5">이 중 어디로 가고 싶으세요?</p>
      <div className="flex flex-wrap gap-2">
        {candidates.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelectCandidate?.(c)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-100 hover:border-amber-400/60 hover:bg-amber-900/40 transition-colors"
          >
            <MapPin size={12} className="shrink-0 opacity-80" />
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
