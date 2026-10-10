import {
  festivalTimingStatus,
  gateoKoreaFestivalDetailUrl,
  kstTodayYmd,
  rewriteFestivalFormalEndings,
  ymdDayDelta,
} from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import {
  dropHanjaParentheticals,
  formatEnglishThenKorean,
  formatFestivalProgramLabel,
  formatNearbyPlaceLabel,
} from '../../../shared/korea/englishPlaceLabel.js';
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
  const rawOverview = plainFact(overview || intro?.overview || '');

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
      rawOverview,
      title,
      [title, venue, address, summaryFields?.fee?.text, summaryFields?.timeText, intro?.playtime, program || intro?.program]
        .filter(Boolean)
        .join(' '),
    ).join(' '),
    sceneOverview: rawOverview,
    program: String(program || intro?.program || '')
      .replace(/<[^>]+>/g, ' ')
      .trim(),
    nearbyPlaces: uniqueNames(nearbyPlaces),
    stayAreas: stayAreaNames(input.stayAreas),
  };
}

function stayAreaNames(value) {
  const list = Array.isArray(value) ? value : [];
  const names = [];
  for (const item of list) {
    const name = String(item?.name || item || '').replace(/\s+/g, ' ').trim();
    if (!name || names.includes(name)) continue;
    names.push(name);
    if (names.length >= 3) break;
  }
  return names;
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
    if (/방청|공개\s*방송|시청자/.test(sentence)) continue;
    if (titleKey.length > 4 && compactFact(sentence).includes(titleKey)) continue;
    if (!CONCRETE_FACT_RE.test(sentence)) continue;
    if (knownKey && !overviewHasNewFact(sentence, knownKey)) continue;
    if (sentence.length > 90) continue;
    kept.push(sentence);
    if (kept.length >= 2) break;
  }
  if (!kept.length) {
    const foods = foodListSentence(text);
    if (foods) kept.push(foods);
  }
  return kept;
}

/** Up to two overview lines the first answer can turn into a scene. Promo and broadcast stay out. */
function sceneOverviewFacts(text, title) {
  const strict = filterOverviewFacts(text, title, '');
  const extra = [];
  for (const sentence of splitKoSentences(text)) {
    if (strict.includes(sentence)) continue;
    if (OVERVIEW_FILLER_RE.test(sentence)) continue;
    if (/개최|주최|주관|방청|공개\s*방송|시청자|무료이며|입장료|운영\s*시간/.test(sentence)) continue;
    if (!/공연|전시|체험|의례|국수|맥주|맛보|궁궐|야시장|라이브/.test(sentence)) continue;
    let body = sentence.replace(/[.!?。]+$/, '').trim();
    if (body.length > 120) {
      const cut = body.slice(0, 120);
      const at = Math.max(cut.lastIndexOf(','), cut.lastIndexOf('·'), cut.lastIndexOf(' '));
      body = (at > 40 ? cut.slice(0, at) : cut).trim();
    }
    if (body.length < 12) continue;
    extra.push(`${body}.`);
    if (strict.length + extra.length >= 2) break;
  }
  return [...strict, ...extra].slice(0, 2);
}

