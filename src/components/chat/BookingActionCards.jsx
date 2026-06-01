import React from 'react';
import { ExternalLink, MapPin, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import TwelveGoSearchWidget from '../PlaceCard/tabs/planner/components/TwelveGoSearchWidget';
import {
  getPartnerLinkRel,
  getPartnerLinkTarget,
} from '../PlaceCard/common/partnerNavigation';
import { normalizePlacePlannerPath } from '../../utils/placePlannerPath';
import {
  buildPlacePlannerPathWithFocus,
  getMooniPlannerCtaLabel,
  getMooniPlannerFlightGuideLabel,
  PLANNER_FOCUS_ID,
  resolvePlannerFlightSectionFocus,
} from '../../utils/placePlannerFocus';
import { useTryOpenTripcomFlightSearch } from '../PlaceCard/tabs/planner/TripcomFlightSearchContext';
import MooniTransportPlannerLinks from './MooniTransportPlannerLinks';

const TRANSPORT_PROVIDERS = new Set([
  'trip_com',
  'twelve_go',
  'direct',
  'direct_ferries',
  'klook_ferry',
]);

const PREP_PROVIDERS = new Set(['klook', 'official', 'pre_travel']);

const TRANSPORT_PROVIDER_STYLES = {
  trip_com: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500',
  direct_ferries: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500',
  direct: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
  klook_ferry: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500',
};

const PREP_PROVIDER_STYLES = {
  klook: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500',
  official: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500',
  pre_travel: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500',
};

/**
 * AI 채팅 하단 예약 CTA — §2.7 2섹션(교통·티켓 / 출발 전 준비).
 *
 * @param {{
 *   actions: Array<{ type: string, label: string, url: string, provider?: string, openFlightWidget?: boolean, routeHint?: string }>,
 *   slug?: string | null,
 *   destinationName?: string,
 *   essentialGuide?: object | null,
 *   plannerUrl?: string | null,
 *   plannerFocus?: string | null,
 *   chipId?: string | null,
 *   userText?: string,
 *   onPlannerNavigate?: (url: string) => void,
 *   className?: string,
 * }} props
 */
const BookingActionCards = ({
  actions = [],
  slug = null,
  destinationName = '',
  essentialGuide = null,
  plannerUrl = null,
  plannerFocus = null,
  chipId = null,
  userText = '',
  onPlannerNavigate = null,
  className = '',
}) => {
  const tryOpenFlightSearch = useTryOpenTripcomFlightSearch();

  if (!actions.length) return null;

  const linkTarget = getPartnerLinkTarget();
  const linkRel = getPartnerLinkRel(linkTarget);
  const plannerPath =
    normalizePlacePlannerPath(
      plannerFocus && slug
        ? buildPlacePlannerPathWithFocus(slug, plannerFocus)
        : plannerUrl
    ) ?? normalizePlacePlannerPath(plannerUrl);

  const transportActions = actions.filter(
    (a) => a.url && (TRANSPORT_PROVIDERS.has(a.provider) || !PREP_PROVIDERS.has(a.provider))
  );
  const prepActions = actions.filter(
    (a) => a.url && PREP_PROVIDERS.has(a.provider)
  );

  const tripActions = transportActions.filter((a) => a.provider === 'trip_com');
  const twelveGoActions = transportActions.filter((a) => a.provider === 'twelve_go');
  const otherTransportActions = transportActions.filter(
    (a) => a.provider !== 'twelve_go' && a.provider !== 'trip_com'
  );

  const plannerLinkClass =
    'inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 hover:underline break-keep pointer-events-auto';

  const plannerButtonClass =
    'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-2.5 text-xs font-bold text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/50 transition-colors break-keep pointer-events-auto';

  const flightLocation = slug ? { slug, name: destinationName || slug } : null;
  const flightPlannerPath = slug
    ? buildPlacePlannerPathWithFocus(slug, resolvePlannerFlightSectionFocus())
    : null;

  const renderFlightPlannerLink = () => {
    if (!flightPlannerPath) return null;

    const label = getMooniPlannerFlightGuideLabel(destinationName);

    if (onPlannerNavigate) {
      return (
        <button
          type="button"
          onClick={() => onPlannerNavigate(flightPlannerPath)}
          className={plannerButtonClass}
        >
          <MapPin size={14} className="shrink-0 opacity-90" />
          {label}
        </button>
      );
    }

    return (
      <Link to={flightPlannerPath} className={plannerButtonClass}>
        <MapPin size={14} className="shrink-0 opacity-90" />
        {label}
      </Link>
    );
  };

  const renderPlannerPrimary = () => {
    if (!plannerPath || !onPlannerNavigate) return null;
    const label = getMooniPlannerCtaLabel({
      destinationName,
      plannerFocus,
      chipId,
      userText,
    });
    return (
      <button
        type="button"
        onClick={() => onPlannerNavigate(plannerPath)}
        className={plannerButtonClass}
      >
        <MapPin size={14} className="shrink-0 opacity-90" />
        {label}
      </button>
    );
  };

  const renderTransportSection = () => {
    if (!transportActions.length) return null;

    return (
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400/90 break-keep">
          교통 · 티켓
        </p>

        {tripActions.map((action, idx) => (
          <button
            key={`trip-${idx}`}
            type="button"
            onClick={(event) => {
              if (!flightLocation) return;
              const opened = tryOpenFlightSearch(flightLocation, {
                essentialGuide,
                tracking: 'chat-flight',
                forceModal: true,
                departureIata: action.departureIata,
              });
              if (opened) {
                event.preventDefault();
              } else if (plannerPath && onPlannerNavigate) {
                event.preventDefault();
                onPlannerNavigate(
                  buildPlacePlannerPathWithFocus(slug, PLANNER_FOCUS_ID.PRE_TRAVEL_CHECKLIST) ??
                    plannerPath
                );
              }
            }}
            className={`inline-flex w-full flex-col items-stretch gap-1 rounded-lg border px-3 py-2.5 text-xs font-bold break-keep transition-colors pointer-events-auto ${TRANSPORT_PROVIDER_STYLES.trip_com}`}
          >
            <span className="inline-flex w-full items-center justify-center gap-1.5">
              <Plane size={14} className="shrink-0 opacity-90" />
              {action.label}
            </span>
            {action.routeHint ? (
              <span className="text-[10px] font-normal opacity-90 text-center">
                {action.routeHint}
              </span>
            ) : null}
          </button>
        ))}

        {tripActions.length > 0 ? renderFlightPlannerLink() : null}

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

        {otherTransportActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {otherTransportActions.map((action, idx) => (
              <a
                key={`transport-${action.provider}-${idx}`}
                href={action.url}
                target={linkTarget}
                rel={linkRel}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold break-keep transition-colors pointer-events-auto ${
                  TRANSPORT_PROVIDER_STYLES[action.provider] ??
                  'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                }`}
              >
                {action.label}
                <ExternalLink size={12} className="shrink-0 opacity-80" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPrepSection = () => {
    if (!prepActions.length) return null;

    return (
      <div className="space-y-2 rounded-lg border border-amber-500/15 bg-amber-950/20 p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400/90 break-keep">
          출발 전 준비
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {prepActions.map((action, idx) => (
            <a
              key={`prep-${action.provider}-${idx}`}
              href={action.url}
              target={linkTarget}
              rel={linkRel}
              className={`inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold break-keep transition-colors pointer-events-auto ${
                PREP_PROVIDER_STYLES[action.provider] ??
                'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
              }`}
            >
              {action.label}
              <ExternalLink size={12} className="shrink-0 opacity-80" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  const showPlannerPrimary =
    plannerPath &&
    onPlannerNavigate &&
    prepActions.length > 0 &&
    !transportActions.length &&
    chipId !== 'prep_transport';

  const showTransportPlannerLinks = chipId === 'prep_transport' && slug;

  return (
    <div className={`mt-3 space-y-2 w-full ${className}`}>
      {renderTransportSection()}
      {renderPrepSection()}
      {showTransportPlannerLinks ? (
        <MooniTransportPlannerLinks
          slug={slug}
          destinationName={destinationName}
          essentialGuide={essentialGuide}
          onPlannerNavigate={onPlannerNavigate}
          className="mt-0"
        />
      ) : null}
      {showPlannerPrimary ? renderPlannerPrimary() : null}

      {plannerPath && !showPlannerPrimary && (
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
