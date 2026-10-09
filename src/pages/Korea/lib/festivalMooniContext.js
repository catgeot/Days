import {
  festivalTimingStatus,
  gateoKoreaFestivalDetailUrl,
  kstTodayYmd,
  ymdDayDelta,
} from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import { festivalLngLat } from '../koreaFestivalCorridors.js';

/**
 * @param {{
 *   item?: Record<string, unknown>,
 *   intro?: Record<string, unknown>,
 *   location?: Record<string, unknown> | null,
 *   homepage?: string,
 *   summaryFields?: { dateText?: string, timeText?: string, fee?: { text?: string } },
 *   overview?: string,
 *   program?: string,
 *   nearbyPlaces?: string[],
 * }} input
 */
export function buildFestivalMooniContext(input = {}) {
  const { item, intro, homepage, summaryFields, location, overview, program, nearbyPlaces } = input;
  const hubLabel = String(location?.name || location?.parentCity || '').trim();
  const title = String(item?.title || '').trim();
  const contentId = String(item?.contentId || '').trim();
  if (!title && !contentId) return null;

  const pt = festivalLngLat(item?.mapx, item?.mapy);
  const venue = String(intro?.eventplace || '').trim();
  const address = String(item?.addr1 || '').trim();

  return {
    contentId,
    title,
    gateoUrl: gateoKoreaFestivalDetailUrl(contentId),
    eventStartDate: String(item?.eventStartDate || intro?.eventstartdate || intro?.eventStartDate || '').trim(),
    eventEndDate: String(item?.eventEndDate || intro?.eventenddate || intro?.eventEndDate || '').trim(),
    dateLabel: String(summaryFields?.dateText || '').trim(),
    timeText: String(summaryFields?.timeText || intro?.playtime || '').trim(),
    feeText: String(summaryFields?.fee?.text || '').trim(),
    venue,
    address,
    lat: pt?.lat ?? null,
    lng: pt?.lng ?? null,
    homepage: String(homepage || '').trim(),
    hubLabel,
    overview: plainFact(overview || intro?.overview || ''),
    program: String(program || intro?.program || '')
      .replace(/<[^>]+>/g, ' ')
      .trim(),
    nearbyPlaces: uniqueNames(nearbyPlaces),
  };
}