function foodListSentence(text) {
  const src = String(text || '');
  if (!/맛/.test(src)) return '';
  let best = [];
  for (const match of src.matchAll(/([가-힣]{2,}(?:\s*,\s*[가-힣]{2,}){1,5})/g)) {
    const items = match[1].split(/\s*,\s*/).map((part) => part.trim()).filter((part) => (
      part.length >= 2
      && part.length <= 16
      && /국수|막국|짬뽕|옹심이|맥주|만두|커피|한우|인삼|칼국/.test(part)
    ));
    if (items.length > best.length) best = items;
  }
  if (best.length < 2) return '';
  const shown = best.slice(0, 4);
  const last = shown[shown.length - 1];
  const particle = hangulHasBatchim(last) ? '을' : '를';
  return `${shown.join(', ')}${particle} 맛보는 자리입니다.`;
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

const KO_AHEAD = ['', '하루', '이틀', '사흘', '나흘', '닷새', '엿새', '이레', '여드레', '아흐레', '열흘'];

/** Sauna, welfare, senior, and community facilities are not nearby sights. */
const NEARBY_FACILITY_RE = /사우나|찜질|목욕|복지|노인회|생활문화|주민센터|경로당|행정복지|노인정|마을회관|주민자치/;

export function isFestivalOpeningNearbyName(name) {
  const text = String(name || '').trim();
  if (!text || text.length > 40) return false;
  return !NEARBY_FACILITY_RE.test(text);
}

function briefDateRange(startYmd, endYmd, isEn) {
  if (!/^\d{8}$/.test(String(startYmd || ''))) return '';
  const sm = Number(startYmd.slice(4, 6));
  const sd = Number(startYmd.slice(6, 8));
  const end = /^\d{8}$/.test(String(endYmd || '')) ? String(endYmd) : String(startYmd);
  const em = Number(end.slice(4, 6));
  const ed = Number(end.slice(6, 8));
  const sep = isEn ? '–' : '~';
  if (String(startYmd) === end) return `${sm}/${sd}`;
  if (sm === em) return `${sm}/${sd}${sep}${ed}`;
  return `${sm}/${sd}${sep}${em}/${ed}`;
}

function koAhead(days) {
  if (days >= 1 && days <= 10) return `${KO_AHEAD[days]} 뒤`;
  return `${days}일 뒤`;
}

function streetName(venue) {
  const match = String(venue || '').match(/([가-힣]{2,12}거리)/);
  return match ? match[1] : '';
}

function isPostalAddress(text) {
  return /(?:로|길|대로)\s*\d|번길|번지|특별자치|광역시|특별시/.test(String(text || ''));
}

function shortVenue(venue) {
  if (streetName(venue)) return streetName(venue);
  let text = String(venue || '').replace(/(?:\s*(?:일원|일대|부근|인근|주변))+$/g, '').trim();
  if (!text || isPostalAddress(text)) return '';
  const parts = text.split(/\s+/).filter(Boolean);
  while (parts.length > 1 && /(?:특별시|광역시|특별자치도|시|군|구)$/.test(parts[0])) parts.shift();
  return parts.join(' ');
}

function runsIntoEvening(ctx) {
  const blob = `${ctx?.title || ''} ${ctx?.venue || ''} ${ctx?.program || ''} ${ctx?.overview || ''}`;
  if (/야간|야시장|밤시장|나이트/.test(blob)) return true;
  const times = [...String(ctx?.timeText || '').matchAll(/(\d{1,2})\s*:\s*\d{2}/g)];
  if (!times.length) return false;
  const hour = Number(times[times.length - 1][1]);
  return hour >= 19 || hour < 6;
}

function openingNearby(names) {
  const out = [];
  for (const name of names || []) {
    if (!isFestivalOpeningNearbyName(name) || out.includes(name)) continue;
    out.push(name);
    if (out.length >= 3) break;
  }
  return out;
}

function programNames(program) {
  const flat = dropHanjaParentheticals(String(program || ''))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\([^)]*\)/g, ' ');
  const names = [];
  for (const piece of flat.split(/[\n,/·]| 및 /)) {
    const name = piece
      .replace(/^\s*\d+[.)]\s*/, '')
      .replace(/^[-•]\s*/, '')
      .replace(/[()]/g, '')
      .replace(/^\s*(?:(?:메인|주요|부대|소비자\s*참여)\s*)?프로그램\s*[:：]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!name || name.length > 24) continue;
    if (OVERVIEW_FILLER_RE.test(name)) continue;
    if (/방청|공개\s*방송|시청자/.test(name)) continue;
    if (/패스|굿즈|기념품|상품권/.test(name)) continue;
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

const CURATED_TITLE_EN = new Map([
  ['궁중문화축전', 'Royal Culture Festival'],
  ['허심청브로이 옥토버페스트', 'Heosimcheong Brewery Oktoberfest'],
]);

/** Chat header: English festival name when the locale is English. */
export function festivalChatHeaderTitle(ctx, locale = 'ko') {
  const title = String(ctx?.title || '').trim();
  if (String(locale || '').slice(0, 2) !== 'en') return title;
  const bits = englishTitleBits(ctx);
  return bits.en || title;
}

function englishTitleBits(ctx) {
  const ko = String(ctx?.title || '').trim();
  const parsed = parseEngFestivalTitle(ctx?.titleEn);
  let en = String(parsed.en || '').trim();
  if (/[가-힣]/.test(stripParentheticals(en))) en = '';
  if (!en) en = CURATED_TITLE_EN.get(ko) || '';
  if (!en) en = fallbackEnglishLabel(ko);
  if (!en) return { en: '', phrase: ko };
  return { en, phrase: `${en} (${ko})` };
}

