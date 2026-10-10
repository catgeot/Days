/**
 * English place label with the Korean sign name in parentheses.
 * Travelers read the English first and match the Korean on local signs.
 */

const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

const EXACT = new Map([
  ['월화거리', 'Wolhwa Street'],
  ['함평엑스포공원', 'Hampyeong Expo Park'],
  ['경포해변', 'Gyeongpo Beach'],
  ['오죽헌', 'Ojukheon'],
  ['탑동광장', 'Tapdong Plaza'],
  ['제주항', 'Jeju Port'],
  ['나이트워크', 'Night Walk'],
  ['섬夜 콘서트', 'Seomya Concert'],
  ['섬夜 불꽃놀이', 'Seomya Fireworks'],
  ['부대 행사', 'Side events'],
  ['먹거리존', 'Food Zone'],
  ['누들 경연대회', 'Noodle contest'],
]);

const ADMIN = new Map([
  ['강원특별자치도', 'Gangwon'],
  ['제주특별자치도', 'Jeju'],
  ['서울특별시', 'Seoul'],
  ['부산광역시', 'Busan'],
  ['대구광역시', 'Daegu'],
  ['인천광역시', 'Incheon'],
  ['광주광역시', 'Gwangju'],
  ['대전광역시', 'Daejeon'],
  ['울산광역시', 'Ulsan'],
  ['세종특별자치시', 'Sejong'],
  ['경기도', 'Gyeonggi'],
  ['강원도', 'Gangwon'],
  ['충청북도', 'Chungcheongbuk'],
  ['충청남도', 'Chungcheongnam'],
  ['전라북도', 'Jeonbuk'],
  ['전북특별자치도', 'Jeonbuk'],
  ['전라남도', 'Jeonnam'],
  ['경상북도', 'Gyeongbuk'],
  ['경상남도', 'Gyeongnam'],
  ['강릉시', 'Gangneung'],
  ['동래구', 'Dongnae-gu'],
  ['동래', 'Dongnae'],
  ['제주시', 'Jeju'],
  ['서귀포시', 'Seogwipo'],
  ['함평군', 'Hampyeong'],
  ['홍천군', 'Hongcheon'],
  ['부산진구', 'Busanjin'],
]);

const LEADING_CITY = new Set([
  '강릉',
  '강릉시',
  '홍천',
  '홍천군',
  '제주',
  '제주시',
  '서귀포',
  '서귀포시',
  '부산',
  '부산시',
  '서울',
  '서울시',
  '함평',
  '함평군',
  '경주',
  '전주',
  '여수',
  '속초',
  '양양',
]);

/** Nearby sights only. A hit keeps a romanized remainder; a pure syllable blob is omitted. */
const POI_GLOSSARY = [
  ['북촌한옥마을', 'Bukchon Hanok Village'],
  ['한옥마을', 'Hanok Village'],
  ['감고당길', 'Gamgodang-gil'],
  ['식물원', 'Botanical Garden'],
  ['산타열차', 'Santa Train'],
  ['향교', 'Hyanggyo'],
  ['인력거', 'Rickshaw'],
  ['동래', 'Dongnae'],
  ['동해', 'Donghae'],
  ['강릉', 'Gangneung'],
  ['금강', 'Geumgang'],
];

const REGION_SUFFIX_RE = /\s*\((?:부산|서울|대구|인천|광주|대전|울산|세종|제주|경기|강원|충북|충남|전북|전남|경북|경남)\)$/;

/** Common words inside a proper noun. Unknown Hangul is romanized, never dropped. */
const NAME_GLOSSARY = [
  ['프로그램별 상이', 'varies by program'],
  ['라이브 공연', 'live performance'],
  ['야외마당', 'outdoor yard'],
  ['비어가든', 'Beer Garden'],
  ['먹거리존', 'Food Zone'],
  ['푸드존', 'Food Zone'],
  ['경연대회', 'contest'],
  ['불꽃놀이', 'Fireworks'],
  ['나이트워크', 'Night Walk'],
  ['콘서트', 'Concert'],
  ['페어링', 'Pairing'],
  ['호텔', 'Hotel'],
  ['메인', 'Main'],
  ['푸드', 'Food'],
  ['누들', 'Noodle'],
  ['감자옹심이칼국수', 'potato hand-cut noodles'],
  ['장칼국수', 'spicy hand-cut noodles'],
  ['막국수', 'buckwheat noodles'],
  ['칼국수', 'hand-cut noodles'],
  ['짬뽕', 'spicy seafood noodles'],
  ['공연', 'performance'],
  ['체험', 'Experience'],
  ['전시', 'Exhibition'],
  ['라이브', 'live'],
  ['존', 'Zone'],
];