function plainFact(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueNames(values) {
  const out = [];
  for (const raw of Array.isArray(values) ? values : []) {
    const name = String(raw || '').trim();
    if (!name || out.includes(name)) continue;
    out.push(name);
    if (out.length >= 6) break;
  }
  return out;
}

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatYmdLong(ymd, isEn) {
  if (!/^\d{8}$/.test(String(ymd || ''))) return '';
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  if (isEn) return `${EN_MONTHS[m - 1]} ${d}, ${y}`;
  return `${y}년 ${m}월 ${d}일`;
}

function formatKstTodayLabel(ymd, isEn) {
  const long = formatYmdLong(ymd, isEn);
  if (!long) return '';
  return isEn ? `${long} (Korea time)` : `${long}(한국시간)`;
}

function periodSentence(ctx, isEn) {
  const start = formatYmdLong(ctx.eventStartDate, isEn);
  const end = formatYmdLong(ctx.eventEndDate || ctx.eventStartDate, isEn);
  if (!start) return '';
  if (!end || end === start) {
    return isEn ? `The dates are ${start}.` : `기간은 ${start}입니다.`;
  }
  return isEn ? `The dates are ${start} through ${end}.` : `기간은 ${start}부터 ${end}까지입니다.`;
}

function statusSentence(ctx, today, isEn) {
  const status = festivalTimingStatus(ctx.eventStartDate, ctx.eventEndDate, today);
  const todayLabel = formatKstTodayLabel(today, isEn);
  if (!todayLabel || status === 'unknown') return '';
  if (status === 'upcoming') {
    const days = ymdDayDelta(today, ctx.eventStartDate);
    return isEn
      ? `As of ${todayLabel}, it starts in ${days} day${days === 1 ? '' : 's'}.`
      : `오늘 ${todayLabel} 기준으로 시작까지 ${days}일입니다.`;
  }
  if (status === 'ended') {
    return isEn
      ? `As of ${todayLabel}, this festival has ended.`
      : `오늘 ${todayLabel} 기준으로 이미 끝난 축제입니다.`;
  }
  return isEn
    ? `As of ${todayLabel}, this festival is underway.`
    : `오늘 ${todayLabel} 기준으로 진행 중입니다.`;
}

function programSentence(program, isEn) {
  const bits = String(program || '')
    .split(/\n+/)
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').replace(/^[-•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
  if (!bits.length) return '';
  const joined = bits.join(', ');
  return isEn ? `The confirmed program notes are ${joined}.` : `확인된 프로그램은 ${joined}입니다.`;
}

function ensurePeriod(text) {
  const body = String(text || '').trim();
  if (!body) return '';
  if (/[.!?。]$/.test(body)) return body;
  return `${body}.`;
}

function hangulHasBatchim(title) {
  const chars = Array.from(String(title || ''));
  const code = chars.length ? chars[chars.length - 1].codePointAt(0) : 0;
  if (!code || code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/**
 * Factual sentence opening. Invite lines are ignored so the card is not a date list.
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 * @param {string | { locale?: string, now?: Date }} [inviteOrOptions]
 * @param {{ locale?: string, now?: Date }} [maybeOptions]
 */
export function buildFestivalMooniChatOpening(festivalContext, inviteOrOptions = '', maybeOptions = {}) {
  const options =
    inviteOrOptions && typeof inviteOrOptions === 'object'
      ? inviteOrOptions
      : maybeOptions;
  return buildFestivalMooniSentenceAnswer(festivalContext, options);
}

/**
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 * @param {{ locale?: string, now?: Date }} [options]
 */
export function buildFestivalMooniSentenceAnswer(festivalContext, options = {}) {
  if (!festivalContext?.title) return '';
  const isEn = String(options.locale || 'ko').slice(0, 2) === 'en';
  const today = kstTodayYmd(options.now || new Date());
  const title = festivalContext.title;
  const place = [festivalContext.venue, festivalContext.address].filter(Boolean).join(', ');
  const sentences = [];

  if (place) {
    const topic = hangulHasBatchim(title) ? '은' : '는';
    sentences.push(
      isEn
        ? `${title} is held at ${place}.`
        : `${title}${topic} ${place}에서 열립니다.`,
    );
  } else {
    const subject = hangulHasBatchim(title) ? '이' : '가';
    sentences.push(isEn ? `${title} is the festival in this chat.` : `${title}${subject} 이 대화의 축제입니다.`);
  }

  const overview = ensurePeriod(festivalContext.overview);
  if (overview && !overview.startsWith(title)) sentences.push(overview);
  else if (overview) sentences.push(overview);

  const program = programSentence(festivalContext.program, isEn);
  if (program) sentences.push(program);

  if (festivalContext.timeText) {
    sentences.push(
      isEn
        ? `The listed hours are ${festivalContext.timeText}.`
        : `안내된 운영 시간은 ${festivalContext.timeText}입니다.`,
    );
  }
  if (festivalContext.feeText) {
    sentences.push(
      isEn
        ? `The listed fee is ${festivalContext.feeText}.`
        : `안내된 요금은 ${festivalContext.feeText}입니다.`,
    );
  }

  const status = statusSentence(festivalContext, today, isEn);
  if (status) sentences.push(status);

  const nearby = festivalContext.nearbyPlaces || [];
  if (nearby.length) {
    const list = nearby.join(', ');
    sentences.push(
      isEn
        ? `Nearby places already on GATEO are ${list}.`
        : `GATEO에 확인된 근처 장소는 ${list}입니다.`,
    );
  }

  const period = periodSentence(festivalContext, isEn);
  if (period) sentences.push(period);

  const url = festivalContext.gateoUrl;
  if (url) {
    const linked = `[${url}](${url})`;
    sentences.push(
      isEn
        ? `Details are on ${linked}.`
        : `상세는 ${linked} 에서 볼 수 있습니다.`,
    );
  }
  if (festivalContext.homepage && /^https?:\/\//i.test(festivalContext.homepage)) {
    const home = festivalContext.homepage;
    sentences.push(
      isEn
        ? `The official page URL on file is [${home}](${home}).`
        : `확인된 공식 안내 주소는 [${home}](${home}) 입니다.`,
    );
  }

  const ended = festivalTimingStatus(festivalContext.eventStartDate, festivalContext.eventEndDate, today) === 'ended';
  if (isEn) {
    sentences.push(
      ended
        ? 'Next you can look at nearby stops from ICN.'
        : 'Next you can plan how to get there from ICN.',
    );
  } else {
    sentences.push(
      ended
        ? '다음으로 근처에서 들를 곳을 볼 수 있습니다.'
        : '다음으로 가는 법을 정할 수 있습니다.',
    );
  }

  return sentences.filter(Boolean).join(' ');
}

/** @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext */
export function buildFestivalMooniNeutralOpening(festivalContext) {
  return buildFestivalMooniSentenceAnswer(festivalContext, { locale: 'ko' });
}
