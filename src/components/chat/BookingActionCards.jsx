import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import TwelveGoSearchWidget from '../PlaceCard/tabs/planner/components/TwelveGoSearchWidget';
import {
  getPartnerLinkRel,
  getPartnerLinkTarget,
} from '../PlaceCard/common/partnerNavigation';
import { normalizePlacePlannerPath } from '../../utils/placePlannerPath';

const OTHER_PROVIDER_STYLES = {
  trip_com: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500',
  direct_ferries: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500',
  direct: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
  klook_ferry: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500',
  klook: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500',
  official: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500',
  pre_travel: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500',
};

/**
 * AI 채팅 하단 12Go·페리 예약 CTA.
 *
 * @param {{
 *   actions: Array<{ type: string, label: string, url: string, provider?: string }>,
 *   slug?: string | null,
 *   plannerUrl?: string | null,
 *   onPlannerNavigate?: (url: string) => void,
 *   className?: string,
 * }} props
 */
const BookingActionCards = ({
  actions = [],
  slug = null,
  plannerUrl = null,
  onPlannerNavigate = null,
  className = '',
}) => {
  if (!actions.length) return null;

  const linkTarget = getPartnerLinkTarget();
  const linkRel = getPartnerLinkRel(linkTarget);
  const plannerPath = normalizePlacePlannerPath(plannerUrl);

  const twelveGoActions = actions.filter((a) => a.provider === 'twelve_go' && a.url);
  const tripActions = actions.filter((a) => a.provider === 'trip_com' && a.url);
  const otherActions = actions.filter(
    (a) => a.provider !== 'twelve_go' && a.provider !== 'trip_com' && a.url
  );

  const plannerLinkClass =
    'inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 hover:underline break-keep pointer-events-auto';

  return (
    <div className={`mt-3 space-y-2 w-full ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400/90 break-keep">
        예약 · 티켓 검색
      </p>

      {tripActions.map((action, idx) => (
        <a
          key={`trip-${idx}`}
          href={action.url}
          target={linkTarget}
          rel={linkRel}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-bold break-keep transition-colors pointer-events-auto ${OTHER_PROVIDER_STYLES.trip_com}`}
        >
          {action.label}
          <ExternalLink size={12} className="shrink-0 opacity-80" />
        </a>
      ))}

      {twelveGoActions.map((action, idx) => (
        <TwelveGoSearchWidget
          key={`12go-${action.routeId ?? idx}`}
          slug={slug}
          targetUrl={action.url}
          routeLabel={action.label}
          variant={twelveGoActions.length > 1 ? 'compact' : 'default'}
          showRouteLabel
          showPoweredBy={idx === twelveGoActions.length - 1}
          className="pointer-events-auto"
        />
      ))}

      {otherActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {otherActions.map((action, idx) => (
            <a
              key={`other-${action.provider}-${idx}`}
              href={action.url}
              target={linkTarget}
              rel={linkRel}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold break-keep transition-colors pointer-events-auto ${
                OTHER_PROVIDER_STYLES[action.provider] ??
                'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
              }`}
            >
              {action.label}
              <ExternalLink size={12} className="shrink-0 opacity-80" />
            </a>
          ))}
        </div>
      )}

      {plannerPath && (
        onPlannerNavigate ? (
          <button
            type="button"
            onClick={() => onPlannerNavigate(plannerPath)}
            className={`${plannerLinkClass} bg-transparent border-0 p-0 cursor-pointer text-left`}
          >
            <MapPin size={12} className="shrink-0" />
            플래너에서 더 많은 예약 옵션 보기
          </button>
        ) : (
          <Link to={plannerPath} className={plannerLinkClass}>
            <MapPin size={12} className="shrink-0" />
            플래너에서 더 많은 예약 옵션 보기
          </Link>
        )
      )}
    </div>
  );
};

export default BookingActionCards;
