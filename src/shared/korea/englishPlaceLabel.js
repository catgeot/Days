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

const DESCRIPTIVE = [
  ['프로그램별 상이', 'Varies by program'],
  ['얼리버드 특가', 'early-bird special'],
  ['부대 행사', 'Side events'],
  ['섬夜 콘서트', 'Seomya Concert'],
  ['섬夜 불꽃놀이', 'Seomya Fireworks'],
  ['먹거리존', 'Food zone'],
  ['푸드존', 'Food zone'],
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
  const text = dropHanjaParentheticals(String(raw || '')).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (!/[가-힣\u3400-\u9fff]/.test(text)) return text;
  if (DESCRIPTIVE_RE.test(text) && !isPlaceLike(text)) {
    const described = translateDescriptiveKorean(text);
    return described ? `${described} (${extractSignName(text)})` : '';
  }
  if (isAddressLike(text)) return formatEnglishAddressOrLoose(text);
  if (!isPlaceLike(text)) {
    const described = translateDescriptiveKorean(text);
    return described ? `${described} (${extractSignName(text)})` : '';
  }
  const sign = extractSignName(text);
  const english = translatePlaceName(sign);
  if (!english || /[가-힣\u3400-\u9fff]/.test(english)) return '';
  return `${english} (${sign})`;
}
