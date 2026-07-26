import fs from 'fs';
import { GLOBE_COUNTRY_CATALOG as EXISTING_CATALOG } from '../src/pages/Home/lib/globeCountryCatalog.js';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';

/** Better static bboxes for large / well-known countries (west,south,east,north) */
const STATIC = {
  cn: { labelKo: '중국', iso: 'CN', lat: 35.9, lng: 104.2, zoom: 3.2, bbox: [73.5, 18.2, 134.8, 53.6], hubBbox: [102.0, 22.0, 122.5, 41.0] },
  in: { labelKo: '인도', iso: 'IN', lat: 22.0, lng: 79.0, zoom: 3.8, bbox: [68.1, 6.7, 97.4, 35.5], hubBbox: [72.5, 12.0, 88.5, 31.5] },
  ru: { labelKo: '러시아', iso: 'RU', lat: 61.5, lng: 105.0, zoom: 2.4, bbox: [27.0, 41.2, 180.0, 81.9], hubBbox: [30.0, 45.0, 150.0, 70.0] },
  nz: { labelKo: '뉴질랜드', iso: 'NZ', lat: -41.5, lng: 172.5, zoom: 4.6, bbox: [166.3, -47.4, 178.6, -34.3] },
  sg: { labelKo: '싱가포르', iso: 'SG', lat: 1.35, lng: 103.82, zoom: 9.5, bbox: [103.6, 1.2, 104.1, 1.5] },
  kh: { labelKo: '캄보디아', iso: 'KH', lat: 12.6, lng: 104.9, zoom: 5.8, bbox: [102.3, 10.4, 107.6, 14.7] },
  la: { labelKo: '라오스', iso: 'LA', lat: 19.9, lng: 102.5, zoom: 5.4, bbox: [100.1, 13.9, 107.6, 22.5] },
  gr: { labelKo: '그리스', iso: 'GR', lat: 39.1, lng: 22.9, zoom: 5.4, bbox: [19.4, 34.8, 28.2, 41.8] },
  pt: { labelKo: '포르투갈', iso: 'PT', lat: 39.4, lng: -8.2, zoom: 5.6, bbox: [-9.5, 36.9, -6.2, 42.2] },
  ch: { labelKo: '스위스', iso: 'CH', lat: 46.8, lng: 8.2, zoom: 6.4, bbox: [5.96, 45.8, 10.5, 47.8] },
  hr: { labelKo: '크로아티아', iso: 'HR', lat: 45.1, lng: 15.2, zoom: 6.0, bbox: [13.5, 42.4, 19.4, 46.5] },
  is: { labelKo: '아이슬란드', iso: 'IS', lat: 64.9, lng: -18.7, zoom: 5.2, bbox: [-24.6, 63.3, -13.5, 66.6] },
  tr: { labelKo: '튀르키예', iso: 'TR', lat: 39.0, lng: 35.2, zoom: 4.8, bbox: [26.0, 35.8, 44.8, 42.1] },
  ae: { labelKo: '아랍에미리트', iso: 'AE', lat: 24.0, lng: 54.0, zoom: 6.2, bbox: [51.5, 22.6, 56.5, 26.1] },
  jo: { labelKo: '요르단', iso: 'JO', lat: 31.2, lng: 36.5, zoom: 6.2, bbox: [34.9, 29.2, 39.3, 33.4] },
  np: { labelKo: '네팔', iso: 'NP', lat: 28.4, lng: 84.1, zoom: 6.0, bbox: [80.0, 26.3, 88.2, 30.5] },
  mv: { labelKo: '몰디브', iso: 'MV', lat: 3.2, lng: 73.2, zoom: 6.0, bbox: [72.6, -0.7, 73.7, 7.1] },
  sc: { labelKo: '세이셸', iso: 'SC', lat: -4.7, lng: 55.5, zoom: 7.5, bbox: [55.2, -4.9, 55.8, -4.2] },
  mu: { labelKo: '모리셔스', iso: 'MU', lat: -20.3, lng: 57.5, zoom: 8.0, bbox: [57.3, -20.5, 57.8, -19.9] },
  zm: { labelKo: '잠비아', iso: 'ZM', lat: -13.1, lng: 27.8, zoom: 5.0, bbox: [21.9, -18.1, 33.7, -8.2] },
  bs: { labelKo: '바하마', iso: 'BS', lat: 24.3, lng: -76.0, zoom: 5.8, bbox: [-79.3, 20.9, -72.7, 27.3] },
  fi: { labelKo: '핀란드', iso: 'FI', lat: 64.0, lng: 26.0, zoom: 4.4, bbox: [20.5, 59.7, 31.6, 70.1] },
  dk: { labelKo: '덴마크', iso: 'DK', lat: 56.0, lng: 10.0, zoom: 5.8, bbox: [8.0, 54.5, 15.2, 57.8] },
  hu: { labelKo: '헝가리', iso: 'HU', lat: 47.2, lng: 19.5, zoom: 6.2, bbox: [16.1, 45.7, 22.9, 48.6] },
  at: { labelKo: '오스트리아', iso: 'AT', lat: 47.5, lng: 14.5, zoom: 6.2, bbox: [9.5, 46.4, 17.2, 49.0] },
  se: { labelKo: '스웨덴', iso: 'SE', lat: 62.0, lng: 15.0, zoom: 3.8, bbox: [11.0, 55.3, 24.2, 69.1] },
  ie: { labelKo: '아일랜드', iso: 'IE', lat: 53.2, lng: -8.0, zoom: 5.8, bbox: [-10.5, 51.4, -5.9, 55.4] },
  pl: { labelKo: '폴란드', iso: 'PL', lat: 52.1, lng: 19.4, zoom: 5.4, bbox: [14.1, 49.0, 24.2, 54.9] },
  be: { labelKo: '벨기에', iso: 'BE', lat: 50.5, lng: 4.5, zoom: 6.8, bbox: [2.5, 49.5, 6.4, 51.5] },
  lk: { labelKo: '스리랑카', iso: 'LK', lat: 7.9, lng: 80.7, zoom: 6.2, bbox: [79.6, 5.9, 81.9, 9.9] },
  mm: { labelKo: '미얀마', iso: 'MM', lat: 21.0, lng: 96.0, zoom: 4.8, bbox: [92.2, 9.9, 101.2, 28.5] },
  mn: { labelKo: '몽골', iso: 'MN', lat: 46.9, lng: 103.8, zoom: 4.2, bbox: [87.7, 41.6, 119.9, 52.1] },
  il: { labelKo: '이스라엘', iso: 'IL', lat: 31.5, lng: 34.9, zoom: 6.8, bbox: [34.2, 29.5, 35.9, 33.3] },
  ir: { labelKo: '이란', iso: 'IR', lat: 32.4, lng: 53.7, zoom: 4.4, bbox: [44.0, 25.1, 63.3, 39.8] },
  ve: { labelKo: '베네수엘라', iso: 'VE', lat: 7.0, lng: -66.0, zoom: 4.8, bbox: [-73.4, 0.6, -59.8, 12.2] },
  gl: { labelKo: '그린란드', iso: 'GL', lat: 71.7, lng: -42.6, zoom: 2.8, bbox: [-73.0, 59.8, -11.3, 83.6] },
  fj: { labelKo: '피지', iso: 'FJ', lat: -17.7, lng: 178.1, zoom: 6.5, bbox: [177.0, -19.2, 180.0, -16.0] },
  to: { labelKo: '통가', iso: 'TO', lat: -21.2, lng: -175.2, zoom: 7.0, bbox: [-176.3, -22.4, -173.7, -15.5] },
  vu: { labelKo: '바누아투', iso: 'VU', lat: -16.0, lng: 167.5, zoom: 6.2, bbox: [166.5, -20.3, 170.2, -13.1] },
  ws: { labelKo: '사모아', iso: 'WS', lat: -13.8, lng: -172.1, zoom: 8.0, bbox: [-172.8, -14.1, -171.4, -13.4] },
  ck: { labelKo: '쿡 제도', iso: 'CK', lat: -19.0, lng: -159.8, zoom: 6.0, bbox: [-161.1, -22.0, -157.3, -8.9] },
  pw: { labelKo: '팔라우', iso: 'PW', lat: 7.5, lng: 134.5, zoom: 7.5, bbox: [131.1, 2.9, 134.7, 8.1] },
  mt: { labelKo: '몰타', iso: 'MT', lat: 35.9, lng: 14.4, zoom: 9.0, bbox: [14.2, 35.8, 14.6, 36.1] },
  me: { labelKo: '몬테네그로', iso: 'ME', lat: 42.7, lng: 19.3, zoom: 7.2, bbox: [18.4, 41.8, 20.4, 43.6] },
  si: { labelKo: '슬로베니아', iso: 'SI', lat: 46.1, lng: 14.8, zoom: 7.2, bbox: [13.4, 45.4, 16.6, 46.9] },
  bn: { labelKo: '브루나이', iso: 'BN', lat: 4.5, lng: 114.7, zoom: 8.0, bbox: [114.1, 4.0, 115.4, 5.1] },
  cv: { labelKo: '카보베르데', iso: 'CV', lat: 16.0, lng: -24.0, zoom: 6.5, bbox: [-25.4, 14.8, -22.6, 17.2] },
  bm: { labelKo: '버뮤다', iso: 'BM', lat: 32.3, lng: -64.8, zoom: 9.5, bbox: [-64.9, 32.2, -64.6, 32.4] },
  gu: { labelKo: '괌', iso: 'GU', lat: 13.4, lng: 144.8, zoom: 9.0, bbox: [144.6, 13.2, 145.0, 13.7] },
  mp: { labelKo: '북마리아나 제도', iso: 'MP', lat: 15.2, lng: 145.7, zoom: 7.5, bbox: [145.1, 14.1, 146.1, 20.6] },
  hi: { labelKo: '하와이', iso: 'US', lat: 20.5, lng: -157.0, zoom: 6.0, bbox: [-160.3, 18.9, -154.8, 22.3] },
  pf: { labelKo: '프랑스령 폴리네시아', iso: 'PF', lat: -17.7, lng: -149.4, zoom: 5.0, bbox: [-154.7, -27.7, -134.9, -7.9], hubBbox: [-152.0, -18.0, -149.0, -15.5] },
  re: { labelKo: '프랑스령 레위니옹', iso: 'RE', lat: -21.1, lng: 55.5, zoom: 8.5, bbox: [55.2, -21.4, 55.8, -20.9] },
  nc: { labelKo: '뉴칼레도니아', iso: 'NC', lat: -21.3, lng: 165.5, zoom: 6.0, bbox: [163.6, -22.7, 168.1, -19.5] },
  fm: { labelKo: '미크로네시아 연방', iso: 'FM', lat: 6.9, lng: 158.2, zoom: 4.5, bbox: [137.3, 1.0, 163.0, 10.1] },
  ki: { labelKo: '키리바시', iso: 'KI', lat: 1.9, lng: 173.0, zoom: 4.0, bbox: [169.5, -11.5, 176.9, 4.7] },
  nr: { labelKo: '나우루', iso: 'NR', lat: -0.52, lng: 166.93, zoom: 11.0, bbox: [166.9, -0.56, 166.96, -0.48] },
  sb: { labelKo: '솔로몬 제도', iso: 'SB', lat: -9.6, lng: 160.2, zoom: 5.8, bbox: [155.5, -11.9, 167.0, -5.1] },
  pn: { labelKo: '핏케언 제도', iso: 'PN', lat: -25.1, lng: -130.1, zoom: 9.0, bbox: [-130.2, -25.1, -130.0, -24.0] },
  va: { labelKo: '바티칸', iso: 'VA', lat: 41.9, lng: 12.45, zoom: 12.0, bbox: [12.44, 41.9, 12.46, 41.91] },
  aq: { labelKo: '남극', iso: 'AQ', lat: -80.0, lng: 0.0, zoom: 2.0, bbox: [-180, -90, 180, -60] },
  sh: { labelKo: '영국령 세인트 헬레나', iso: 'SH', lat: -15.96, lng: -5.71, zoom: 9.0, bbox: [-5.8, -16.05, -5.6, -15.9] },
  io: { labelKo: '영국령 인도양 지역', iso: 'IO', lat: -7.3, lng: 72.4, zoom: 8.0, bbox: [71.2, -7.5, 72.5, -5.2] },
  tf: { labelKo: '프랑스 남부 연방 영토', iso: 'TF', lat: -49.4, lng: 69.5, zoom: 5.0, bbox: [68.5, -50.0, 70.5, -48.5] },
  um: { labelKo: '미드웨이 환초', iso: 'UM', lat: 28.2, lng: -177.4, zoom: 9.0, bbox: [-177.5, 28.1, -177.3, 28.3] },
  ml: { labelKo: '말리', iso: 'ML', lat: 17.6, lng: -2.0, zoom: 4.4, bbox: [-12.3, 10.1, 4.3, 25.0] },
  eh: { labelKo: '사하라', iso: 'EH', lat: 24.2, lng: -12.9, zoom: 4.5, bbox: [-17.1, 20.8, -8.7, 27.7] },
  sct: { labelKo: '스코틀랜드', iso: 'GB', lat: 56.5, lng: -4.2, zoom: 5.6, bbox: [-7.7, 54.6, -0.7, 60.9] },
};

