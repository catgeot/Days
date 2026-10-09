import {
  festivalTimingStatus,
  gateoKoreaFestivalDetailUrl,
  kstTodayYmd,
  ymdDayDelta,
} from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import { parseEngFestivalTitle } from '../festivalTitleEnMerge.js';
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
    titleEn: String(item?.titleEn || '').trim(),
    overview: filterOverviewFacts(
      plainFact(overview || intro?.overview || ''),
      title,
      [title, venue, address, summaryFields?.fee?.text, summaryFields?.timeText, intro?.playtime, program || intro?.program]
        .filter(Boolean)
        .join(' '),
    ).join(' '),
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

/** Promo, superlative, and renaming sentences. Concrete noun phrases in the same sentence go with them. */
const OVERVIEW_FILLER_RE =
  /사랑을 받|대표|마음껏|황금빛|다양한 즐길거리|친숙하게|행사명이 변경|제\s*\d+\s*회|그 어느|많은 사랑|더욱|다채|풍성|잊지 못|최고의|유일|명품|감동|힐링|정취|내려놓|분주|느끼|낭만|추억/;

/** Overview lines we can say in 해요. Press endings such as 열린다 stay out. */
const OVERVIEW_SAYABLE_RE = /(?:입니다|이다|합니다|있다|해요|이에요|예요|있어요)[.!?。]?\s*$/;

/** Connective and promo verbs. A sentence needs a noun that is not already on the card. */
const OVERVIEW_GLUE_RE =
  /^(?:또한|그리고|이번|올해|당일|양일|양일간|동안|예정|펼쳐질|펼쳐|진행|안내|축제|행사|프로그램|이름|장소|기간|일대|특히|여기|이곳|함께|모두|각종|여러|다양한)$/;

const CONCRETE_FACT_RE =
  /\d|국수|막국수|칼국수|짬뽕|존|대회|체험|공연|전시|무료|해변|공원|시장|거리|한우|인삼|부스|무대|페어|커피|꽃|불꽃|야시장|원(?!도심)/;

function splitKoSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?。])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * At most two overview sentences that name a concrete thing and are not promo copy.
 * @param {string} text
 * @returns {string[]}
 */