/** English label with the full Korean name in parentheses. Empty when Hangul would sit outside. */
function englishParenPair(koName, label) {
  const ko = String(koName || '').trim();
  const raw = String(label || '').trim();
  if (!ko || !raw) return '';
  let english = stripParentheticals(raw).replace(/\s+/g, ' ').trim();
  if (!english || /[가-힣]/.test(english)) return '';
  for (const [placeKo, placeEn] of PLACE_EN) {
    if (!ko.startsWith(`${placeKo} `)) continue;
    if (english.toLowerCase().startsWith(placeEn.toLowerCase())) break;
    english = `${placeEn} ${english}`;
    break;
  }
  return `${english} (${ko})`;
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
function koDateSentence(ctx, today) {
  const range = briefDateRange(ctx.eventStartDate, ctx.eventEndDate, false);
  const status = festivalTimingStatus(ctx.eventStartDate, ctx.eventEndDate, today);
  const topic = hangulHasBatchim(ctx.title) ? '은' : '는';
  let when = '';
  if (status === 'upcoming') {
    const ahead = koAhead(ymdDayDelta(today, ctx.eventStartDate));
    when = range ? `${range}, ${ahead} 시작해요` : `${ahead} 시작해요`;
  } else if (status === 'ended') {
    when = range ? `${range}, 이미 끝났어요` : '이미 끝났어요';
  } else if (status === 'ongoing') {
    when = range ? `${range}, 지금 진행 중이에요` : '지금 진행 중이에요';
  } else if (range) {
    when = `${range}에 열려요`;
  }
  return when ? `${ctx.title}${topic} ${when}.` : '';
}

function enDateSentence(ctx, today, phrase) {
  const range = briefDateRange(ctx.eventStartDate, ctx.eventEndDate, true);
  const status = festivalTimingStatus(ctx.eventStartDate, ctx.eventEndDate, today);
  if (status === 'upcoming') {
    const days = ymdDayDelta(today, ctx.eventStartDate);
    const unit = days === 1 ? 'day' : 'days';
    const when = range ? `${range} and starts in ${days} ${unit}` : `starts in ${days} ${unit}`;
    return `${phrase} runs ${when}.`;
  }
  if (status === 'ended') {
    return range ? `${phrase} ran ${range} and has ended.` : `${phrase} has ended.`;
  }
  if (status === 'ongoing') {
    return range ? `${phrase} runs ${range} and is underway.` : `${phrase} is underway.`;
  }
  return range ? `${phrase} runs ${range}.` : '';
}

function joinKo(names) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) {
    const particle = hangulHasBatchim(names[0]) ? '과' : '와';
    return `${names[0]}${particle} ${names[1]}`;
  }
  return `${names.slice(0, -1).join(', ')}, ${names[names.length - 1]}`;
}

function koProgramSentence(names, also) {
  if (!names.length) return '';
  if (names.length === 1) {
    const particle = hangulHasBatchim(names[0]) ? '이' : '가';
    return also ? `${names[0]}도 있어요.` : `${names[0]}${particle} 있어요.`;
  }
  const joined = joinKo(names);
  const last = names[names.length - 1];
  const particle = hangulHasBatchim(last) ? '이' : '가';
  return also ? `${joined}도 있어요.` : `${joined}${particle} 있어요.`;
}