const LABEL_TO_ID = {
  한국: 'kr',
  일본: 'jp',
  대만: 'tw',
  태국: 'th',
  베트남: 'vn',
  인도네시아: 'id',
  필리핀: 'ph',
  말레이시아: 'my',
  호주: 'au',
  케냐: 'ke',
  탄자니아: 'tz',
  남아프리카: 'za',
  남아프리카공화국: 'za',
  모로코: 'ma',
  이집트: 'eg',
  나미비아: 'na',
  마다가스카르: 'mg',
  에티오피아: 'et',
  노르웨이: 'no',
  프랑스: 'fr',
  영국: 'gb',
  이탈리아: 'it',
  스페인: 'es',
  독일: 'de',
  네덜란드: 'nl',
  체코: 'cz',
  미국: 'us',
  캐나다: 'ca',
  멕시코: 'mx',
  쿠바: 'cu',
  코스타리카: 'cr',
  과테말라: 'gt',
  파나마: 'pa',
  자메이카: 'jm',
  브라질: 'br',
  페루: 'pe',
  아르헨티나: 'ar',
  칠레: 'cl',
  콜롬비아: 'co',
  에콰도르: 'ec',
  볼리비아: 'bo',
  파라과이: 'py',
  중국: 'cn',
  인도: 'in',
  러시아: 'ru',
  뉴질랜드: 'nz',
  싱가포르: 'sg',
  캄보디아: 'kh',
  라오스: 'la',
  그리스: 'gr',
  포르투갈: 'pt',
  스위스: 'ch',
  크로아티아: 'hr',
  아이슬란드: 'is',
  튀르키예: 'tr',
  터키: 'tr',
  아랍에미리트: 'ae',
  요르단: 'jo',
  네팔: 'np',
  몰디브: 'mv',
  세이셸: 'sc',
  모리셔스: 'mu',
  잠비아: 'zm',
  바하마: 'bs',
  핀란드: 'fi',
  덴마크: 'dk',
  헝가리: 'hu',
  오스트리아: 'at',
  스웨덴: 'se',
  아일랜드: 'ie',
  폴란드: 'pl',
  벨기에: 'be',
  스리랑카: 'lk',
  미얀마: 'mm',
  몽골: 'mn',
  이스라엘: 'il',
  이란: 'ir',
  베네수엘라: 've',
  그린란드: 'gl',
  피지: 'fj',
  통가: 'to',
  바누아투: 'vu',
  사모아: 'ws',
  '쿡 제도': 'ck',
  팔라우: 'pw',
  몰타: 'mt',
  몬테네그로: 'me',
  슬로베니아: 'si',
  브루나이: 'bn',
  카보베르데: 'cv',
  버뮤다: 'bm',
  괌: 'gu',
  '북마리아나 제도': 'mp',
  하와이: 'hi',
  '프랑스령 폴리네시아': 'pf',
  '프랑스령 레위니옹': 're',
  뉴칼레도니아: 'nc',
  '미크로네시아 연방': 'fm',
  키리바시: 'ki',
  나우루: 'nr',
  '솔로몬 제도': 'sb',
  '핏케언 제도': 'pn',
  바티칸: 'va',
  남극: 'aq',
  '영국령 세인트 헬레나': 'sh',
  '영국령 인도양 지역': 'io',
  '프랑스 남부 연방 영토': 'tf',
  '미드웨이 환초': 'um',
  말리: 'ml',
  사하라: 'eh',
  스코틀랜드: 'sct',
};

