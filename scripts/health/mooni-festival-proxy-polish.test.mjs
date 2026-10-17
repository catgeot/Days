import assert from 'node:assert/strict';
import { test } from 'node:test';
import { repairGeminiReplacementChars } from '../../supabase/functions/_shared/gemini/answerSanitize.mjs';
import { polishMooniFestivalProxyText, parseFestivalPolishParams } from '../../supabase/functions/_shared/gemini/festivalMooniProxyPolish.mjs';
import {
  buildMooniBoundFestivalSystemHint,
  polishFestivalModelReply,
  stripTrailingBracketChipHeaders,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import { stripGangneungAccessItxMentions } from '../../src/shared/korea/mooniKoreaFestivalReplyPolish.js';

const SHOPS = [
  { name: '만동제과', distKm: 0.1, cat3: 'A05020300' },
  { name: '이쉐프의돈까스', distKm: 0.2, cat3: 'A05020400' },
];

test('parseFestivalPolishParams accepts nearby restaurant rows', () => {
  const parsed = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '근처 맛집',
    contentId: '1998564',
    nearbyRestaurants: SHOPS,
    referenceYmd: '20261017',
  });
  assert.equal(parsed?.chipId, 'festival_nearby');
  assert.equal(parsed?.nearbyRestaurants?.length, 2);
});

test('proxy polish drops invented food names from model output', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '근처 맛집 추천해 줘',
    contentId: '1998564',
    nearbyRestaurants: SHOPS,
  });
  const raw = '궁중문화축제 근처에는 체부동잔치집, 토속촌삼계탕, 광화문국밥이 있어요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /체부동|토속촌|광화문국밥/);
  assert.match(out, /만동제과|이쉐프의돈까스/);
});

test('proxy polish strips parking tail on food chip', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '근처 맛집',
    contentId: '2930716',
    nearbyRestaurants: SHOPS,
  });
  const raw = '만동제과가 가까워요. 축제장 운영 시간이나 주차 정보는 [공식 홈페이지](https://example.com)에서 확인해요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /주차|운영\s*시간/);
});

test('stripTrailingBracketChipHeaders removes empty access section labels', () => {
  const raw = '서울역에서 KTX를 타고 강릉역까지 가요.\n\n[교통 · 티켓] [출발 전 준비]';
  const out = stripTrailingBracketChipHeaders(polishFestivalModelReply(raw, {
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2930716',
  }));
  assert.match(out, /강릉역/);
  assert.doesNotMatch(out, /\[교통|출발\s*전\s*준비/);
});

test('stripTrailingBracketChipHeaders removes corner-bracket chip headers', () => {
  const raw = '용산역에서 KTX를 타고 오세요.\n\n「출발 전 준비」';
  const out = stripTrailingBracketChipHeaders(polishFestivalModelReply(raw, {
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
  }));
  assert.match(out, /KTX/);
  assert.doesNotMatch(out, /「출발\s*전\s*준비」/);
});

test('access polish drops festival intro and nearby place lists', () => {
  const nearby = [
    '한복남 경복궁점',
    '북촌한옥마을 감고당길',
    '아띠인력거',
    'K-컬처 스크린(대한민국역사박물관)',
    '세종마을 음식문화거리',
    '세종로공원',
  ];
  const raw = [
    '궁중문화축전은 서울 5대 궁궐에서 펼쳐지는 국내 최대 국가유산 축제예요.',
    '근처에서는 한복남 경복궁점, 북촌한옥마을 감고당길, 아띠인력거를 둘러볼 수 있어요.',
    '서울역에서 KTX로 용산역까지 가고 지하철 3호선 경복궁역에서 내려요.',
  ].join(' ');
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
    eventStartDate: '20261007',
    eventEndDate: '20261011',
    nearbyPlaces: nearby,
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /KTX|지하철|경복궁역/);
  assert.doesNotMatch(out, /국내\s*최대|둘러볼|한복남|북촌한옥마을/);
});