function compactFact(value) {
  return String(value || '').replace(/[\s'’"“”「」『』]/g, '');
}

function contentStem(word) {
  return String(word || '')
    .replace(/(?:이에요|예요|어요|해요|입니다|이다|한다|있다)$/, '')
    .replace(/(?:에서는|에서|으로|로서|로|과|와|은|는|이|가|을|를|도|만|의)$/, '');
}

function overviewHasNewFact(sentence, knownKey) {
  const words = String(sentence || '').match(/[가-힣]{2,}/g) || [];
  return words.some((word) => {
    const stem = contentStem(word);
    if (stem.length < 2 || OVERVIEW_GLUE_RE.test(stem)) return false;
    return !knownKey.includes(stem);
  });
}

export function filterOverviewFacts(text, title = '', known = '') {
  const titleKey = compactFact(title);
  const knownKey = compactFact(known);
  const kept = [];
  for (const sentence of splitKoSentences(text)) {
    if (OVERVIEW_FILLER_RE.test(sentence)) continue;
    if (!OVERVIEW_SAYABLE_RE.test(sentence)) continue;
    if (/개최|주최|주관|협회|시장님|축사/.test(sentence)) continue;
    if (titleKey.length > 4 && compactFact(sentence).includes(titleKey)) continue;
    if (!CONCRETE_FACT_RE.test(sentence)) continue;
    if (knownKey && !overviewHasNewFact(sentence, knownKey)) continue;
    if (sentence.length > 90) continue;
    kept.push(sentence);
    if (kept.length >= 2) break;
  }
  return kept;
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

function statusSentence(ctx, today, isEn) {
  const status = festivalTimingStatus(ctx.eventStartDate, ctx.eventEndDate, today);
  const todayLabel = formatKstTodayLabel(today, isEn);
  if (!todayLabel || status === 'unknown') return '';
  if (status === 'upcoming') {
    const days = ymdDayDelta(today, ctx.eventStartDate);
    return isEn
      ? `As of ${todayLabel}, it starts in ${days} day${days === 1 ? '' : 's'}.`
      : `오늘 ${todayLabel} 기준으로 시작까지 ${days}일 남았어요.`;
  }
  if (status === 'ended') {
    return isEn
      ? `As of ${todayLabel}, this festival has ended.`
      : `오늘 ${todayLabel} 기준으로 이미 끝났어요.`;
  }
  return isEn
    ? `As of ${todayLabel}, this festival is underway.`
    : `오늘 ${todayLabel} 기준으로 진행 중이에요.`;
}

function programNames(program) {
  const flat = String(program || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\([^)]*\)/g, ' ');
  const names = [];
  for (const piece of flat.split(/[\n,/·]| 및 /)) {
    const name = piece
      .replace(/^\s*\d+[.)]\s*/, '')
      .replace(/^[-•]\s*/, '')
      .replace(/[()]/g, '')
      .replace(/^\s*(?:주요\s*)?프로그램\s*[:：]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!name || name.length > 24) continue;
    if (OVERVIEW_FILLER_RE.test(name)) continue;
    if (!/[가-힣]/.test(name)) continue;
    if (!names.includes(name)) names.push(name);
    if (names.length >= 4) break;
  }
  return names;
}

function toHaeyo(sentence) {
  let body = String(sentence || '').trim().replace(/[.!?。]+$/, '');
  if (/입니다$/.test(body)) {
    const stem = body.replace(/입니다$/, '');
    body = `${stem}${hangulHasBatchim(stem) ? '이에요' : '예요'}`;
  } else if (/이다$/.test(body)) {
    const stem = body.replace(/이다$/, '');
    body = `${stem}${hangulHasBatchim(stem) ? '이에요' : '예요'}`;
  } else if (/합니다$/.test(body)) {
    body = body.replace(/합니다$/, '해요');
  } else if (/있다$/.test(body)) {
    body = body.replace(/있다$/, '있어요');
  }
  return `${body}.`;
}

const PLACE_EN = [
  ['강릉', 'Gangneung'],
  ['홍천', 'Hongcheon'],
  ['제주', 'Jeju'],
  ['부산', 'Busan'],
  ['서울', 'Seoul'],
  ['경주', 'Gyeongju'],
  ['전주', 'Jeonju'],
  ['여수', 'Yeosu'],
  ['속초', 'Sokcho'],
  ['양양', 'Yangyang'],
];

function fallbackEnglishLabel(title) {
  const text = String(title || '');
  let place = '';
  for (const [ko, en] of PLACE_EN) {
    if (text.includes(ko)) {
      place = en;
      break;
    }
  }
  let kind = '';
  if (/국수/.test(text)) kind = 'Noodle Festival';
  else if (/인삼/.test(text) && /한우/.test(text)) kind = 'ginseng and Hanwoo festival';
  else if (/한우/.test(text)) kind = 'Hanwoo festival';
  else if (/커피/.test(text)) kind = 'coffee festival';
  else if (/야간/.test(text)) kind = 'night festival';
  else if (/벚꽃/.test(text)) kind = 'cherry blossom festival';
  else if (place) kind = 'festival';
  if (!kind) return '';
  const label = [place, kind].filter(Boolean).join(' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function englishTitlePhrase(ctx) {
  const ko = String(ctx?.title || '').trim();
  const parsed = parseEngFestivalTitle(ctx?.titleEn);
  let en = String(parsed.en || '').trim();
  if (/[가-힣]/.test(stripParentheticals(en))) en = '';
  if (!en) en = fallbackEnglishLabel(ko);
  if (!en) en = 'This festival';
  return `${en} (${ko})`;
}

function stripParentheticals(text) {
  let next = String(text || '');
  let prev = '';
  while (next !== prev) {
    prev = next;
    next = next.replace(/\([^()]*\)/g, '');
  }
  return next;
}

function feeClause(feeText) {
  const fee = String(feeText || '').trim();
  if (!fee) return '';
  if (/무료/.test(fee) && fee.length <= 16) return '입장료는 무료예요';
  const bare = fee.replace(/[.。]$/, '');
  return `안내된 요금은 ${bare}${hangulHasBatchim(bare) ? '이에요' : '예요'}`;
}

function englishFeeSentence(feeText) {
  const fee = String(feeText || '').trim();
  if (!fee) return '';
  if (/무료|^free$/i.test(fee.trim())) return 'Admission is free.';
  return `The listed fee is (${fee}).`;
}

function englishHours(timeText) {
  const hours = String(timeText || '').trim();
  if (!hours) return '';
  if (/[가-힣]/.test(hours)) return `Hours on file are (${hours}).`;
  return `Hours are ${hours}.`;
}

function hangulHasBatchim(title) {
  const chars = Array.from(String(title || ''));
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    const code = chars[i].codePointAt(0);
    if (!code || code < 0xac00 || code > 0xd7a3) continue;
    return (code - 0xac00) % 28 !== 0;
  }
  return false;
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
function koWhenSentence(ctx) {
  const start = formatYmdLong(ctx.eventStartDate, false);
  const end = formatYmdLong(ctx.eventEndDate || ctx.eventStartDate, false);
  const when = start && end && end !== start ? `${start}부터 ${end}까지` : start;
  const hours = String(ctx.timeText || '').trim();
  const fee = feeClause(ctx.feeText);
  if (when && hours && fee) return `${when} ${hours}에 열리고, ${fee}.`;
  if (when && hours) return `${when} ${hours}에 열려요.`;
  if (when && fee) return `${when}에 열리고, ${fee}.`;
  if (hours && fee) return `${hours}에 열리고, ${fee}.`;
  if (when) return `${when}에 열려요.`;
  if (hours) return `운영 시간은 ${hours}예요.`;
  if (fee) return `${fee}.`;
  return '';
}

function koProgramSentence(names) {
  if (!names.length) return '';
  const last = names[names.length - 1];
  const ending = hangulHasBatchim(last) ? '이에요' : '예요';
  return `안내된 프로그램 이름은 ${names.join(', ')}${ending}.`;
}

function koNearbySentence(name) {
  if (!name) return '';
  return `확인된 근처 장소는 ${name} 하나예요.`;
}

function koClosingSentence(ctx, ended) {
  const url = ctx.gateoUrl;
  const linked = url ? `[${url}](${url})` : '';
  const next = ended ? '다음으로 근처에서 들를 곳을 볼 수 있어요' : '다음으로 가는 법을 정할 수 있어요';
  if (linked) return `자세한 내용은 ${linked}에서 볼 수 있고, ${next}.`;
  return `${next}.`;
}

/**
 * Sentence count for the card. URL dots are not sentence breaks.
 * @param {string} text
 */
export function countFestivalCardSentences(text) {
  const withoutUrls = String(text || '').replace(/https?:\/\/[^\s)]+/g, '');
  return withoutUrls
    .split(/(?<=[.!?。])\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

export function buildFestivalMooniSentenceAnswer(festivalContext, options = {}) {
  if (!festivalContext?.title) return '';
  const isEn = String(options.locale || 'ko').slice(0, 2) === 'en';
  const today = kstTodayYmd(options.now || new Date());
  const ended = festivalTimingStatus(festivalContext.eventStartDate, festivalContext.eventEndDate, today) === 'ended';
  const names = programNames(festivalContext.program);
  const nearbyName = (festivalContext.nearbyPlaces || [])[0] || '';

  if (isEn) return englishFestivalCard(festivalContext, { today, ended, names, nearbyName });

  const sentences = [];
  const title = festivalContext.title;
  const place = [festivalContext.venue, festivalContext.address].filter(Boolean).join(', ');
  if (place) {
    const topic = hangulHasBatchim(title) ? '은' : '는';
    sentences.push(`${title}${topic} ${place}에서 열려요.`);
  } else {
    const subject = hangulHasBatchim(title) ? '이' : '가';
    sentences.push(`${title}${subject} 이 대화의 축제예요.`);
  }

  const when = koWhenSentence(festivalContext);
  if (when) sentences.push(when);

  const status = statusSentence(festivalContext, today, false);
  if (status) sentences.push(status);

  const program = koProgramSentence(names);
  if (program) sentences.push(program);

  const reserved = (nearbyName ? 1 : 0) + 1;
  const overviewRoom = Math.max(0, Math.min(2, 7 - sentences.length - reserved));
  const known = [title, place, festivalContext.feeText, festivalContext.timeText, names.join(' ')].join(' ');
  for (const fact of filterOverviewFacts(festivalContext.overview, title, known).slice(0, overviewRoom)) {
    sentences.push(toHaeyo(fact));
  }

  const nearby = koNearbySentence(nearbyName);
  if (nearby) sentences.push(nearby);
  sentences.push(koClosingSentence(festivalContext, ended));

  return sentences.filter(Boolean).slice(0, 7).join(' ');
}

function englishFestivalCard(ctx, { today, ended, names, nearbyName }) {
  const sentences = [];
  const phrase = englishTitlePhrase(ctx);
  const where = [ctx.venue, ctx.address].filter(Boolean).map((part) => `(${part})`);
  sentences.push(where.length ? `${phrase} is held at ${where.join(', ')}.` : `${phrase} is the festival in this chat.`);

  const start = formatYmdLong(ctx.eventStartDate, true);
  const end = formatYmdLong(ctx.eventEndDate || ctx.eventStartDate, true);
  const span = start && end && end !== start ? `${start} through ${end}` : start;
  const hours = englishHours(ctx.timeText).replace(/\.$/, '').replace(/^Hours are /i, '').replace(/^Hours on file are /i, '');
  const fee = englishFeeSentence(ctx.feeText).replace(/\.$/, '');
  if (span && hours && fee) {
    sentences.push(`It runs ${span}, ${hours}, and ${fee.charAt(0).toLowerCase()}${fee.slice(1)}.`);
  } else {
    if (span) sentences.push(`It runs ${span}.`);
    if (hours) sentences.push(englishHours(ctx.timeText));
    if (fee) sentences.push(englishFeeSentence(ctx.feeText));
  }

  const status = statusSentence(ctx, today, true);
  if (status) sentences.push(status);

  if (names.length) sentences.push(`Listed program names are (${names.join(', ')}).`);
  if (nearbyName) sentences.push(`One nearby place already on GATEO is (${nearbyName}).`);

  const url = ctx.gateoUrl;
  const linked = url ? `[${url}](${url})` : '';
  const next = ended
    ? 'Next you can look at nearby stops from ICN.'
    : 'Next you can plan how to get there from ICN.';
  sentences.push(linked ? `Details are on ${linked}. ${next}` : next);
  return sentences.filter(Boolean).join(' ');
}

/** @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext */
export function buildFestivalMooniNeutralOpening(festivalContext) {
  return buildFestivalMooniSentenceAnswer(festivalContext, { locale: 'ko' });
}
