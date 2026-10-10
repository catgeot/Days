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
  ['먹거리존', 'Food zone'],
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

/** Longest suffix first. */
const PLACE_SUFFIXES = [
  ['엑스포공원', 'Expo Park'],
  ['해수욕장', 'Beach'],
  ['국립공원', 'National Park'],
  ['테마파크', 'Theme Park'],
  ['놀이공원', 'Amusement Park'],
  ['문화회관', 'Culture Hall'],
  ['경연대회', 'Contest'],
  ['불꽃놀이', 'Fireworks'],
  ['공원', 'Park'],
  ['거리', 'Street'],
  ['시장', 'Market'],
  ['광장', 'Plaza'],
  ['해변', 'Beach'],
  ['마을', 'Village'],
  ['박물관', 'Museum'],
  ['미술관', 'Art Museum'],
  ['경기장', 'Stadium'],
  ['체육관', 'Gym'],
  ['전망대', 'Observatory'],
  ['온천', 'Hot Spring'],
  ['항구', 'Port'],
  ['포구', 'Port'],
  ['해안', 'Coast'],
  ['호수', 'Lake'],
  ['폭포', 'Falls'],
  ['사찰', 'Temple'],
  ['성당', 'Cathedral'],
  ['궁궐', 'Palace'],
  ['콘서트', 'Concert'],
  ['체험', 'Experience'],
  ['공연', 'Performance'],
  ['전시', 'Exhibition'],
  ['궁', 'Palace'],
  ['산', 'Mountain'],
];

const PHRASES = [
  ['경연대회', 'Contest'],
  ['먹거리', 'Food'],
  ['불꽃놀이', 'Fireworks'],
  ['나이트워크', 'Night Walk'],
  ['콘서트', 'Concert'],
  ['누들', 'Noodle'],
  ['체험', 'Experience'],
  ['공연', 'Performance'],
  ['전시', 'Exhibition'],
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

function translateStem(rest) {
  if (!rest) return '';
  if (EXACT.has(rest)) return EXACT.get(rest);
  let text = rest;
  const phrases = [...PHRASES].sort((a, b) => b[0].length - a[0].length);
  for (const [ko, en] of phrases) {
    text = text.split(ko).join(` ${en} `);
  }
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (EXACT.has(word)) return EXACT.get(word);
      if (!/[가-힣]/.test(word)) return word.replace(/[\u3400-\u9fff]/g, '');
      return capitalize(romanizeHangul(word));
    })
    .filter(Boolean);
  return words.join(' ').replace(/\s+/g, ' ').trim();
}

function translatePlaceName(sign) {
  if (EXACT.has(sign)) return EXACT.get(sign);
  let rest = sign;
  const bits = [];
  const suffixes = [...PLACE_SUFFIXES].sort((a, b) => b[0].length - a[0].length);
  let peeled = true;
  while (peeled && rest) {
    peeled = false;
    for (const [ko, en] of suffixes) {
      if (rest.endsWith(ko) && rest.length > ko.length) {
        bits.unshift(en);
        rest = rest.slice(0, -ko.length).trim();
        peeled = true;
        break;
      }
    }
  }
  const stem = translateStem(rest);
  return [stem, ...bits].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function extractSignName(text) {
  let sign = text.replace(/(?:\s*(?:일원|일대|부근|인근|주변))+$/g, '').trim();
  const parts = sign.split(/\s+/).filter(Boolean);
  while (parts.length > 1 && LEADING_CITY.has(parts[0])) parts.shift();
  sign = parts.join(' ').trim();
  return sign || text;
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function formatEnglishThenKorean(raw) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (!/[가-힣\u3400-\u9fff]/.test(text)) return text;
  const address = formatEnglishAddress(text);
  if (address) return address;
  const sign = extractSignName(text);
  const english = translatePlaceName(sign);
  if (!english || /[가-힣\u3400-\u9fff]/.test(english)) {
    const fallback = capitalize(romanizeHangul(sign.replace(/[^\uac00-\ud7a3\s]/g, ' ')));
    if (!fallback) return text;
    return `${fallback} (${sign})`;
  }
  return `${english} (${sign})`;
}
