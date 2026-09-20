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

  const booking = resolveChatBookingActions({
    userText,
    destinationName,
    slug,
    chatHistory,
    essentialGuide,
    aiReplyText: '',
  });

  const lines = ['', cta.header, cta.noTicketSearch];

  const place =
    String(destinationName ?? '').trim() || cta.destinationFallback;

  if (!booking.show) {
    if (TRANSPORT_TEXT_RE.test(userText)) {
      lines.push(
        fillMooniPromptTemplate(cta.transportOnlyPlanner, { place }),
        cta.transportOnlyHeader,
      );
    } else {
      lines.push(cta.noBookingShow, cta.plannerHeaderOnly, cta.noPhantomButtons);
    }
    return lines.join('\n');
  }

  const hasTransport = booking.actions.some((a) =>
    TRANSPORT_PROVIDERS.has(a.provider),
  );
  const hasPrep = booking.actions.some((a) => PREP_PROVIDERS.has(a.provider));

  if (hasPrep) {
    lines.push(cta.prepSection);
  }
  if (hasTransport) {
    lines.push(cta.transportSection);
    if (booking.actions.some((a) => a.provider === 'trip_com')) {
      lines.push(fillMooniPromptTemplate(cta.flightPlannerScroll, { place }));
    }
  }
  if (!hasTransport) {
    lines.push(cta.noTransportSection);
  }
  if (hasPrep && !hasTransport) {
    const focus = resolvePlannerFocusFromUserText(userText, { essentialGuide });
    if (
      focus === PLANNER_FOCUS_ID.ARRIVAL_TRANSFER ||
      focus === PLANNER_FOCUS_ID.LOCAL_TRANSPORT ||
      focus === PLANNER_FOCUS_ID.RENTAL_PICKUP
    ) {
      lines.push(fillMooniPromptTemplate(cta.transportOnlyPlanner, { place }));
    } else {
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
      lines.push(
        fillMooniPromptTemplate(cta.prepPlannerScroll, {
          target: cta.prepTargets[targetKey],
        }),
      );
    }
  }
  lines.push(cta.fullPlanner, cta.gateoPlannerNote);
  if (hasTransport || (hasPrep && hasTransport)) {
    lines.push(cta.moreOptions);
  }

  return lines.join('\n');
}