function romanizeSyllable(code) {
  const n = code - 0xac00;
  const cho = Math.floor(n / 588);
  const jung = Math.floor((n % 588) / 28);
  const jong = n % 28;
  return `${CHO[cho] || ''}${JUNG[jung] || ''}${JONG[jong] || ''}`;
}

function romanizeHangul(text) {
  let out = '';
  for (const ch of String(text || '')) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) out += romanizeSyllable(code);
    else if (/[A-Za-z0-9-]/.test(ch)) out += ch;
  }
  return out;
}

function capitalize(word) {
  const text = String(word || '');
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function translateAdmin(token) {
  if (ADMIN.has(token)) return ADMIN.get(token);
  const stem = token.replace(/(특별자치도|특별자치시|광역시|특별시|자치도|시|군|구)$/, '');
  if (!stem || !/[가-힣]/.test(stem)) return '';
  return capitalize(romanizeHangul(stem));
}

function translateRoad(road) {
  let suffix = '';
  let stem = road;
  if (road.endsWith('대로')) {
    suffix = '-daero';
    stem = road.slice(0, -2);
  } else if (road.endsWith('로')) {
    suffix = '-ro';
    stem = road.slice(0, -1);
  } else if (road.endsWith('길')) {
    suffix = '-gil';
    stem = road.slice(0, -1);
  }
  return `${capitalize(romanizeHangul(stem))}${suffix}`;
}

const DESCRIPTIVE = [
  ['프로그램별 상이', 'varies by program'],
  ['얼리버드 특가', 'early-bird special'],
  ['부대 행사', 'Side events'],
  ['섬夜 콘서트', 'Seomya Concert'],
  ['섬夜 불꽃놀이', 'Seomya Fireworks'],
  ['먹거리존', 'Food Zone'],
  ['푸드존', 'Food Zone'],
  ['경연대회', 'contest'],
  ['불꽃놀이', 'Fireworks'],
  ['나이트워크', 'Night Walk'],
  ['페어링', 'Pairing'],
  ['얼리버드', 'early-bird'],
  ['입장료', 'Admission'],
  ['콘서트', 'Concert'],
  ['메인', 'Main'],
  ['푸드', 'Food'],
  ['누들', 'Noodle'],
  ['체험', 'Experience'],
  ['공연', 'Performance'],
  ['전시', 'Exhibition'],
  ['유료', 'Paid'],
  ['무료', 'Free'],
  ['특가', 'special price'],
  ['존', 'Zone'],
];

const DESCRIPTIVE_RE = /프로그램|상이|유료|무료|얼리버드|특가|\d\s*원/;

/** Drop a hanja gloss in parentheses without leaving a stray space. 백(白)의 → 백의. */
export function dropHanjaParentheticals(text) {
  return String(text || '').replace(/\([\u3400-\u9fff]+\)/g, '');
}

/**
 * Translate fees and common phrases. Unknown Hangul is omitted, not romanized.
 * @param {string} raw
 */
export function translateDescriptiveKorean(raw) {
  let text = dropHanjaParentheticals(raw).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (!/[가-힣\u3400-\u9fff]/.test(text)) return text;
  text = text.replace(/(\d{1,3}(?:,\d{3})+|\d+)\s*원/g, (_, num) => {
    const value = Number(String(num).replace(/,/g, ''));
    return `${value.toLocaleString('en-US')} won`;
  });
  const phrases = [...DESCRIPTIVE].sort((a, b) => b[0].length - a[0].length);
  for (const [ko, en] of phrases) text = text.split(ko).join(` ${en} `);
  text = text.replace(/[가-힣\u3400-\u9fff]+/g, ' ');
  return text.replace(/\s+/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
}

/** Festival titles are proper nouns: Revised Romanization plus the Korean name. */
export function romanizeFestivalTitle(title) {
  const words = String(title || '')
    .replace(/[^\uac00-\ud7a3\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => capitalize(romanizeHangul(word)))
    .filter(Boolean);
  return words.join(' ');
}

function isPlaceLike(text) {
  const sign = extractSignName(text).replace(/\s+/g, '');
  if (!sign) return false;
  if (EXACT.has(sign) || EXACT.has(extractSignName(text))) return true;
  return /(?:엑스포공원|해수욕장|국립공원|테마파크|놀이공원|문화회관|공원|거리|시장|광장|해변|마을|박물관|미술관|경기장|체육관|전망대|온천|항구|포구|해안|호수|폭포|사찰|성당|궁궐|궁)$/.test(sign);
}

function isAddressLike(text) {
  return /(?:광역시|특별시|특별자치|번길|번로|[가-힣](?:로|길|대로))/.test(text)
    || /[가-힣]+(?:시|군|구)\s/.test(text);
}

function formatLooseAddress(original) {
  const spaced = original
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/([가-힣]+(?:대로|로|길))(?=\d)/g, '$1 ')
    .replace(/(\d+)(번길|번로)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = spaced.split(' ').filter(Boolean);
  const admins = [];
  const roads = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (/^\d+$/.test(token) && (tokens[i + 1] === '번길' || tokens[i + 1] === '번로')) {
      roads.push(`${token}${tokens[i + 1] === '번길' ? 'beon-gil' : 'beon-ro'}`);
      i += 1;
      continue;
    }
    if (ADMIN.has(token) || /(?:특별자치도|특별자치시|광역시|특별시|자치도|시|군|구|읍|면)$/.test(token)) {
      const label = translateAdmin(token);
      if (label) admins.push(label);
      continue;
    }
    if (/(?:대로|로|길)$/.test(token)) {
      const road = translateRoad(token);
      if (road && !/[가-힣]/.test(road)) roads.push(road);
      continue;
    }
    if (/^\d+(?:-\d+)?$/.test(token)) roads.push(token);
  }
  if (!admins.length) return '';
  const adminEn = [];
  for (const place of [...admins].reverse()) {
    if (adminEn[adminEn.length - 1] !== place) adminEn.push(place);
  }
  const english = [roads.join(' '), adminEn.join(', ')].filter(Boolean).join(', ');
  if (!english || /[가-힣\u3400-\u9fff]/.test(english)) return '';
  return `${english} (${original})`;
}

function formatEnglishAddress(original) {
  const withoutParen = original.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const match = withoutParen.match(/^(.*?)(\d+(?:-\d+)?)$/);
  if (!match) return '';
  const head = match[1].trim();
  const num = match[2];
  const roadMatch = head.match(/^(.*?)([가-힣0-9]+(?:대로|로|길))\s*$/);
  if (!roadMatch) return '';
  const roadEn = translateRoad(roadMatch[2]);
  if (!roadEn || /[가-힣]/.test(roadEn)) return '';
  const places = roadMatch[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(translateAdmin)
    .filter(Boolean);
  const ordered = [];
  for (const place of places.reverse()) {
    if (ordered[ordered.length - 1] !== place) ordered.push(place);
  }
  const english = ordered.length ? `${num} ${roadEn}, ${ordered.join(', ')}` : `${num} ${roadEn}`;
  if (/[가-힣\u3400-\u9fff]/.test(english)) return '';
  return `${english} (${original})`;
}

function formatEnglishAddressOrLoose(original) {
  return formatEnglishAddress(original) || formatLooseAddress(original);
}

function extractSignName(text) {
  let sign = text.replace(/(?:\s*(?:일원|일대|부근|인근|주변))+$/g, '').trim();
  const parts = sign.split(/\s+/).filter(Boolean);
  while (parts.length > 1 && LEADING_CITY.has(parts[0])) parts.shift();
  sign = parts.join(' ').trim();
  return sign || text;
}

function isPunctOnly(text) {
  return !/[A-Za-z0-9가-힣]/.test(String(text || ''));
}

/**
 * Glossary hits stay in English. Every other Hangul run is Revised Romanization.
 * @param {string} text
 */
function applyNameGlossary(text) {
  const gloss = [...NAME_GLOSSARY].sort((a, b) => b[0].length - a[0].length);
  const src = String(text || '');
  let i = 0;
  let out = '';
  while (i < src.length) {
    if (/\s/.test(src[i])) {
      if (out && !out.endsWith(' ')) out += ' ';
      while (i < src.length && /\s/.test(src[i])) i += 1;
      continue;
    }
    const hit = /[가-힣]/.test(src[i]) ? gloss.find(([ko]) => src.startsWith(ko, i)) : null;
    if (hit) {
      if (out && !/[\s(:]$/.test(out)) out += ' ';
      out += hit[1];
      i += hit[0].length;
      continue;
    }
    if (/[가-힣]/.test(src[i])) {
      let run = '';
      while (
        i < src.length
        && /[가-힣]/.test(src[i])
        && !gloss.some(([ko]) => src.startsWith(ko, i))
      ) {
        run += src[i];
        i += 1;
      }
      if (out && !/[\s(:]$/.test(out)) out += ' ';
      out += capitalize(romanizeHangul(run));
      continue;
    }
    out += src[i];
    i += 1;
  }
  return out.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+([,:])/g, '$1').trim();
}

/**
 * English only when every Hangul word is in the glossary. Otherwise ''.
 * @param {string} text
 */
function glossaryCompleteEnglish(text) {
  const gloss = [...NAME_GLOSSARY].sort((a, b) => b[0].length - a[0].length);
  const src = String(text || '');
  let i = 0;
  let out = '';
  while (i < src.length) {
    if (/\s/.test(src[i])) {
      if (out && !/\s$/.test(out)) out += ' ';
      while (i < src.length && /\s/.test(src[i])) i += 1;
      continue;
    }
    if (!/[가-힣]/.test(src[i])) {
      out += src[i];
      i += 1;
      continue;
    }
    const hit = gloss.find(([ko]) => src.startsWith(ko, i));
    if (!hit) return '';
    if (out && !/[\s:(]$/.test(out)) out += ' ';
    out += hit[1];
    i += hit[0].length;
  }
  return out.replace(/\s+/g, ' ').replace(/\s+([,:])/g, '$1').trim();
}

function glossaryExact(name) {
  const ko = String(name || '').trim();
  if (!ko) return '';
  if (EXACT.has(ko)) return EXACT.get(ko);
  const hit = POI_GLOSSARY.find(([token]) => token === ko);
  return hit ? hit[1] : '';
}

/**
 * Lodging area in English (한글). Unknown Hangul is omitted.
 * The festival city itself is “downtown Gangneung (강릉)”.
 * @param {string} name
 * @param {string} [placeName]
 */
export function englishLodgingAreaLabel(name, placeName = '') {
  const ko = String(name || '').replace(/\s*(?:일원|일대|부근|인근)$/g, '').replace(/\s+/g, ' ').trim();
  if (!ko) return '';
  if (!/[가-힣]/.test(ko)) return ko;
  const parts = ko.split(/\s+/).filter(Boolean);
  if (parts.length > 1 && LEADING_CITY.has(parts[0])) {
    const rest = parts.slice(1).join(' ');
    const street = glossaryExact(rest);
    if (street && !/[가-힣]/.test(street)) return `${street} (${rest})`;
  }
  const place = String(placeName || '').replace(/(?:시|군)$/, '').trim();
  const bare = ko.replace(/(?:시|군)$/, '');
  if (place && (ko === place || bare === place)) {
    const city = glossaryExact(bare) || glossaryExact(ko);
    if (city && !/[가-힣]/.test(city)) return `downtown ${city} (${ko})`;
  }
  const english = glossaryExact(ko) || glossaryExact(bare);
  if (!english || /[가-힣]/.test(english)) return '';
  return `${english} (${ko})`;
}

/** City name for an English lodging link. Empty when the glossary has no English. */
export function englishLodgingPlaceName(placeName) {
  const ko = String(placeName || '').trim();
  const bare = ko.replace(/(?:시|군)$/, '');
  const english = glossaryExact(bare) || glossaryExact(ko);
  if (!english || /[가-힣]/.test(english)) return '';
  return english;
}

/**
 * Nearby POI: glossary English, or omit a fused syllable blob.
 * Region suffixes such as (부산) stay out of the Korean parentheses.
 * @param {string} name
 */
export function formatNearbyPlaceLabel(name) {
  const ko = String(name || '').replace(REGION_SUFFIX_RE, '').replace(/\s+/g, ' ').trim();
  if (!ko) return '';
  if (!/[가-힣]/.test(ko)) return ko;
  const exact = EXACT.get(ko) || EXACT.get(ko.replace(/\s+/g, ''));
  if (exact) return `${exact} (${ko})`;
  const gloss = [...POI_GLOSSARY].sort((a, b) => b[0].length - a[0].length);
  let i = 0;
  let hits = 0;
  const parts = [];
  while (i < ko.length) {
    if (/\s/.test(ko[i])) {
      i += 1;
      continue;
    }
    const hit = /[가-힣]/.test(ko[i]) ? gloss.find(([token]) => ko.startsWith(token, i)) : null;
    if (hit) {
      parts.push(hit[1]);
      hits += 1;
      i += hit[0].length;
      continue;
    }
    if (/[가-힣]/.test(ko[i])) {
      let run = '';
      while (
        i < ko.length
        && /[가-힣]/.test(ko[i])
        && !gloss.some(([token]) => ko.startsWith(token, i))
      ) {
        run += ko[i];
        i += 1;
      }
      if (run === '사' && hits > 0) parts.push('Temple');
      else if (run) parts.push(capitalize(romanizeHangul(run)));
      continue;
    }
    let run = '';
    while (i < ko.length && !/\s/.test(ko[i]) && !/[가-힣]/.test(ko[i])) {
      run += ko[i];
      i += 1;
    }
    if (run) parts.push(run);
  }
  if (!hits) return '';
  const english = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!english || /[가-힣]/.test(english)) return '';
  return `${english} (${ko})`;
}

/**
 * Program label: full glossary, or a zone name, or Korean only.
 * Festival and program names are not syllable-romanized.
 * @param {string} name
 */
export function formatFestivalProgramLabel(name) {
  const cleaned = dropHanjaParentheticals(name).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const compact = cleaned.replace(/\s+/g, '');
  const exact = EXACT.get(cleaned) || EXACT.get(compact);
  if (exact) return `${exact} (${cleaned})`;
  const glossed = glossaryCompleteEnglish(cleaned);
  if (glossed && !/[가-힣]/.test(glossed)) return `${glossed} (${cleaned})`;
  const zone = cleaned.match(/^(.+?)\s*존$/);
  if (zone?.[1]?.trim()) {
    const stem = zone[1].trim();
    const stemGloss = glossaryCompleteEnglish(stem);
    const stemEn = stemGloss && !/[가-힣]/.test(stemGloss)
      ? stemGloss
      : capitalize(romanizeHangul(stem.replace(/\s+/g, '')));
    if (stemEn && !/[가-힣]/.test(stemEn)) return `${stemEn} Zone (${cleaned})`;
  }
  return cleaned;
}

/** One place, venue, program, or festival-name item. */
function labelNameItem(raw) {
  const text = dropHanjaParentheticals(String(raw || '')).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const sign = extractSignName(text);
  const key = sign || text;
  if (EXACT.has(key)) return EXACT.get(key);
  const compact = key.replace(/\s+/g, '');
  if (EXACT.has(compact)) return EXACT.get(compact);
  if (!/[가-힣]/.test(key)) return key;
  const english = applyNameGlossary(key);
  if (!english || isPunctOnly(english)) return key;
  return english;
}

/** Lists stay split on commas, &, and middle dots. Each item is labeled in full. */
function splitNameParts(text) {
  const re = /(\s*(?:,|&|·|・|…|\.{3})\s*)/g;
  const out = [];
  let last = 0;
  for (const match of text.matchAll(re)) {
    const chunk = text.slice(last, match.index).trim();
    if (chunk) out.push({ kind: 'item', value: chunk });
    const sep = match[1].trim();
    const pretty = sep === ',' ? ', ' : sep === '&' ? ' & ' : sep === '…' || sep === '...' ? ' … ' : ` ${sep} `;
    out.push({ kind: 'sep', value: pretty });
    last = match.index + match[0].length;
  }
  const tail = text.slice(last).trim();
  if (tail) out.push({ kind: 'item', value: tail });
  if (out.filter((part) => part.kind === 'item').length < 2) return [];
  return out;
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function formatEnglishThenKorean(raw) {
  const text = dropHanjaParentheticals(String(raw || '')).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (!/[가-힣\u3400-\u9fff]/.test(text)) return text;
  if (isAddressLike(text)) {
    const address = formatEnglishAddressOrLoose(text);
    if (address) return address;
  }
  if (DESCRIPTIVE_RE.test(text) && !isPlaceLike(text) && !/[,&·・]/.test(text)) {
    const described = translateDescriptiveKorean(text);
    if (described && !/[가-힣\u3400-\u9fff]/.test(described)) {
      return `${described} (${extractSignName(text) || text})`;
    }
  }
  const parts = splitNameParts(text);
  if (parts.length) {
    const english = parts.map((part) => {
      if (part.kind === 'sep') return part.value;
      const label = labelNameItem(part.value);
      if (!label || isPunctOnly(label)) return part.value;
      return label;
    }).join('');
    const cleaned = english.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
    if (!cleaned || isPunctOnly(cleaned)) return text;
    return `${cleaned} (${text})`;
  }
  const sign = extractSignName(text);
  const english = labelNameItem(text);
  if (!english || isPunctOnly(english)) return text;
  const paren = sign || text;
  if (english === paren) return text;
  return `${english} (${paren})`;
}