function enList(labels) {
  if (labels.length <= 1) return labels[0] || '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

function enProgramLabels(names) {
  return names
    .map((name) => englishParenPair(name, formatFestivalProgramLabel(name)))
    .filter(Boolean);
}

function enProgramSentence(names, also) {
  const labels = enProgramLabels(names);
  if (!labels.length) return '';
  const list = enList(labels);
  return also ? `You can also see ${list}.` : `It includes ${list}.`;
}

function foodWords(sentence) {
  const skip = /맛보|자리|축제|대표|마음|그리고|또한|이곳|여기|동안|각종|여러/;
  const out = [];
  for (const word of String(sentence || '').match(/[가-힣]{2,}/g) || []) {
    const stem = word.replace(/(?:입니다|이에요|예요|어요|해요|을|를|와|과|은|는|이|가|도|의)$/, '');
    if (stem.length < 2 || skip.test(stem)) continue;
    if (!out.includes(stem)) out.push(stem);
  }
  return out;
}

function enOverviewSentence(fact) {
  const foods = foodWords(fact)
    .filter((name) => /국수|막국|짬뽕|옹심이|맥주|만두|커피|한우|인삼|칼국/.test(name))
    .map((name) => englishParenPair(name, formatEnglishThenKorean(name)))
    .filter(Boolean);
  if (!foods.length) return '';
  if (foods.length === 1 && /\(맥주\)$/.test(foods[0])) return '';
  const list = enList(foods);
  if (/맛보/.test(fact)) return `You can taste ${list}.`;
  if (/체험/.test(fact)) return `You can try ${list}.`;
  return `It includes ${list}.`;
}

function enSceneFacts(sentences, raw) {
  const out = [];
  for (const fact of sentences) {
    const line = enOverviewSentence(fact);
    if (line && line.length <= 160) out.push(line);
  }
  const src = `${sentences.join(' ')} ${raw || ''}`;
  if (out.length < 2 && /공연/.test(src) && /체험/.test(src)) {
    out.push('You can watch performances and try hands-on programs.');
  } else if (out.length < 2 && /라이브|공연/.test(src)) {
    out.push('You can watch a live performance.');
  }
  if (out.length < 2 && /맥주/.test(src) && !out.some((line) => /beer|taste/i.test(line))) {
    out.push('You can drink beer at this festival.');
  }
  return out.filter((line) => line.length <= 160).slice(0, 2);
}

function koAtmosphere(ctx) {
  const street = streetName(ctx.venue);
  const evening = runsIntoEvening(ctx);
  const place = shortVenue(ctx.venue);
  if (street && evening) return `${street}에서 저녁까지 이어져요.`;
  if (street) return `${street}에서 거리 축제로 열려요.`;
  if (evening && place) return `${place}에서 저녁까지 이어져요.`;
  if (evening) return '저녁까지 이어져요.';
  return '';
}

function enAtmosphere(ctx) {
  const street = streetName(ctx.venue);
  const evening = runsIntoEvening(ctx);
  const place = shortVenue(ctx.venue);
  const label = (name) => englishParenPair(name, formatEnglishThenKorean(name)) || name;
  if (street && evening) return `It continues into the evening on ${label(street)}.`;
  if (street) return `It is a street festival on ${label(street)}.`;
  if (evening && place) return `It continues into the evening at ${label(place)}.`;
  if (evening) return 'It continues into the evening.';
  return '';
}

function mergeKo(atmosphere, program) {
  if (atmosphere && program) {
    const head = atmosphere.replace(/져요\.$/, '지고').replace(/요\.$/, '고');
    return `${head}, ${program}`;
  }
  return program || atmosphere || '';
}

function mergeEn(atmosphere, program) {
  if (atmosphere && program) {
    const head = atmosphere.replace(/\.$/, '');
    const rest = program.replace(/^You can also see /, '').replace(/^It includes /, '').replace(/\.$/, '');
    return `${head}, and you can also see ${rest}.`;
  }
  return program || atmosphere || '';
}

function koNearbySentence(names, title, leadWithTitle) {
  if (!names.length) return '';
  const last = names[names.length - 1];
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')}, ${last}`;
  const particle = hangulHasBatchim(last) ? '을' : '를';
  const where = leadWithTitle ? `${title} 근처에서는` : '근처에서는';
  return `${where} ${list}${particle} 둘러볼 수 있어요.`;
}

function enNearbySentence(names, phrase, leadWithTitle) {
  const labels = names
    .map((name) => formatNearbyPlaceLabel(name))
    .filter(Boolean);
  if (!labels.length) return '';
  const list = enList(labels);
  return leadWithTitle
    ? `Near ${phrase}, you can walk to ${list}.`
    : `Nearby, you can walk to ${list}.`;
}

const FESTIVAL_CARD_SENTENCE_CAP = 5;

function fitFestivalCard(parts, closing) {
  const body = parts.filter(Boolean);
  const tail = closing ? [closing] : [];
  const room = Math.max(0, FESTIVAL_CARD_SENTENCE_CAP - tail.length);
  return [...body.slice(0, room), ...tail].join(' ');
}

function koClosingSentence(ctx, ended) {
  const url = ctx.gateoUrl;
  const linked = url ? `[축제 페이지](${url})` : '';
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

function openingPieces(ctx, today, isEn) {
  const names = programNames(ctx.program).slice(0, 3);
  const nearby = openingNearby(ctx.nearbyPlaces);
  const overview = filterOverviewFacts(ctx.overview, ctx.title, '').slice(0, 2);
  const { phrase } = isEn ? englishTitleBits(ctx) : { phrase: ctx.title };
  const date = isEn ? enDateSentence(ctx, today, phrase) : koDateSentence(ctx, today);
  const overviewSentences = isEn
    ? overview.map(enOverviewSentence).filter(Boolean)
    : overview.map(toHaeyo);
  const program = isEn
    ? enProgramSentence(names, overviewSentences.length > 0)
    : koProgramSentence(names, overviewSentences.length > 0);
  const atmosphere = isEn ? enAtmosphere(ctx) : koAtmosphere(ctx);
  let primary = overviewSentences[0] || '';
  if (!primary && program) {
    if (date) primary = program;
    else if (isEn) {
      const list = program.replace(/^It includes /, '').replace(/\.$/, '');
      primary = `${phrase} includes ${list}.`;
    } else primary = `${ctx.title}에서는 ${program}`;
  }
  const extraProgram = overviewSentences[0] ? program : '';
  const extra = isEn ? mergeEn(atmosphere, extraProgram) : mergeKo(atmosphere, extraProgram);
  const second = !extra && overviewSentences[1] ? overviewSentences[1] : '';
  const leadNearby = !date && !primary;
  const nearbySentence = isEn
    ? enNearbySentence(nearby, phrase, leadNearby)
    : koNearbySentence(nearby, ctx.title, leadNearby);
  return {
    names,
    nearby,
    overview,
    date,
    slots: [date, primary, nearbySentence, extra || second],
  };
}

export function buildFestivalMooniSentenceAnswer(festivalContext, options = {}) {
  if (!festivalContext?.title) return '';
  const isEn = String(options.locale || 'ko').slice(0, 2) === 'en';
  const today = kstTodayYmd(options.now || new Date());
  const ended = festivalTimingStatus(festivalContext.eventStartDate, festivalContext.eventEndDate, today) === 'ended';
  let { slots } = openingPieces(festivalContext, today, isEn);
  if (!slots.some(Boolean)) {
    const title = festivalContext.title;
    const phrase = isEn ? englishTitleBits(festivalContext).phrase : title;
    const copula = hangulHasBatchim(title) ? '이에요' : '예요';
    slots = [isEn ? `${phrase}.` : `${title}${copula}.`];
  }
  const closing = isEn ? enClosingSentence(festivalContext, ended) : koClosingSentence(festivalContext, ended);
  return fitFestivalCard(slots, closing);
}

function enClosingSentence(ctx, ended) {
  const url = ctx.gateoUrl;
  const linked = url ? `[the festival page](${url})` : '';
  const next = ended
    ? 'next you can look at nearby stops from ICN'
    : 'next you can plan how to get there from ICN';
  return linked
    ? `Details are on ${linked}, and ${next}.`
    : `${next.charAt(0).toUpperCase()}${next.slice(1)}.`;
}

/**
 * Facts for the festival first-answer model. Address, hours, and fees stay out.
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 * @param {{ locale?: string, now?: Date }} [options]
 */
export function buildFestivalFirstAnswerFacts(festivalContext, options = {}) {
  if (!festivalContext?.title) return null;
  const isEn = String(options.locale || 'ko').slice(0, 2) === 'en';
  const today = kstTodayYmd(options.now || new Date());
  const ended = festivalTimingStatus(festivalContext.eventStartDate, festivalContext.eventEndDate, today) === 'ended';
  const { names, nearby, overview, date } = openingPieces(festivalContext, today, isEn);
  const bits = englishTitleBits(festivalContext);
  const atmosphere = [];
  const street = streetName(festivalContext.venue);
  if (street) {
    atmosphere.push(isEn ? (englishParenPair(street, formatEnglishThenKorean(street)) || street) : street);
  }
  if (runsIntoEvening(festivalContext)) atmosphere.push(isEn ? 'continues into the evening' : '저녁까지 이어짐');
  const sceneSource = festivalContext.sceneOverview || festivalContext.overview;
  const scene = sceneOverviewFacts(sceneSource, festivalContext.title);
  const overviewFacts = (isEn
    ? enSceneFacts(scene, sceneSource)
    : scene.length ? scene : overview
  ).filter((line) => line.length <= 160).slice(0, 2);
  return {
    locale: isEn ? 'en' : 'ko',
    title: festivalContext.title,
    titleEn: bits.en ? bits.phrase : '',
    dateLine: date.replace(/\.$/, ''),
    overviewFacts,
    programs: isEn ? enProgramLabels(names) : names,
    nearby: isEn
      ? nearby.map((name) => formatNearbyPlaceLabel(name)).filter(Boolean)
      : nearby,
    atmosphere,
    closing: isEn ? enClosingSentence(festivalContext, ended) : koClosingSentence(festivalContext, ended),
    gateoUrl: festivalContext.gateoUrl || '',
  };
}

const FORMAL_RE = /습니[다까]|하십시오/;
const HAEYO_RE = /해요|예요|이에요|어요|아요|돼요|세요/;
const CLOCK_RE = /\d{1,2}\s*:\s*\d{2}/;
const FEE_RE = /입장료|입장\s*무료|admission is|the listed fee|hours are|운영\s*시간/i;
const PROMO_RE = /사랑을 받|황금빛|오신 것을 환영|welcome to/i;
const GOODS_RE = /굿즈|기념품|상품권|궁패스/;
const MODEL_OPENING_SENTENCE_CAP = 7;
const NAME_SUFFIX_RE = /[가-힣A-Za-z0-9]{0,18}(?:커피거리|해수욕장|거리|해변|시장|궁궐|향교|광장|박물관|미술관|식물원|전망대|열차|마을|정원|대회|체험관)/g;
const GENERIC_NAME = new Set(['맛집', '술집', '커피집']);

function corpusText(facts) {
  return [
    facts?.title,
    facts?.titleEn,
    facts?.dateLine,
    facts?.closing,
    ...(facts?.overviewFacts || []),
    ...(facts?.programs || []),
    ...(facts?.nearby || []),
    ...(facts?.atmosphere || []),
  ].join('\n');
}

function hangulOutsideParens(text, allowedBare = '') {
  let stripped = stripParentheticals(text).replace(/\[[^\]]*\]\([^)]*\)/g, ' ');
  if (allowedBare) stripped = stripped.split(allowedBare).join(' ');
  return /[가-힣]/.test(stripped);
}

