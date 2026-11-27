/** Card order, hrefs, and GA params for /social. Dates follow isFestivalEnded (KST, end < today). */

export const SOCIAL_LINKS_INITIAL_COUNT = 12;
export const SOCIAL_LINKS_MAX_COUNT = 30;

function ymd8(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(0, 8) : '';
}

function kstYmd(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now instanceof Date ? now : new Date(now));
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return `${year}${month}${day}`;
}

export function socialFestivalCardState(target, now = new Date()) {
  if (!target || target.type !== 'festival') return 'live';
  const today = kstYmd(now);
  const end = ymd8(target.eventEndDate);
  const start = ymd8(target.eventStartDate);
  if (/^\d{8}$/.test(end) && /^\d{8}$/.test(today) && end < today) return 'ended';
  if (/^\d{8}$/.test(start) && /^\d{8}$/.test(today) && start > today) return 'upcoming';
  return 'live';
}

export function socialCardState(card, now = new Date()) {
  return socialFestivalCardState(card?.targets?.[0], now);
}

/** Active cards stay newest-first. Ended festivals move below them. */
export function orderSocialCards(cards, now = new Date()) {
  const list = Array.isArray(cards) ? cards.filter((card) => card?.targets?.[0]) : [];
  const active = [];
  const ended = [];
  for (const card of list) {
    if (socialCardState(card, now) === 'ended') ended.push(card);
    else active.push(card);
  }
  return [...active, ...ended];
}

export function visibleSocialCards(cards, expanded, now = new Date()) {
  const ordered = orderSocialCards(cards, now).slice(0, SOCIAL_LINKS_MAX_COUNT);
  const limit = expanded ? SOCIAL_LINKS_MAX_COUNT : SOCIAL_LINKS_INITIAL_COUNT;
  return {
    orderedCount: ordered.length,
    visible: ordered.slice(0, limit),
    canMore: !expanded && ordered.length > SOCIAL_LINKS_INITIAL_COUNT,
  };
}

export function socialTargetHref(target) {
  if (!target) return '/';
  if (target.type === 'festival') {
    return `/korea?festival=${encodeURIComponent(String(target.id || ''))}`;
  }
  return `/place/${encodeURIComponent(String(target.slug || ''))}`;
}

export function formatSocialPostedDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!match) return '';
  return `${Number(match[2])}/${Number(match[3])}`;
}

export function formatSocialStartBadge(target) {
  const ymd = ymd8(target?.eventStartDate);
  if (!/^\d{8}$/.test(ymd)) return '';
  return `${Number(ymd.slice(4, 6))}.${Number(ymd.slice(6, 8))} 시작`;
}

export function socialCardPlacement(card, index, now = new Date()) {
  if (socialCardState(card, now) === 'ended') return 'ended_card';
  if (index === 0) return 'top_card';
  return 'list_card';
}

export function socialCardEventParams(card, index, now = new Date(), linkRole) {
  const primary = card.targets[0];
  const params = {
    surface: 'social_links',
    placement: socialCardPlacement(card, index, now),
    position: index + 1,
    campaign_id: card.campaignId,
    target_type: primary.type === 'festival' ? 'festival' : 'place',
    card_state: socialCardState(card, now),
  };
  if (primary.type === 'festival') params.festival_id = String(primary.id);
  else params.place_slug = String(primary.slug);
  if (linkRole) params.link_role = linkRole;
  return params;
}

export function socialSecondaryEventParams(card, index, target, now = new Date()) {
  const params = socialCardEventParams(card, index, now, 'secondary');
  if (target?.type === 'festival') {
    params.target_type = 'festival';
    params.festival_id = String(target.id);
    delete params.place_slug;
  } else if (target?.slug) {
    params.target_type = 'place';
    params.place_slug = String(target.slug);
    delete params.festival_id;
  }
  return params;
}
