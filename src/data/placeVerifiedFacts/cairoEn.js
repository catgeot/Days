/** English sentences for the Cairo pilot cards. Numbers match the Korean value; unit words are English. */

const EN_VALUES = {
  'cairo:entry':
    'e-Visa eligibility depends on nationality. Check visa2egypt.gov.eg.\nApply on the government portal and pay by card.\nA tourist single entry is USD 25, and a multiple entry is USD 60.\nYour passport must have at least 6 months left on the arrival date. Bring a printed e-Visa, your travel itinerary, and your accommodation booking.',
  'cairo:airport':
    'Take a white taxi that has a meter.\nOlder black-and-white taxis have no meter, so agree the fare before you ride.\nBe careful of drivers who solicit in the arrivals hall.\nThe curbside limousine in front of the terminal is a flat fare by destination and car class A~D.\nCity buses depart only from the bus stop in the parking lot in front of Terminal 1.\nUber has a CAI pickup guide page.',
  'cairo:itinerary':
    'D1 When you arrive, use the airport-to-city way above to get into the city and rest.\nD2 Go to the Giza Plateau early for the 07:00 opening. GEM requires a timed ticket. Galleries are open until 21:00 on Wed and Sat, and until 18:00 on other days. Last entry is 1 hour before closing. For dinner, try Koshary Abou Tarek downtown.\nD3 At 09:00 go to the Egyptian Museum in Tahrir. Ticket sales end at 16:00. In the afternoon go to the Sultan Hassan Mosque, and last entry is 16:00.',
  'cairo:money-safety':
    'The currency is the Egyptian pound (EGP).\nOn the MOFA travel alert, Nile-valley cities such as Cairo are at the exercise-caution level.\nParts of the Western Desert and southern Sinai are at the reconsider-travel level, and central and northern Sinai plus the area within 30km of the Libya border have a \'leave the country\' advisory.\nA recent embassy notice (2026-09-22) says to be careful amid military tension in the Middle East and to watch out for private currency-exchange scams.\nThe consular call center is +82-2-3210-0404.',
  'grand-egyptian-museum:hours':
    'Sun, Mon, Tue, Thu, and Fri: galleries 09:00–18:00 (complex 08:30–19:00), last entry 17:00.\nWed and Sat: galleries 09:00–21:00 (complex 08:30–22:00), last entry 20:00.',
  'grand-egyptian-museum:fee':
    'Foreign adults 1,590 EGP, children and students 800 EGP.\nChildren under 6 enter free.\nPick an entry window: 08:30–11:00, 11:00–13:00, 13:00–15:00, or 15:00–17:00.',
  'grand-egyptian-museum:notes':
    'No refunds.\nValid only on the booked date and time.\nYou can enter only once and cannot come back in.\nThe ticket cannot be put in another person\'s name or transferred.\nBags larger than 40×40cm and umbrellas must be left at the cloakroom.\nOutside food and drinks are not allowed. Inside the galleries, only a small water bottle is allowed.\nTripods, selfie sticks, drones, external lights, and flash are not allowed.',
  'sultan-hassan-mosque:hours':
    'Open daily 09:00–17:00.\nLast entry is 16:00.\nLast entry in Ramadan is 15:00.',
  'sultan-hassan-mosque:fee':
    'Foreign adults 220 EGP, students 110 EGP.\nAdmission includes the Al-Rifa\'i Mosque across the street.',
  'sultan-hassan-mosque:notes':
    'Phone photos are free.\nArrive at least 1 hour before closing.\nIt is on Salah al-Din Square, opposite the Al-Rifa\'i Mosque.',
};

const SOURCE_EN = {
  '카이로국제공항 교통 안내': 'Cairo International Airport transport guide',
  'GATEO 로그북 (2026-10-03)': 'GATEO logbook (2026-10-03)',
  '외교부 여행경보': 'MOFA travel alert',
  '대사관 공지': 'Embassy notice',
  'GEM 공식 예매처': 'GEM official ticket office',
  '관광유물부': 'Ministry of Tourism and Antiquities',
  '관광유물부 예매': 'Ministry of Tourism and Antiquities tickets',
  '관광유물부 예매(egymonuments.com)': 'Ministry of Tourism and Antiquities tickets (egymonuments.com)',
  'Google 지도': 'Google Maps',
  'tickets.gem.eg (약관)': 'tickets.gem.eg (terms)',
};

const LINK_EN = {
  'GEM 공식 예매': 'Official GEM tickets',
  'Google 지도': 'Google Maps',
  '관광유물부 공식 예매': 'Official antiquities tickets',
  '공식 예매': 'Official tickets',
};

const CURRENCY = { 달러: 'USD', USD: 'USD', $: 'USD', 원: 'KRW', KRW: 'KRW', '₩': 'KRW', EGP: 'EGP' };
const UNIT = {
  개월: 'months', month: 'months', months: 'months',
  시간: 'hours', hour: 'hours', hours: 'hours',
  세: 'years', year: 'years', years: 'years',
  시: 'oclock',
  분: 'minutes', minute: 'minutes', minutes: 'minutes',
  일: 'days', day: 'days', days: 'days',
};