function startsWithFestivalTitle(raw, facts) {
  const text = String(raw || '').replace(/^[\s"'「『]+/, '');
  if (facts?.locale === 'en') {
    const phrase = String(facts.titleEn || '').trim();
    const en = phrase.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (phrase && (text.startsWith(phrase) || (en && text.startsWith(en)))) return true;
    if (!phrase && facts.title && text.startsWith(facts.title)) return true;
    return false;
  }
  return text.startsWith(String(facts?.title || ''));
}

/** Place, program, and long numbers that are not in the facts. Ordinary verbs are ignored. */
function inventedFactToken(raw, facts) {
  const corpus = corpusText(facts);
  const compact = corpus.replace(/\s+/g, '');
  const known = (name) => {
    const token = String(name || '').trim();
    if (!token || GENERIC_NAME.has(token)) return true;
    return corpus.includes(token) || compact.includes(token.replace(/\s+/g, ''));
  };
  for (const match of String(raw || '').matchAll(NAME_SUFFIX_RE)) {
    const name = match[0].replace(/(?:에서|으로|까지|은|는|이|가|을|를|와|과|도|의|에|로)$/, '');
    if (!known(name)) return name;
  }
  const urlBody = String(raw || '').replace(/https?:\/\/[^\s)]+/g, ' ');
  for (const num of urlBody.match(/\d{3,}/g) || []) {
    if (!corpus.includes(num)) return num;
  }
  for (const url of String(raw || '').match(/https?:\/\/[^\s)]+/g) || []) {
    if (facts?.gateoUrl && (url === facts.gateoUrl || facts.gateoUrl.startsWith(url))) continue;
    if (facts?.closing && facts.closing.includes(url)) continue;
    return url;
  }
  return '';
}

