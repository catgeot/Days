import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';

/** 여행지별 MOONi 세션 사실. Gemini는 턴마다 stateless이므로 추출값을 system prompt에 다시 넣는다. */

const STORAGE_PREFIX = 'gateo_mooni_trip_session:v1:';
const MAX_NOTES = 6;
const MAX_NOTE_LEN = 80;

const DEPARTURE_SHORT = {
  서울: 'ICN',
  인천: 'ICN',
  김포: 'GMP',
  부산: 'PUS',
  제주: 'CJU',
  seoul: 'ICN',
  incheon: 'ICN',
  busan: 'PUS',
  jeju: 'CJU',
};

const GENERIC_CITY_ALIASES = new Set(
  [
    'paris',
    '파리',
    'london',
    '도쿄',
    'tokyo',
    'osaka',
    'rome',
    'roma',
    'seoul',
    '서울',
    'bangkok',
    '방콕',
    'singapore',
    '뉴욕',
    'new york',
    'nyc',
  ].map((s) => s.toLowerCase()),
);

function normText(value) {
  return String(value ?? '').trim();
}

function foldHay(value) {
  return normText(value).toLowerCase().replace(/\s+/g, ' ');
}

function destinationHay(destinationName) {
  return foldHay(destinationName);
}

function isAirportSpecificAlias(alias, hub) {
  const al = String(alias ?? '').trim();
  if (!al) return false;
  const lower = al.toLowerCase();
  if (GENERIC_CITY_ALIASES.has(lower)) return false;
  if (lower === hub.iata.toLowerCase()) return true;
  if (/공항|airport|orly|gaulle|heathrow|narita|haneda|김포|인천|오를리|샤를/.test(lower)) {
    return true;
  }
  if (al === hub.officialKo) return true;
  if (al.length >= 5 && /[가-힣]/.test(al) && /공항|국제/.test(al)) return true;
  if (al.length >= 8) return true;
  return false;
}

function tokenIataMatch(hay, iata) {
  const code = String(iata ?? '').trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(code)) return false;
  return new RegExp(`(?:^|[^a-z])${code}(?:[^a-z]|$)`, 'i').test(hay);
}

function aliasInHay(hay, alias) {
  const al = String(alias ?? '').trim().toLowerCase();
  if (!al) return false;
  if (al.length === 3 && /^[a-z]{3}$/.test(al)) return tokenIataMatch(hay, al);
  return hay.includes(al);
}

function hubLabel(hub) {
  if (!hub) return '';
  const ko = hub.officialKo || hub.iata;
  return `${ko}(${hub.iata})`;
}

function matchAirportInText(text, { destinationName = '', arrivalOnly = false } = {}) {
  const hay = foldHay(text);
  if (!hay) return null;
  const dest = destinationHay(destinationName);

  let best = null;
  let bestLen = 0;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    const candidates = [hub.officialKo, hub.iata, ...(hub.aliases || [])].filter(Boolean);
    for (const alias of candidates) {
      const al = String(alias).trim();
      if (!al) continue;
      if (arrivalOnly && !isAirportSpecificAlias(al, hub) && al.toLowerCase() !== hub.iata.toLowerCase()) {
        continue;
      }
      if (dest && foldHay(al) === dest) continue;
      if (!aliasInHay(hay, al)) continue;
      if (al.length >= bestLen) {
        bestLen = al.length;
        best = { iata: hub.iata, label: hubLabel(hub) };
      }
    }
  }
  return best;
}

function extractStay(text) {
  const raw = normText(text);
  if (!raw) return null;
  if (/당일치기|day\s*trip/i.test(raw)) {
    return { nights: 0, days: 1, stayLabel: '당일치기' };
  }
  const nightsDays = raw.match(/(\d+)\s*박(?:\s*(\d+)\s*일)?/);
  if (nightsDays) {
    const nights = Number(nightsDays[1]);
    const days = nightsDays[2] ? Number(nightsDays[2]) : nights + 1;
    if (nights >= 1 && nights <= 60 && days >= 1 && days <= 62) {
      return { nights, days, stayLabel: `${nights}박 ${days}일` };
    }
  }
  const enNights = raw.match(/(\d+)\s*nights?/i);
  if (enNights) {
    const nights = Number(enNights[1]);
    if (nights >= 1 && nights <= 60) {
      return { nights, days: nights + 1, stayLabel: `${nights} nights` };
    }
  }
  const daysOnly = raw.match(/(\d+)\s*(?:일\s*(?:일정|코스|여행)?|days?(?:\s+(?:trip|itinerary|plan))?)/i);
  if (daysOnly && !/90\s*\/\s*180|무비자/.test(raw)) {
    const days = Number(daysOnly[1]);
    if (days >= 1 && days <= 30) {
      return { nights: Math.max(0, days - 1), days, stayLabel: `${days}일` };
    }
  }
  return null;
}

