import { resolveChatBookingActions } from './chatBookingResolver.js';
import {
  resolvePlannerFocusFromUserText,
  PLANNER_FOCUS_ID,
} from './placePlannerFocus.js';
import { i18n } from '../i18n/config';
import { getMooniPromptBundle, fillMooniPromptTemplate } from '../i18n/mooniPromptBundles';

const TRANSPORT_PROVIDERS = new Set([
  'trip_com',
  'twelve_go',
  'direct',
  'direct_ferries',
  'klook_ferry',
]);

const PREP_PROVIDERS = new Set(['klook', 'official', 'pre_travel']);

const TRANSPORT_TEXT_RE = /현지\s*교통|렌터카|픽업|공항\s*픽|local\s+transport|rental\s*car|pickup|airport\s+transfer|get\s+around/i;

/**
 * Gemini system prompt — 이번 턴에 실제로 렌더되는 CTA만 언급하도록 제한.
 *
 * @param {{
 *   userText: string,
 *   slug?: string | null,
 *   destinationName?: string,
 *   chatHistory?: Array<{ role?: string, text?: string }>,
 *   essentialGuide?: object | null,
 *   locale?: string,
 * }} params
 */
/**
 * Which CTA sentence block this turn needs. The server owns the sentences.
 * @returns {{ code: string, place: string }}
 */
export function resolveChatCtaCode({
  userText,
  slug = null,
  destinationName = '',
  chatHistory = [],
  essentialGuide = null,
}) {
  const booking = resolveChatBookingActions({
    userText,
    destinationName,
    slug,
    chatHistory,
    essentialGuide,
    aiReplyText: '',
  });
  const place = String(destinationName ?? '').trim();
  if (!booking.show) {
    return {
      code: TRANSPORT_TEXT_RE.test(userText) ? 'none_transport' : 'none_quiet',
      place,
    };
  }
  const hasTransport = booking.actions.some((a) => TRANSPORT_PROVIDERS.has(a.provider));
  const hasPrep = booking.actions.some((a) => PREP_PROVIDERS.has(a.provider));
  const hasTripCom = booking.actions.some((a) => a.provider === 'trip_com');
  if (!hasPrep && hasTransport) {
    return { code: hasTripCom ? 'transport_flight' : 'transport', place };
  }
  if (hasPrep && !hasTransport) {
    const focus = resolvePlannerFocusFromUserText(userText, { essentialGuide });
    if (
      focus === PLANNER_FOCUS_ID.ARRIVAL_TRANSFER ||
      focus === PLANNER_FOCUS_ID.LOCAL_TRANSPORT ||
      focus === PLANNER_FOCUS_ID.RENTAL_PICKUP
    ) {
      return { code: 'prep_transfer', place };
    }
    const targetKey =
      focus === PLANNER_FOCUS_ID.PRE_TRAVEL_CHECKLIST
        ? 'preTravel'
        : focus === PLANNER_FOCUS_ID.PREP_ACCOMMODATION
          ? 'accommodation'
          : focus === PLANNER_FOCUS_ID.PREP_FLIGHT
            ? 'flight'
            : focus === PLANNER_FOCUS_ID.PREP_SAFETY
              ? 'safety'
              : 'default';
    return { code: `prep_${targetKey}`, place };
  }
  if (hasPrep && hasTransport) {
    return { code: hasTripCom ? 'both_flight' : 'both', place };
  }
  return { code: 'shown_empty', place };
}

export function getChatCtaPromptHint({
  userText,
  slug = null,
  destinationName = '',
  chatHistory = [],
  essentialGuide = null,
  locale,
}) {
  const bundle = getMooniPromptBundle(locale ?? i18n.language);
  const cta = bundle.cta;
  const { code, place: rawPlace } = resolveChatCtaCode({
    userText,
    slug,
    destinationName,
    chatHistory,
    essentialGuide,
  });
  const place = rawPlace || cta.destinationFallback;
  const lines = ['', cta.header, cta.noTicketSearch];

  if (code === 'none_transport') {
    lines.push(
      fillMooniPromptTemplate(cta.transportOnlyPlanner, { place }),
      cta.transportOnlyHeader,
    );
    return lines.join('\n');
  }
  if (code === 'none_quiet') {
    lines.push(cta.noBookingShow, cta.plannerHeaderOnly, cta.noPhantomButtons);
    return lines.join('\n');
  }

  const hasPrep = code.startsWith('prep_') || code.startsWith('both');
  const hasTransport = code === 'transport' || code === 'transport_flight' || code.startsWith('both');
  const hasTripCom = code === 'transport_flight' || code === 'both_flight';

  if (hasPrep) lines.push(cta.prepSection);
  if (hasTransport) {
    lines.push(cta.transportSection);
    if (hasTripCom) lines.push(fillMooniPromptTemplate(cta.flightPlannerScroll, { place }));
  }
  if (!hasTransport) lines.push(cta.noTransportSection);
  if (code === 'prep_transfer') {
    lines.push(fillMooniPromptTemplate(cta.transportOnlyPlanner, { place }));
  } else if (code.startsWith('prep_') && code !== 'prep_transfer') {
    const targetKey = code.slice('prep_'.length);
    lines.push(
      fillMooniPromptTemplate(cta.prepPlannerScroll, {
        target: cta.prepTargets[targetKey] || cta.prepTargets.default,
      }),
    );
  }
  lines.push(cta.fullPlanner, cta.gateoPlannerNote);
  if (hasTransport) lines.push(cta.moreOptions);

  return lines.join('\n');
}
