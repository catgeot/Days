/**
 * graph-direct tier slug 검수 리스트 — scripts/outputs/graph-direct-review-list.md
 * npm run audit:flight-route-gaps 선행 권장
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gap = JSON.parse(
  readFileSync(join(__dirname, 'outputs/flight-route-gap-report.json'), 'utf8')
);

const gapDirect = (gap.slugs || []).filter((s) => s.routeKind === 'graph-direct');
const gapHub = (gap.slugs || []).filter((s) => s.routeKind === 'hub-override');

const AFRICA =
  /africa|nairobi|kenya|tanzania|serengeti|kilimanjaro|madagascar|mauritius|seychelles|zanzibar|morocco|cairo|luxor|egypt|ethiopia|lalibela|cape-town|johannesburg|namibia|botswana|zimbabwe|rwanda|uganda|ghana|senegal|tunisia|algeria|somalia|djibouti|eritrea|sudan|nigeria|lagos|accra|gaborone|lusaka|harare|windhoek|maputo|antananarivo|mombasa|dar-es|kampala|kigali|tunis|marrakech|casablanca|aswan|abu-simbel|reunion|mayotte|comoros|port-louis/i;
const PACIFIC =
  /fiji|samoa|tonga|vanuatu|palau|guam|hawaii|honolulu|bora|tahiti|pitcairn|micronesia|marshall|kiribati|nauru|solomon|new-caledonia|papua|easter|galapagos|cocos|christmas|midway|wake|niue|cook|tuvalu|american-samoa|saipan|yap|chuuk|kosrae|pohnpei|koror|majuro|midway-atoll/i;
const LATAM =
  /patagonia|uyuni|easter|galapagos|falkland|suriname|guyana|bolivia|peru|amazon|iquitos|machu|cusco|arequipa|la-paz|asuncion|montevideo|caracas|bogota|quito|georgetown|belize|honduras|nicaragua|guatemala|cuba|jamaica|bahamas|barbados|antigua|dominica|grenada|st-|saint-|trinidad|aruba|curacao|torres|punta-arenas|ushuaia|bariloche|everest|kala-patthar|ktm/i;
const US_CANADA =
  /los-angeles|san-francisco|seattle|new-york|chicago|boston|miami|atlanta|dallas|houston|denver|phoenix|las-vegas|orlando|washington|philadelphia|detroit|minneapolis|portland|vancouver|toronto|montreal|calgary|edmonton|ottawa|quebec|halifax|winnipeg|sequoia/i;
const EUROPE =
  /paris|london|amsterdam|berlin|munich|rome|milan|barcelona|madrid|lisbon|vienna|prague|budapest|warsaw|stockholm|copenhagen|oslo|helsinki|zurich|geneva|brussels|dublin|athens|istanbul|moscow|bucharest|belgrade|zagreb|sofia|tallinn|riga|vilnius|reykjavik|iceland|faroe|malta|cyprus|monaco|frankfurt|hamburg|lyon|nice|florence|venice|naples|santorini|cinque-terre/i;
const ASIA_NEAR =
  /tokyo|osaka|bangkok|singapore|hong-kong|taipei|manila|seoul|busan|jeju|shanghai|beijing|macau|ho-chi-minh|hanoi|phuket|chiang|denpasar|jakarta|surabaya|kuala|penang|langkawi|bali|lombok|komodo|yogyakarta|borobudur|angkor|siem|phnom|vientiane|luang|yangon|mandalay|kathmandu|delhi|mumbai|goa|kerala|chennai|kolkata|colombo|dhaka|dubai|abu-dhabi|doha|jerusalem|tel-aviv|fukuoka|hokkaido|sapporo|nagasaki|kumamoto|kyoto|kobe|kanazawa|nara|yokohama|mount-fuji|tsushima|qingdao|cebu|boracay|gili|ubud|phi-phi|halong|sapa|ayutthaya|forbidden|great-wall|terracotta|vang-vieng|vladivostok|kota-kinabalu|borneo|da-nang|hoi-an|hue/i;

function region(slug) {
  if (AFRICA.test(slug)) return '1-africa-indian-ocean';
  if (PACIFIC.test(slug)) return '2-pacific-remote';
  if (LATAM.test(slug)) return '3-latam-remote';
  if (US_CANADA.test(slug)) return '5-us-canada-likely-ok';
  if (EUROPE.test(slug)) return '6-europe-likely-ok';
  if (ASIA_NEAR.test(slug)) return '4-asia-likely-ok';
  return '7-other-review';
}

const REVIEW_NOTES = {
  guam: 'ICN 직항 있음 — OK',
  hawaii: 'ICN 직항 있음 — OK',
  honolulu: 'ICN 직항 있음 — OK',
  saipan: 'ICN 직항 있음 — OK',
  'midway-atoll': 'dest HNL — overrides·의도 확인',
  boracay: 'KLO/MNL 경유 흔함 — 확인',
  auckland: 'SYD·동남아 경유 흔함 — 확인',
  sydney: '경유 흔함 — 확인',
  brisbane: '경유 흔함 — 확인',
  'everest-base-camp': 'KTM 직항 드묾 — hub 필요?',
  'kala-patthar': 'KTM 직항 드묾 — hub 필요?',
  'sri-jayawardenapura': 'CMB 직항 있음 — OK',
};

const list = gapDirect.map((s) => ({
  slug: s.slug,
  name: s.name,
  dest: s.destIata,
  route: (s.routeIatas || []).join('->'),
  region: region(s.slug),
  note: REVIEW_NOTES[s.slug] ?? '',
}));

const byRegion = {};
for (const item of list) {
  if (!byRegion[item.region]) byRegion[item.region] = [];
  byRegion[item.region].push(item);
}

const labels = {
  '1-africa-indian-ocean': '동아프리카·인도양',
  '2-pacific-remote': '태평양·괌·하와이',
  '3-latam-remote': '남미·히말라야',
  '7-other-review': '미분류(호주·NZ 등)',
  '4-asia-likely-ok': '동아시아·동남아(대부분 OK)',
  '5-us-canada-likely-ok': '미국·캐나다(대부분 OK)',
  '6-europe-likely-ok': '유럽(대부분 OK)',
};

const order = [
  '1-africa-indian-ocean',
  '2-pacific-remote',
  '3-latam-remote',
  '7-other-review',
  '4-asia-likely-ok',
  '5-us-canada-likely-ok',
  '6-europe-likely-ok',
];

const out = [];
out.push('# graph-direct 검수 리스트 (ICN 출발, OpenFlights graph 직항 tier)');
out.push('');
out.push(`갱신: ${gap.generatedAt}`);
out.push(`총 **${list.length}** slug · hub-override **${gapHub.length}**`);
out.push('');
out.push('관련: `scripts/outputs/flight-route-gap-report.json`');
out.push('');
out.push('## routeKind 분포');
out.push(JSON.stringify(gap.routeKindCounts));
out.push('');
out.push('## 검수 우선순위');
out.push('| 우선 | 구역 | 건수 |');
out.push('|------|------|------|');
for (const r of order) {
  const n = (byRegion[r] || []).length;
  if (!n) continue;
  const pri =
    r.startsWith('1') || r.startsWith('2') || r.startsWith('3')
      ? '높음'
      : r === '7-other-review'
        ? '중간'
        : '낮음';
  out.push(`| ${pri} | ${labels[r]} | ${n} |`);
}
out.push('');
out.push('## 수정');
out.push('overrides.mjs `flightRouteHubIatas` → `npm run generate:airports` → `audit:flight-arcs`');
out.push('');

for (const r of order) {
  const items = byRegion[r];
  if (!items?.length) continue;
  out.push(`### ${labels[r]} (${items.length})`);
  out.push('');
  out.push('| slug | 한글명 | dest | route | 메모 |');
  out.push('|------|--------|------|-------|------|');
  for (const x of items.sort((a, b) => a.slug.localeCompare(b.slug))) {
    out.push(
      `| ${x.slug} | ${x.name} | ${x.dest} | ${x.route} | ${x.note} |`
    );
  }
  out.push('');
}

const path = join(__dirname, 'outputs/graph-direct-review-list.md');
writeFileSync(path, out.join('\n'));
console.log(`Wrote ${path} (${list.length} graph-direct slugs)`);
