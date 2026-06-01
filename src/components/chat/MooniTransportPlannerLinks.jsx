import React from 'react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  buildPlacePlannerPathWithFocus,
  resolveMooniTransportPlannerLinks,
} from '../../utils/placePlannerFocus';

const primaryClass =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-2.5 text-xs font-bold text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/50 transition-colors break-keep pointer-events-auto text-left';

const secondaryClass =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-600/50 bg-gray-800/40 px-3 py-2.5 text-xs font-bold text-gray-200 hover:border-gray-500/60 hover:bg-gray-800/70 transition-colors break-keep pointer-events-auto text-left';

/**
 * MOONi 렌터카·픽업 칩 — 공항 이동 + 교통·패스 플래너 앵커 2버튼.
 */
export default function MooniTransportPlannerLinks({
  slug = null,
  destinationName = '',
  essentialGuide = null,
  onPlannerNavigate = null,
  showHeading = true,
  className = '',
}) {
  if (!slug) return null;

  const links = resolveMooniTransportPlannerLinks(essentialGuide, destinationName);
  if (!links.length) return null;

  return (
    <div className={`space-y-2 w-full ${className}`}>
      {showHeading ? (
        <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-400/90 break-keep">
          플래너에서 확인
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {links.map((link, idx) => {
          const path = buildPlacePlannerPathWithFocus(slug, link.focusId);
          if (!path) return null;
          const buttonClass = idx === 0 ? primaryClass : secondaryClass;

          if (onPlannerNavigate) {
            return (
              <button
                key={link.focusId}
                type="button"
                onClick={() => onPlannerNavigate(path)}
                className={buttonClass}
              >
                <MapPin size={14} className="shrink-0 opacity-90" />
                <span className="flex-1">{link.label}</span>
              </button>
            );
          }

          return (
            <Link key={link.focusId} to={path} className={buttonClass}>
              <MapPin size={14} className="shrink-0 opacity-90" />
              <span className="flex-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