function openingTitles(facts) {
  const titles = [];
  if (facts?.locale === 'en') {
    const phrase = String(facts.titleEn || '').trim();
    const en = phrase.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (phrase) titles.push(phrase);
    if (en && en !== phrase) titles.push(en);
  } else {
    const title = String(facts?.title || '').trim();
    if (title) titles.push(title);
  }
  return titles;
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Drop a later copy of the title, and keep the sentence that followed it. */
function dedupeRepeatedTitle(raw, facts) {
  const titles = openingTitles(facts).sort((a, b) => b.length - a.length);
  if (!titles.length) return raw;
  let out = String(raw || '');
  for (const title of titles) {
    const first = out.indexOf(title);
    if (first < 0) continue;
    const head = out.slice(0, first + title.length);
    const tail = out.slice(first + title.length).replace(
      new RegExp(`\\s+(?:The\\s+|the\\s+)?${escapeRegExp(title)}(?:에서는|에선|에서|은|는|이|가)?`, 'g'),
      '',
    );
    out = `${head}${tail}`;
  }
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim();
}

function endOfJsonObject(text) {
  if (!String(text || '').startsWith('{')) return -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** The model sometimes echoes the facts object or a code fence before the answer. */
function stripLeadingFactsEcho(text) {
  let raw = String(text || '').replace(/^\uFEFF/, '').trim();
  for (let guard = 0; guard < 4; guard += 1) {
    const before = raw;
    raw = raw.replace(/^(?:```|~~~)[^\n]*\n?/, '').trim();
    if (raw.startsWith('{')) {
      const end = endOfJsonObject(raw);
      if (end > 0) raw = raw.slice(end).trim();
    }
    raw = raw.replace(/^(?:```|~~~)\s*/, '').trim();
    if (raw === before) break;
  }
  return raw;
}

const DATE_FRAGMENT_RE = /^(\d{1,2}\/\d{1,2}(?:[~–-]\d{1,2}(?:\/\d{1,2})?)?)\.?$/;

/** «10/15~17.» becomes the short date plus the timing clause from the facts. */
function expandDateOnlyFragments(raw, facts) {
  const dateLine = String(facts?.dateLine || '').replace(/[.]+$/, '').trim();
  if (!dateLine) return raw;
  const parts = String(raw || '').split(/(?<=[.!?。])\s+/).filter((part) => part.trim());
  const mapped = parts.map((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(DATE_FRAGMENT_RE);
    if (!match) return trimmed;
    const token = match[1].replace(/[–-]/g, '~');
    const line = dateLine.replace(/[–-]/g, '~');
    const at = line.indexOf(token);
    if (at < 0) return trimmed;
    if (parts.length === 1) return /[.!?。]$/.test(dateLine) ? dateLine : `${dateLine}.`;
    let clause = line.slice(at).trim();
    if (!/[.!?。]$/.test(clause)) clause = `${clause}.`;
    return clause;
  });
  return mapped.join(' ');
}

function factProperNouns(facts) {
  const chunks = [
    facts?.titleEn,
    ...(facts?.programs || []),
    ...(facts?.nearby || []),
    ...(facts?.atmosphere || []),
    ...(facts?.overviewFacts || []),
  ];
  const nouns = new Set();
  for (const chunk of chunks) {
    const english = stripParentheticals(String(chunk || ''));
    for (const match of english.matchAll(/\b[A-Z][\w'’-]*/g)) {
      if (match[0].length >= 2) nouns.add(match[0]);
    }
    for (const match of english.matchAll(/\b[A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*)+/g)) {
      nouns.add(match[0]);
    }
  }
  return [...nouns].sort((a, b) => b.length - a.length);
}

const GENERIC_ARTICLE_WORDS = new Set([
  'Main', 'Food', 'Zone', 'Street', 'Park', 'Market', 'Beach', 'Garden', 'Plaza',
  'Palace', 'Temple', 'Noodle', 'Experience', 'Exhibition', 'Concert', 'Fireworks',
  'Hotel', 'Pairing', 'Night', 'Walk', 'Beer', 'Performance',
]);

function phraseIsGenericArticle(phrase) {
  const words = String(phrase || '').split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((word) => GENERIC_ARTICLE_WORDS.has(word));
}

/** Drop a lowercase "the" only before a capitalized fact name that is not all generic words. */
function stripTheBeforeFactNoun(raw, facts) {
  const nouns = factProperNouns(facts);
  if (!nouns.length) return raw;
  const body = nouns.map((noun) => noun.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`\\bthe (?=(?:${body})\\b)`, 'g');
  return raw.replace(re, (match, offset, source) => {
    const before = source.slice(0, offset);
    if (!before.trim() || /[.!?。]\s*$/.test(before)) return match;
    const rest = source.slice(offset + match.length);
    const noun = nouns.find((name) => {
      if (!rest.startsWith(name)) return false;
      const after = rest.charAt(name.length);
      return !after || !/[\w'’-]/u.test(after);
    });
    if (noun && phraseIsGenericArticle(noun)) return match;
    return '';
  });
}

const PERFORMANCE_WORD_RE = /트로트|댄스|콘서트|불꽃놀이|재즈|뮤지컬|오페라|발레|마당극/g;
const PERFORMANCE_PHRASE_RE = /[가-힣A-Za-z]{1,12}\s*(?:공연|퍼포먼스)/g;

/**
 * Program, performance, and number tokens in an answer that are absent from the fact corpus.
 * @param {string} answer
 * @param {string} corpus
 */
export function unsupportedFestivalFactMentions(answer, corpus) {
  const body = String(corpus || '').replace(/\s+/g, '');
  const text = String(answer || '');
  const flags = [];
  const seen = new Set();
  const add = (token) => {
    const key = String(token || '').replace(/\s+/g, '');
    if (!key || seen.has(key) || body.includes(key)) return;
    seen.add(key);
    flags.push(String(token).trim());
  };
  for (const match of text.matchAll(PERFORMANCE_PHRASE_RE)) {
    const phrase = match[0].replace(/\s+/g, '');
    const stem = phrase.replace(/(?:공연|퍼포먼스)$/, '');
    if (!stem || body.includes(phrase) || body.includes(stem)) continue;
    add(match[0]);
  }
  for (const match of text.matchAll(PERFORMANCE_WORD_RE)) {
    if (!body.includes(match[0])) add(match[0]);
  }
  const compact = text.replace(/https?:\/\/\S+/g, ' ');
  for (const match of compact.matchAll(/\d{3,}|\d{1,2}\s*(?:명|회|원|팀|곡)/g)) {
    const token = match[0];
    const num = token.match(/\d+/)?.[0] || token;
    if (!body.includes(num)) add(token);
  }
  return flags;
}

/**
 * Keep a model opening only when names, dates, and links stay inside the facts.
 * Ordinary Korean verbs and particles are not checked.
 * @param {string} text
 * @param {ReturnType<typeof buildFestivalFirstAnswerFacts>} facts
 * @param {string[]} [banned]
 */
export function acceptFestivalModelOpening(text, facts, banned = []) {
  let raw = stripLeadingFactsEcho(text);
  raw = raw.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, ' ').trim();
  raw = dedupeRepeatedTitle(raw, facts);
  raw = expandDateOnlyFragments(raw, facts);
  raw = stripTheBeforeFactNoun(raw, facts).trim();
  if (facts?.locale !== 'en') raw = rewriteFestivalFormalEndings(raw).trim();
  if (!raw || !facts?.title) return '';
  if (!startsWithFestivalTitle(raw, facts)) return '';
  if (countFestivalCardSentences(raw) > MODEL_OPENING_SENTENCE_CAP) return '';
  if (/기준/.test(raw)) return '';
  if (CLOCK_RE.test(raw)) return '';
  if (FEE_RE.test(raw)) return '';
  if (NEARBY_FACILITY_RE.test(raw)) return '';
  if (PROMO_RE.test(raw)) return '';
  if (GOODS_RE.test(raw) && !corpusText(facts).includes('궁패스') && !/굿즈|기념품|상품권/.test(corpusText(facts))) return '';
  for (const phrase of banned) {
    const bannedText = String(phrase || '').trim();
    if (bannedText.length >= 4 && raw.includes(bannedText)) return '';
  }
  if (facts.locale === 'en') {
    if (hangulOutsideParens(raw, facts.titleEn ? '' : facts.title)) return '';
  } else {
    if (FORMAL_RE.test(raw)) return '';
    if (!HAEYO_RE.test(raw)) return '';
  }
  if (inventedFactToken(raw, facts)) return '';
  if (unsupportedFestivalFactMentions(raw, corpusText(facts)).length) return '';
  if (facts.gateoUrl && !raw.includes(facts.gateoUrl)) {
    const next = `${raw} ${facts.closing || ''}`.trim();
    if (!facts.closing || countFestivalCardSentences(next) > MODEL_OPENING_SENTENCE_CAP) return '';
    raw = next;
  }
  return raw;
}

/** @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext */
export function buildFestivalMooniNeutralOpening(festivalContext) {
  return buildFestivalMooniSentenceAnswer(festivalContext, { locale: 'ko' });
}