const catalog = new Map();

for (const [id, r] of Object.entries(EXISTING_CATALOG)) {
  catalog.set(id, { ...r });
}

for (const [id, data] of Object.entries(STATIC)) {
  if (!catalog.has(id)) {
    catalog.set(id, { id, ...data });
  } else {
    const cur = catalog.get(id);
    if (!cur.hubBbox && data.hubBbox) cur.hubBbox = data.hubBbox;
    if (data.bbox) cur.bbox = data.bbox;
    if (Number.isFinite(data.zoom)) cur.zoom = data.zoom;
    if (Number.isFinite(data.lat)) cur.lat = data.lat;
    if (Number.isFinite(data.lng)) cur.lng = data.lng;
    if (data.labelKo) cur.labelKo = data.labelKo;
    if (data.iso) cur.iso = data.iso;
  }
}

function padBbox(spots, pad = 1.8) {
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const s of spots) {
    minLat = Math.min(minLat, s.lat);
    maxLat = Math.max(maxLat, s.lat);
    minLng = Math.min(minLng, s.lng);
    maxLng = Math.max(maxLng, s.lng);
  }
  const latPad = Math.max(pad, (maxLat - minLat) * 0.35 + 0.8);
  const lngPad = Math.max(pad, (maxLng - minLng) * 0.35 + 0.8);
  return [
    Math.max(-180, +(minLng - lngPad).toFixed(2)),
    Math.max(-90, +(minLat - latPad).toFixed(2)),
    Math.min(180, +(maxLng + lngPad).toFixed(2)),
    Math.min(90, +(maxLat + latPad).toFixed(2)),
  ];
}