test('access polish places 행사 기간 before gateo link sentence without mid-sentence split', () => {
  const pageUrl = 'https://www.gateo.kr/korea/?festival=1998564';
  const raw = `서울역에서 KTX로 오면 편해요. 더욱 자세한 정보는 [궁중문화축전 상세 페이지](${pageUrl})에서 살펴보세요.`;
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
    eventStartDate: '20261007',
    eventEndDate: '20261011',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /더욱 자세한 정보는 \[궁중문화축전 상세 페이지\]/);
  assert.doesNotMatch(out, /더욱 자세한 정보는\s*\n\n행사\s*기간은/);
  assert.doesNotMatch(out, /정보는\s*\n\n행사\s*기간은/);
  const periodIdx = out.indexOf('행사 기간은 10/7~11');
  const detailIdx = out.indexOf('더욱 자세한 정보는');
  if (periodIdx >= 0 && detailIdx >= 0) assert.ok(periodIdx < detailIdx);
});

test('access polish drops auto footer when body uses 열차 시각과 요금은 [코레일]', () => {
  const raw = '서울역에서 KTX를 타고 오면 편해요. 열차 시각과 요금은 [코레일](https://www.letskorail.com/)에서 확인할 수 있어요.';
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
    eventStartDate: '20261007',
    eventEndDate: '20261011',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /열차\s*시각과\s*요금은\s*\[코레일\]/);
  assert.doesNotMatch(out, /열차·버스\s*시각은/);
});

test('food polish without distances does not keep invented drive times', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '맛집',
    contentId: '2930716',
    nearbyRestaurants: [
      { name: '만동제과', cat3: 'A05020300' },
      { name: '이쉐프의돈까스', cat3: 'A05020400' },
    ],
  });
  const raw = '만동제과는 차로 10분, 이쉐프의돈까스도 가까워요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /차로\s*10\s*분/);
  assert.match(out, /만동제과|이쉐프의돈까스/);
});

test('repairGeminiReplacementChars fixes split 라이브 artifact', () => {
  const broken = `부산 불꽃${'\uFFFD\uFFFD\uFFFD'}이브가 열려요`;
  assert.equal(repairGeminiReplacementChars(broken), '부산 불꽃라이브가 열려요');
});

test('access polish does not append booking footer when korail and bus links exist', () => {
  const raw = [
    '서울에서 KTX로 강릉역까지 가요.',
    '[코레일](https://www.letskorail.com/)과 [고속버스](https://www.kobus.co.kr/)에서 시각을 확인할 수 있어요.',
  ].join(' ');
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2930716',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /열차·버스 시각은/);
});

test('access polish moves dangling 행사 기간 off the tail after page link', () => {
  const raw = [
    '강릉역까지 KTX로 오면 편해요.',
    '[강릉 국수 축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 확인할 수 있어요.',
    '행사 기간은 10/15~18이에요.',
  ].join('\n\n');
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2930716',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  const periodIdx = out.indexOf('행사 기간은 10/15~18');
  const linkIdx = out.indexOf('gateo.kr/korea/?festival=2930716');
  if (periodIdx >= 0 && linkIdx >= 0) assert.ok(periodIdx < linkIdx);
  assert.doesNotMatch(out, /gateo\.kr[^)]+\)[^\n]*\n\n행사\s*기간은/);
});

test('access polish does not re-append 행사 기간 when dates already in body', () => {
  const raw = '강릉역까지 가요. 행사는 10/15~18이에요. [축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 볼 수 있어요.';
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2930716',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.equal((out.match(/행사 기간은 10\/15~18/g) || []).length, 0);
});

test('food fallback uses natural 이/가 있어요', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '맛집',
    contentId: '2930716',
    nearbyRestaurants: [
      { name: '강릉 오금집', distKm: 0.3, cat3: 'A05020100' },
      { name: '만동제과', distKm: 0.1, cat3: 'A05020300' },
      { name: '이쉐프의돈까스', distKm: 0.2, cat3: 'A05020400' },
    ],
  });
  const out = polishMooniFestivalProxyText('맛집을 찾아보세요.', polish);
  assert.match(out, /가까운 곳으로는.*만동제과.*[가이] .*있어요/);
  assert.match(out, /돈까스|돈가스/);
  assert.match(out, /도 있어요/);
  assert.doesNotMatch(out, /\]예요/);
  assert.doesNotMatch(out, /있어요,\s*돈가스인/);
});

