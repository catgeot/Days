import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { isMobileDevice } from '../../../common/device';
import { plannerLinkHint } from '../readableText';
import {
  resolveFlightBookingProfile,
  resolveOfficialFlightLinks,
  shouldShowOfficialFlightBooking,
} from '../../../../../utils/flightBookingMatch';

const PROVIDER_BUTTON_STYLES = {
  united: 'bg-[#1414d2] hover:bg-[#0f0fa8] text-white border-[#1414d2]',
  direct: 'bg-slate-700 hover:bg-slate-800 text-white border-slate-600',
};

/**
 * OTA 미지원·분할 예약 — 공식 항공 링크 + bookingNote (Trip CTA와 병렬).
 */
const FlightOfficialBookingWidget = ({ location }) => {
  const profile = resolveFlightBookingProfile(location);
  const officialLinks = useMemo(() => resolveOfficialFlightLinks(location), [location]);

  if (!shouldShowOfficialFlightBooking(location) || !profile) return null;

  const note = profile.bookingNote?.trim();
  const hasLinks = officialLinks.length > 0;

  if (!note && !hasLinks) return null;

  return (
    <div className="mt-3 space-y-2.5">
      {note ? (
        <p className={`${plannerLinkHint} text-gray-600 break-keep leading-relaxed`}>{note}</p>
      ) : null}

      {hasLinks ? (
        <div className={officialLinks.length > 1 ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
          {officialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target={isMobileDevice() ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className={`flex flex-col gap-0.5 justify-center w-full px-2 py-2.5 min-h-[44px] rounded-xl transition-colors border overflow-hidden ${
                PROVIDER_BUTTON_STYLES[link.provider] ?? PROVIDER_BUTTON_STYLES.direct
              } ${officialLinks.length === 1 ? 'col-span-2' : ''}`}
              aria-label={
                link.subtext ? `${link.name}. ${link.subtext}` : `${link.name}에서 검색하기`
              }
            >
              <span className="flex items-center justify-center gap-1 min-w-0 text-[11px] md:text-xs font-semibold">
                <span className="truncate max-w-[85%]">{link.name}</span>
                <ExternalLink size={12} className="shrink-0 opacity-90" />
              </span>
              {link.subtext ? (
                <span className="text-[10px] md:text-[11px] text-center opacity-90 font-mono tracking-wide">
                  {link.subtext}
                </span>
              ) : null}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default FlightOfficialBookingWidget;