const byCountry = new Map();
for (const s of TRAVEL_SPOTS) {
  const c = s.country;
  if (!byCountry.has(c)) byCountry.set(c, []);
  byCountry.get(c).push(s);
}

const missingIds = [];
for (const [country, spots] of byCountry) {
  const id = LABEL_TO_ID[country];
  if (!id) {
    missingIds.push(country);
    continue;
  }
  if (catalog.has(id)) continue;
  const lat = +(spots.reduce((a, s) => a + s.lat, 0) / spots.length).toFixed(2);
  const lng = +(spots.reduce((a, s) => a + s.lng, 0) / spots.length).toFixed(2);
  const bbox = padBbox(spots);
  const span = Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]);
  const zoom = span > 40 ? 3.2 : span > 20 ? 4.0 : span > 10 ? 4.8 : span > 5 ? 5.6 : span > 2 ? 6.5 : 8.0;
  let labelKo = country;
  if (country === '터키') labelKo = '튀르키예';
  if (country === '남아프리카공화국') labelKo = '남아프리카';
  catalog.set(id, {
    id,
    labelKo,
    iso: STATIC[id]?.iso || id.toUpperCase().slice(0, 2),
    lat,
    lng,
    zoom,
    bbox,
  });
}

if (missingIds.length) {
  console.error('Missing LABEL_TO_ID for:', missingIds);
  process.exit(1);
}