test('access polish keeps one timetable pointer when body already mentions korail times', () => {
  const raw = '부산에서 KTX로 오면 편해요. 열차 시간과 요금은 [코레일](https://www.letskorail.com/)에서 확인할 수 있어요.';
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2855626',
    eventStartDate: '20261010',
    eventEndDate: '20261019',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /열차\s*시간과\s*요금/);
  assert.doesNotMatch(out, /열차·버스\s*시각은/);
});

test('sights polish gives festival subject to leading date sentence', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_sights',
    locale: 'ko',
    userText: '볼거리',
    contentId: '2930716',
    festivalTitle: '강릉 국수 축제',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText('10/15~18이에요. 국수 거리가 펼쳐져요.', polish, {
    chipId: 'festival_sights',
    festivalTitle: '강릉 국수 축제',
  });
  assert.match(out, /^강릉 국수 축제(?:은|는) 10\/15~18이에요/);
});

test('proxy baseline without festivalPolish strips food parking tail', () => {
  const raw = '근처 식당이 있어요. 축제장 운영 시간이나 주차 정보는 [공식 홈페이지](https://example.com)에서 확인해요.';
  const out = polishMooniFestivalProxyText(raw, null, {
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '맛집',
  });
  assert.doesNotMatch(out, /주차|운영\s*시간/);
});

test('access hint includes nearest station grounding for palace festival', () => {
  const hint = buildMooniBoundFestivalSystemHint({
    contentId: '1998564',
    title: '궁중문화축전',
    eventStartDate: '20261007',
    eventEndDate: '20261011',
    address: '서울특별시 종로구 사직로 161',
  }, 'ko');
  assert.match(hint, /가까운 역\(GATEO\)/);
  assert.match(hint, /안국역|경복궁역/);
  assert.match(hint, /서울역에는 3호선이 없어요/);
});

test('access polish rewrites impossible Seoul Station Line 3 to palace', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
    eventStartDate: '20261007',
    eventEndDate: '20261011',
    nearbyRestaurants: [],
  });
  const raw = '서울역에서 지하철 3호선 경복궁역까지 가면 편해요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /서울역에서 지하철 3호선 경복궁역/);
  assert.match(out, /서울역에는 3호선이 없어요|안국역|경복궁역/);
});

test('access polish replaces whole mangled palace subway sentence cleanly', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
    nearbyRestaurants: [],
  });
  const raw = '서울역에는 3호선이 없어요. 궁역 인근은 지하철 3호선 안국역·경복궁역이 가까워요에서 내리면 편해요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /가까워요에서/);
  assert.match(out, /안국역이나 경복궁역에서 내리면/);
});

test('access polish drops footer for 열차 상세 시간과 요금은 [코레일]', () => {
  const raw = '서울역에서 KTX를 타요. 열차 상세 시간과 요금은 [코레일](https://www.letskorail.com/)에서 확인할 수 있어요.';
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /열차\s*상세\s*시간과\s*요금은\s*\[코레일\]/);
  assert.doesNotMatch(out, /열차·버스\s*시각은/);
});

test('gangneung access strips ITX mentions', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '서울에서 가는 법',
    contentId: '2930716',
    departureOriginId: 'seoul',
    nearbyRestaurants: [],
  });
  const raw = '서울역에서 KTX·ITX-이음으로 강릉역까지 가요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /ITX/);
  assert.match(out, /KTX/);
  assert.match(out, /강릉역/);
});

test('gangneung ITX strip preserves paragraph breaks', () => {
  const options = {
    chipId: 'festival_access',
    locale: 'ko',
    userText: '서울에서 가는 법',
    contentId: '2930716',
    departureOriginId: 'seoul',
  };
  const raw = '서울역에서 KTX·ITX-이음으로 강릉역까지 가요.\n\n청량리에서도 KTX로 강릉역까지 갈 수 있어요.';
  const out = stripGangneungAccessItxMentions(raw, options);
  assert.match(out, /\n\n/);
  assert.doesNotMatch(out, /ITX/);
  assert.match(out, /청량리/);
});