function extractArrivalTime(text) {
  const raw = normText(text);
  if (!raw) return null;
  const hm = raw.match(
    /(?:도착|착륙|arrive(?:s|d)?(?:\s+at)?)\s*(?:은|이|가)?\s*(?:시각|시간)?\s*(?:은)?\s*(\d{1,2})\s*[:시]\s*(\d{2})?|(\d{1,2})\s*[:시]\s*(\d{2})?\s*(?:분)?\s*(?:도착|착륙|arrive)/i,
  );
  if (hm) {
    const hour = Number(hm[1] ?? hm[3]);
    const minute = hm[2] ?? hm[4] ?? '00';
    if (hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }
  const periodHour = raw.match(
    /(오전|오후|저녁|아침|밤|새벽|morning|afternoon|evening)\s*(\d{1,2})\s*(?:시|:)\s*(\d{1,2})?/i,
  );
  if (periodHour && /도착|착륙|arrive/i.test(raw)) {
    let hour = Number(periodHour[2]);
    const minute = periodHour[3] || '00';
    const period = periodHour[1].toLowerCase();
    if ((period === '오후' || period === 'afternoon' || period === 'evening') && hour > 0 && hour < 12) {
      hour += 12;
    }
    if (hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }
  const period = raw.match(
    /(?:도착|착륙).{0,12}(아침|오전|점심|오후|저녁|밤|새벽)|(아침|오전|점심|오후|저녁|밤|새벽).{0,16}(?:도착|착륙)|arrive(?:s|d)?.{0,16}(morning|afternoon|evening|night|am|pm)/i,
  );
  if (period) {
    return period[1] || period[2] || period[3];
  }
  return null;
}

function extractFlightNumber(text) {
  const match = String(text ?? '').match(/\b([A-Z]{2}|[A-Z]\d)\s?(\d{2,4})\b/i);
  if (!match) return null;
  const code = `${match[1]}${match[2]}`.toUpperCase().replace(/\s+/g, '');
  if (!/^(KE|OZ|AF|KL|LH|BA|AA|DL|UA|SQ|NH|JL|CZ|MU|CA|EY|QR|EK|TK)\d{2,4}$/.test(code)) {
    return null;
  }
  return code;
}

function extractCondition(text) {
  const raw = normText(text);
  if (!raw) return null;
  const patterns = [
    [/첫날.{0,10}가볍|가볍게\s*(?:일정|동선|가자|해)/, '첫날 가볍게'],
    [/다리.{0,8}(아프|힘|피곤)|피곤|체력.{0,6}없|휴식\s*위주/, '휴식·체력 배려'],
    [/비\s*오|우천|rainy/i, '비 오는 날'],
    [/시차|jet\s*lag/i, '시차 적응'],
    [/take it easy|easy\s+first\s+day/i, 'take it easy on day 1'],
  ];
  for (const [re, label] of patterns) {
    if (re.test(raw)) return label;
  }
  return null;
}

function extractCompanions(text) {
  const raw = normText(text);
  if (!raw) return null;
  if (/아이|어린이|kids?|with\s+child/i.test(raw)) return '아이';
  if (/부모님|시니어|parents?|elderly/i.test(raw)) return '부모님';
  if (/혼자|솔로|solo/i.test(raw)) return '혼자';
  if (/커플|연인|couple/i.test(raw)) return '커플';
  if (/가족|family/i.test(raw)) return '가족';
  return null;
}

function extractCurrentArea(text, destinationName) {
  const raw = normText(text);
  const m =
    raw.match(/지금(?:은)?\s+(.{2,24}?)에\s*(?:있어|있어요|있음|체류|머물|있어용)/) ||
    raw.match(/(?:지금은|현재)\s+(.{2,24}?)(?:에\s*(?:있어|있어요|있음)|권역)/);
  if (!m?.[1]) return null;
  const area = m[1].replace(/[은는이가을를]\s*$/, '').trim();
  if (!area || foldHay(area) === destinationHay(destinationName)) return null;
  if (area.length > 24) return null;
  return area;
}

function maybeNote(text) {
  const raw = normText(text);
  if (!raw) return null;
  if (
    !/지금|현재|다녀|갔다|갔어|내일|모레|루트|동선|코스|일정|권역|already|tomorrow|now in/i.test(
      raw,
    )
  ) {
    return null;
  }
  return raw.length > MAX_NOTE_LEN ? `${raw.slice(0, MAX_NOTE_LEN)}…` : raw;
}

function pushNote(notes, note) {
  const next = Array.isArray(notes) ? [...notes] : [];
  const clean = normText(note);
  if (!clean) return next;
  if (next.includes(clean)) return next;
  next.push(clean);
  return next.slice(-MAX_NOTES);
}

export function emptyMooniTripSession() {
  return {
    destinationName: '',
    slug: '',
    nights: null,
    days: null,
    stayLabel: '',
    arrivalIata: '',
    arrivalAirportLabel: '',
    departureIata: '',
    departureAirportLabel: '',
    arrivalTime: '',
    flightNumber: '',
    condition: '',
    companions: '',
    currentArea: '',
    notes: [],
    updatedAt: 0,
  };
}

export function hasMooniTripSessionFacts(session) {
  if (!session || typeof session !== 'object') return false;
  return Boolean(
    session.stayLabel ||
      session.nights != null ||
      session.days != null ||
      session.arrivalIata ||
      session.departureIata ||
      session.arrivalTime ||
      session.flightNumber ||
      session.condition ||
      session.companions ||
      session.currentArea ||
      (Array.isArray(session.notes) && session.notes.length > 0),
  );
}

export function extractMooniTripFacts(userText, options = {}) {
  const text = normText(userText);
  const destinationName = normText(options.destinationName);
  const session = emptyMooniTripSession();
  if (!text) return session;

  session.destinationName = destinationName;
  session.slug = normText(options.slug).toLowerCase();

  const stay = extractStay(text);
  if (stay) {
    session.nights = stay.nights;
    session.days = stay.days;
    session.stayLabel = stay.stayLabel;
  }

  const departureCtx = /에서\s*(?:가|출발|오는|오는 법)|출발|from\s+/i.test(text);
  const arrival = matchAirportInText(text, { destinationName, arrivalOnly: true });
  if (arrival && !departureCtx) {
    session.arrivalIata = arrival.iata;
    session.arrivalAirportLabel = arrival.label;
  }

  const departure = matchAirportInText(text, { destinationName, arrivalOnly: false });
  if (departure && departureCtx && departure.iata !== session.arrivalIata) {
    session.departureIata = departure.iata;
    session.departureAirportLabel = departure.label;
  } else if (departureCtx) {
    for (const [label, iata] of Object.entries(DEPARTURE_SHORT)) {
      if (foldHay(text).includes(label)) {
        session.departureIata = iata;
        session.departureAirportLabel = label;
        break;
      }
    }
  }

  const arrivalTime = extractArrivalTime(text);
  if (arrivalTime) session.arrivalTime = arrivalTime;
  const flightNumber = extractFlightNumber(text);
  if (flightNumber) session.flightNumber = flightNumber;
  const condition = extractCondition(text);
  if (condition) session.condition = condition;
  const companions = extractCompanions(text);
  if (companions) session.companions = companions;
  const currentArea = extractCurrentArea(text, destinationName);
  if (currentArea) session.currentArea = currentArea;
  const note = maybeNote(text);
  if (note) session.notes = [note];
  if (hasMooniTripSessionFacts(session)) session.updatedAt = Date.now();
  return session;
}

export function mergeMooniTripSession(base, patch) {
  const next = { ...emptyMooniTripSession(), ...(base || {}) };
  const incoming = patch || {};
  const scalarKeys = [
    'destinationName',
    'slug',
    'nights',
    'days',
    'stayLabel',
    'arrivalIata',
    'arrivalAirportLabel',
    'departureIata',
    'departureAirportLabel',
    'arrivalTime',
    'flightNumber',
    'condition',
    'companions',
    'currentArea',
  ];
  for (const key of scalarKeys) {
    const value = incoming[key];
    if (value == null || value === '') continue;
    next[key] = value;
  }
  if (Array.isArray(incoming.notes)) {
    for (const note of incoming.notes) next.notes = pushNote(next.notes, note);
  }
  if (hasMooniTripSessionFacts(incoming) || incoming.updatedAt) {
    next.updatedAt = incoming.updatedAt || Date.now();
  }
  return next;
}

export function extractMooniTripSessionFromMessages(messages, options = {}) {
  let session = emptyMooniTripSession();
  session.destinationName = normText(options.destinationName);
  session.slug = normText(options.slug).toLowerCase();
  const list = Array.isArray(messages) ? messages : [];
  for (const msg of list) {
    if (msg?.role !== 'user') continue;
    const text = typeof msg.text === 'object' ? msg.text?.text : msg.text;
    session = mergeMooniTripSession(session, extractMooniTripFacts(text, options));
  }
  return session;
}

function storageKey({ slug, destinationName }) {
  const s = normText(slug).toLowerCase();
  if (s) return `${STORAGE_PREFIX}${s}`;
  const n = foldHay(destinationName);
  if (n) return `${STORAGE_PREFIX}name:${n}`;
  return null;
}

function readJsonStore(store, key) {
  if (!store || !key) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeJsonStore(store, key, value) {
  if (!store || !key) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota
  }
}

export function loadMooniTripSession(options = {}) {
  const key = storageKey(options);
  if (!key || typeof window === 'undefined') return null;
  return (
    readJsonStore(window.sessionStorage, key) ||
    readJsonStore(window.localStorage, key) ||
    null
  );
}

export function persistMooniTripSession(session, options = {}) {
  if (!hasMooniTripSessionFacts(session) || typeof window === 'undefined') return;
  const payload = mergeMooniTripSession(emptyMooniTripSession(), session);
  const keys = new Set(
    [
      storageKey({ slug: payload.slug || options.slug, destinationName: '' }),
      storageKey({
        slug: '',
        destinationName: payload.destinationName || options.destinationName,
      }),
    ].filter(Boolean),
  );
  for (const key of keys) {
    writeJsonStore(window.sessionStorage, key, payload);
    writeJsonStore(window.localStorage, key, payload);
  }
}

export function hydrateMooniTripSession(options = {}) {
  const { messages = [], stored = null, slug = '', destinationName = '' } = options;
  const fromHistory = extractMooniTripSessionFromMessages(messages, { slug, destinationName });
  const fromStorage = loadMooniTripSession({ slug, destinationName });
  return mergeMooniTripSession(
    mergeMooniTripSession(fromHistory, fromStorage),
    stored,
  );
}

export function formatMooniTripSessionHint(session, bundle) {
  if (!hasMooniTripSessionFacts(session)) return '';
  const block = bundle?.tripSession;
  if (!block) return '';
  const fill = (template, vars = {}) =>
    Object.entries(vars).reduce(
      (out, [key, value]) => out.replaceAll(`{{${key}}}`, String(value ?? '')),
      template,
    );
  const lines = [block.header, block.priority];
  if (session.stayLabel) {
    lines.push(fill(block.stay, { label: session.stayLabel }));
  }
  if (session.arrivalAirportLabel || session.arrivalIata) {
    lines.push(
      fill(block.arrivalAirport, {
        label: session.arrivalAirportLabel || session.arrivalIata,
      }),
    );
  }
  if (session.departureAirportLabel || session.departureIata) {
    lines.push(
      fill(block.departureAirport, {
        label: session.departureAirportLabel || session.departureIata,
      }),
    );
  }
  if (session.arrivalTime) {
    lines.push(fill(block.arrivalTime, { label: session.arrivalTime }));
  }
  if (session.flightNumber) {
    lines.push(fill(block.flightNumber, { label: session.flightNumber }));
  }
  if (session.condition) {
    lines.push(fill(block.condition, { label: session.condition }));
  }
  if (session.companions) {
    lines.push(fill(block.companions, { label: session.companions }));
  }
  if (session.currentArea) {
    lines.push(fill(block.currentArea, { label: session.currentArea }));
  }
  if (Array.isArray(session.notes) && session.notes.length > 0) {
    lines.push(
      fill(block.notes, {
        notes: session.notes.map((n, i) => `${i + 1}. ${n}`).join('\n'),
      }),
    );
  }
  return `\n${lines.join('\n')}`;
}