const ordered = [...catalog.values()].sort((a, b) => a.labelKo.localeCompare(b.labelKo, 'ko'));
const lines = [];
lines.push('/** 지구본 나라 카탈로그 SSOT — flyTo·하이라이트 단일 소스 */');
lines.push('');
lines.push('/**');
lines.push(' * @typedef {{');
lines.push(' *   id: string,');
lines.push(' *   labelKo: string,');
lines.push(' *   iso: string,');
lines.push(' *   lat: number,');
lines.push(' *   lng: number,');
lines.push(' *   zoom: number,');
lines.push(' *   bbox: [number, number, number, number],');
lines.push(' *   hubBbox?: [number, number, number, number],');
lines.push(' * }} GlobeFaceRegion');
lines.push(' */');
lines.push('');
lines.push('/** @type {Record<string, GlobeFaceRegion>} */');
lines.push('export const GLOBE_COUNTRY_CATALOG = {');
for (const r of ordered) {
  const hub = r.hubBbox ? `, hubBbox: [${r.hubBbox.join(', ')}]` : '';
  lines.push(
    `  ${JSON.stringify(r.id)}: { id: ${JSON.stringify(r.id)}, labelKo: ${JSON.stringify(r.labelKo)}, iso: ${JSON.stringify(r.iso)}, lat: ${r.lat}, lng: ${r.lng}, zoom: ${r.zoom}, bbox: [${r.bbox.join(', ')}]${hub} },`,
  );
}
lines.push('};');
lines.push('');
lines.push('/** travelSpots.country → catalog id */');
lines.push('export const GLOBE_COUNTRY_LABEL_TO_ID = {');
for (const [k, v] of Object.entries(LABEL_TO_ID).sort((a, b) => a[0].localeCompare(b[0], 'ko'))) {
  lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
}
lines.push('};');
lines.push('');
lines.push('export function getGlobeCountryById(id) {');
lines.push('  if (!id) return null;');
lines.push('  return GLOBE_COUNTRY_CATALOG[id] || null;');
lines.push('}');
lines.push('');
lines.push('export function resolveGlobeCountryIdFromLabel(label) {');
lines.push('  if (!label) return null;');
lines.push('  const trimmed = String(label).trim();');
lines.push('  if (GLOBE_COUNTRY_LABEL_TO_ID[trimmed]) return GLOBE_COUNTRY_LABEL_TO_ID[trimmed];');
lines.push('  const hit = Object.values(GLOBE_COUNTRY_CATALOG).find((c) => c.labelKo === trimmed);');
lines.push('  return hit?.id || null;');
lines.push('}');
lines.push('');

const outPath = new URL('../src/pages/Home/lib/globeCountryCatalog.js', import.meta.url);
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('wrote', outPath.pathname, 'entries', ordered.length);
