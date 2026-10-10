import React from 'react';

export const FESTIVAL_NOT_FOUND_TOAST = '축제 정보를 찾을 수 없어요';
export const ENDED_FESTIVAL_BADGE = '종료된 축제';

function pickStr(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function ymd8(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(0, 8) : '';
}

function rowBody(row) {
  return row && typeof row === 'object' && Object.keys(row).length > 0 ? row : null;
}

/**
 * festivalDetail intro/common → list-shaped item.
 * Fails only when the payload is unusable (ok:false, or neither intro nor common).
 * @param {object | null | undefined} detail
 * @returns {object | null}
 */
export function festivalItemFromDetail(detail) {
  if (!detail || detail.ok === false) return null;
  const intro = rowBody(detail.intro);
  const common = rowBody(detail.common);
  if (!intro && !common) return null;

  const contentId = pickStr(
    detail.contentId,
    detail.contentid,
    common?.contentId,
    common?.contentid,
    intro?.contentId,
    intro?.contentid,
  );
  if (!/^\d{1,32}$/.test(contentId)) return null;

  const firstimage = pickStr(
    common?.firstimage,
    common?.firstImage,
    intro?.firstimage,
    intro?.firstImage,
    common?.firstimage2,
    intro?.firstimage2,
  );

  return {
    contentId,
    title: pickStr(common?.title, intro?.title),
    eventStartDate: ymd8(
      pickStr(intro?.eventStartDate, intro?.eventstartdate, common?.eventStartDate, common?.eventstartdate),
    ),
    eventEndDate: ymd8(
      pickStr(intro?.eventEndDate, intro?.eventenddate, common?.eventEndDate, common?.eventenddate),
    ),
    addr1: pickStr(common?.addr1, intro?.addr1),
    mapx: pickStr(common?.mapx, intro?.mapx),
    mapy: pickStr(common?.mapy, intro?.mapy),
    firstimage,
    imageUrl: firstimage,
    tel: pickStr(common?.tel, intro?.tel, intro?.sponsor1tel, intro?.sponsor1Tel),
    contentTypeId: '15',
  };
}

/**
 * Calendar day in Asia/Seoul, yyyymmdd.
 * @param {Date | string | number} [now]
 */
export function todayYmdKst(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return `${year}${month}${day}`;
}

/**
 * Ended when eventEndDate is a real day strictly before today (KST).
 * Missing/invalid end dates stay open so ongoing rows are unchanged.
 * @param {unknown} eventEndDate
 * @param {Date | string | number} [now]
 */
export function isFestivalEnded(eventEndDate, now = new Date()) {
  const end = ymd8(eventEndDate);
  const today = todayYmdKst(now);
  if (!/^\d{8}$/.test(end) || !/^\d{8}$/.test(today)) return false;
  return end < today;
}

export function FestivalEndedBadge({ label = ENDED_FESTIVAL_BADGE }) {
  return React.createElement(
    'span',
    {
      'data-festival-ended': '',
      className:
        'inline-flex items-center rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-600',
    },
    label,
  );
}

/**
 * Deeplink view while the list is the only resolver.
 * List hit wins. A miss stays on the URL until detail fails.
 * @param {{
 *   festivalId?: string,
 *   items?: object[],
 *   listLoading?: boolean,
 *   phase?: 'idle' | 'loading' | 'ok' | 'miss',
 *   detail?: object | null,
 *   now?: Date | string | number,
 * }} state
 */
export function projectFestivalDeepLink(state) {
  const festivalId = String(state?.festivalId || '').trim();
  const items = Array.isArray(state?.items) ? state.items : [];
  const listItem = festivalId
    ? items.find((row) => String(row?.contentId || '') === festivalId) || null
    : null;

  if (!festivalId) {
    return {
      selected: null,
      sheet: 'closed',
      clearUrl: false,
      toast: null,
      fetch: false,
      ended: false,
      badge: '',
    };
  }

  if (listItem) {
    const ended = isFestivalEnded(listItem.eventEndDate, state?.now);
    return {
      selected: listItem,
      sheet: 'open',
      clearUrl: false,
      toast: null,
      fetch: false,
      ended,
      badge: ended ? ENDED_FESTIVAL_BADGE : '',
    };
  }

  if (state?.listLoading) {
    return {
      selected: null,
      sheet: 'closed',
      clearUrl: false,
      toast: null,
      fetch: false,
      ended: false,
      badge: '',
    };
  }

  if (state?.phase === 'miss') {
    return {
      selected: null,
      sheet: 'closed',
      clearUrl: true,
      toast: FESTIVAL_NOT_FOUND_TOAST,
      fetch: false,
      ended: false,
      badge: '',
    };
  }

  if (state?.phase === 'ok') {
    const built = festivalItemFromDetail(state?.detail);
    if (built && built.contentId === festivalId) {
      const ended = isFestivalEnded(built.eventEndDate, state?.now);
      return {
        selected: built,
        sheet: 'open',
        clearUrl: false,
        toast: null,
        fetch: false,
        ended,
        badge: ended ? ENDED_FESTIVAL_BADGE : '',
      };
    }
    return {
      selected: null,
      sheet: 'closed',
      clearUrl: true,
      toast: FESTIVAL_NOT_FOUND_TOAST,
      fetch: false,
      ended: false,
      badge: '',
    };
  }

  return {
    selected: null,
    sheet: 'loading',
    clearUrl: false,
    toast: null,
    fetch: state?.phase !== 'loading',
    ended: false,
    badge: '',
  };
}