test('palace access does not inject 서울역 line-3 line when model omitted 서울역', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
    nearbyRestaurants: [],
  });
  const raw = '지하철 3호선 안국역에서 내리면 궁중문화축전 권역에 가까워요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /서울역에는\s*3호선이\s*없어요/);
});

test('palace access rewrite keeps space after sentence period', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    festivalTitle: '궁중문화축전',
    nearbyRestaurants: [],
  });
  const raw = '안국역에서 내리면 편리해요. 궁역 인근은 지하철 3호선 안국역·경복궁역이 가까워요에서 내리면 좋아요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /편리해요\.서울역/);
  assert.doesNotMatch(out, /가까워요에서/);
});

test('access polish drops footer when body has generic 코레일 schedule link', () => {
  const raw = '자세한 열차 시간과 노선은 [코레일](https://www.letskorail.com/)에서 확인해 보세요.';
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '1998564',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /\[코레일\]/);
  assert.doesNotMatch(out, /열차·버스\s*시각은/);
});

test('sights polish dedupes consecutive festival subject sentences', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_sights',
    locale: 'ko',
    userText: '볼거리',
    contentId: '2930716',
    festivalTitle: '강릉 국수 축제',
    nearbyPlaces: ['경포해변', '오죽헌'],
    nearbyRestaurants: [],
  });
  const raw = '강릉 국수 축제는 국수 거리가 펼쳐져요. 강릉 국수 축제는 현장 분위기가 즐거워요.';
  const out = polishMooniFestivalProxyText(raw, polish, {
    chipId: 'festival_sights',
    festivalTitle: '강릉 국수 축제',
  });
  assert.equal((out.match(/강릉 국수 축제는/g) || []).length, 1);
});

test('food baseline strips invented 도보 거리 and menu labels', () => {
  const raw = '만동제과는 도보 거리에 있고 오리 요리도 맛있어요.';
  const out = polishMooniFestivalProxyText(raw, null, {
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '맛집',
  });
  assert.doesNotMatch(out, /도보\s*거리|오리\s*요리/);
});

test('sights polish appends nearbyPlaces line when model only describes program', () => {
  const nearby = ['경포해변', '오죽헌', '강릉향교', '중앙시장', '월화거리', '임당생활문화센터'];
  const polish = parseFestivalPolishParams({
    chipId: 'festival_sights',
    locale: 'ko',
    userText: '볼거리',
    contentId: '2930716',
    festivalTitle: '강릉 국수 축제',
    nearbyPlaces: nearby,
    nearbyRestaurants: [],
  });
  const raw = '국수 거리와 체험 부스가 펼쳐져요. 현장 분위기가 즐거워요.';
  const out = polishMooniFestivalProxyText(raw, polish, {
    chipId: 'festival_sights',
    festivalTitle: '강릉 국수 축제',
  });
  assert.match(out, /근처에는/);
  assert.match(out, /경포해변|오죽헌/);
});

test('food polish uses at least three list shops when data has four', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '맛집',
    contentId: '2930716',
    nearbyRestaurants: [
      { name: '강릉 오금집', distKm: 0.3, cat3: 'A05020100' },
      { name: '만동제과', distKm: 0.1, cat3: 'A05020300' },
      { name: '이쉐프의돈까스', distKm: 0.2, cat3: 'A05020400' },
      { name: '월화엔', distKm: 0.25, cat3: 'A05020100' },
    ],
  });
  const raw = '만동제과만 가까워요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /만동제과/);
  assert.match(out, /이쉐프의돈까스|오금집/);
  const names = ['강릉 오금집', '만동제과', '이쉐프의돈까스'];
  const hit = names.filter((n) => out.includes(n)).length;
  assert.ok(hit >= 3);
});

test('proxy baseline removes 둘러보세요 page closer', () => {
  const raw = '[강릉 국수 축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 둘러보세요.';
  const out = polishMooniFestivalProxyText(raw, null, {
    chipId: 'festival_sights',
    locale: 'ko',
    festivalTitle: '강릉 국수 축제',
  });
  assert.doesNotMatch(out, /둘러\s*보세요/);
});