const TOKEN_RE = new RegExp(
  [
    String.raw`https?:\/\/[^\s)]+`,
    String.raw`\+\d{2}-\d-\d{4}-\d{4}`,
    String.raw`\d{4}-\d{2}-\d{2}`,
    String.raw`\d{1,2}:\d{2}(?:[~–-]\d{1,2}:\d{2})?`,
    String.raw`\d+×\d+cm`,
    String.raw`\d+km`,
    String.raw`(?:USD|KRW|\$|₩)\s*\d{1,3}(?:,\d{3})*`,
    String.raw`\d{1,3}(?:,\d{3})*\s*(?:개월|시간|달러|months?|hours?|years?|minutes?|days?|EGP|세|시|분|일|원)`,
    String.raw`(?<![A-Za-z])\d+(?![A-Za-z])`,
  ].join('|'),
  'g',
);

const PROPER_NOUN_PAREN = /(?:[A-Z][A-Za-z0-9'’.-]*)(?:\s+[A-Z][A-Za-z0-9'’.-]*)*\s*\([^)]*\)/g;

function normalizeToken(raw) {
  if (/^https?:\/\//.test(raw)) return `url:${raw}`;
  if (/^\+\d/.test(raw)) return `phone:${raw}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `date:${raw}`;
  if (/^\d{1,2}:\d{2}/.test(raw)) return `time:${raw.replace(/[~–—-]/g, '–')}`;
  if (/^\d+×\d+cm$/.test(raw)) return `size:${raw}`;
  const km = raw.match(/^(\d+)km$/);
  if (km) return `km:${km[1]}`;
  const prefixed = raw.match(/^(USD|KRW|\$|₩)\s*(\d{1,3}(?:,\d{3})*)$/);
  if (prefixed) return `amount:${prefixed[2].replaceAll(',', '')}:${CURRENCY[prefixed[1]]}`;
  const suffixed = raw.match(/^(\d{1,3}(?:,\d{3})*)\s*(개월|시간|달러|month|months|hour|hours|year|years|minute|minutes|day|days|EGP|세|시|분|일|원)$/);
  if (suffixed) {
    const n = suffixed[1].replaceAll(',', '');
    const code = CURRENCY[suffixed[2]] || UNIT[suffixed[2]];
    return CURRENCY[suffixed[2]] ? `amount:${n}:${code}` : `unit:${n}:${code}`;
  }
  return `num:${raw}`;
}

/** Numbers, times, amounts, and URLs. 달러↔USD/$, 개월↔months, EGP stays EGP. */
export function extractFactTokens(text) {
  return (String(text || '').match(TOKEN_RE) || []).map(normalizeToken).sort();
}

/** Hangul is allowed only inside parentheses that follow an English proper noun. */
export function hangulOutsideEnglishProperNounParens(text) {
  const stripped = String(text || '').replace(PROPER_NOUN_PAREN, ' ');
  return stripped.match(/[가-힣]/g) || [];
}

const TIME_RANGE_RE = /\d{1,2}:\d{2}\s*[~\u2013\u2014-]\s*\d{1,2}:\d{2}/g;

/** nowrap plus normal word-break, so an ancestor keep-all/break-all cannot split 11:00–13:00. */
export const TIME_RANGE_CLASS = 'whitespace-nowrap break-normal';

/** Keep a clock range on one line so 11:00–13:00 does not break after the colon. */
export function splitFactTimeRanges(text) {
  const value = String(text || '');
  const parts = [];
  let last = 0;
  for (const match of value.matchAll(TIME_RANGE_RE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: 'text', text: value.slice(last, index) });
    parts.push({ type: 'time', text: match[0] });
    last = index + match[0].length;
  }
  if (last < value.length) parts.push({ type: 'text', text: value.slice(last) });
  if (!parts.length && value) parts.push({ type: 'text', text: value });
  return parts;
}

export function factValueForLocale(slug, slot, locale) {
  const value = String(slot?.value || '');
  if (locale !== 'en') return value;
  const translated = EN_VALUES[`${slug}:${slot?.id}`];
  return translated == null ? value : translated;
}

export function sourceNameForLocale(name, locale) {
  const text = String(name || '');
  if (locale !== 'en') return text;
  return SOURCE_EN[text] || text;
}

export function linkLabelForLocale(label, locale) {
  const text = String(label || '');
  if (locale !== 'en' || !text) return text;
  return LINK_EN[text] || text;
}

export function checkedAtForLocale(checkedAt, locale) {
  const text = String(checkedAt || '');
  if (locale !== 'en') return text;
  return text.replaceAll('(시간)', '(hours)').replaceAll('(동선)', '(itinerary)');
}
