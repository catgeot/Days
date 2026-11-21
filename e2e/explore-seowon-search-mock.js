/** «서원» Enter — 가나다 앞쪽 200건 뒤에 유네스코 서원을 둔다. */

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer, range',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST',
};

const UNESCO = [
  ['800001', '소수서원 [유네스코 세계유산]', '경상북도 영주시 순흥면', '128.58', '36.92', '35'],
  ['800002', '남계서원 [유네스코 세계유산]', '경상남도 함양군 수동면', '127.75', '35.52', '36'],
  ['800003', '옥산서원 [유네스코 세계유산]', '경상북도 경주시 안강읍', '129.16', '36.01', '35'],
  ['800004', '도산서원 [유네스코 세계유산]', '경상북도 안동시 도산면', '128.84', '36.72', '35'],
  ['800005', '필암서원 [유네스코 세계유산]', '전라남도 장성군 황룡면', '126.78', '35.30', '38'],
  ['800006', '도동서원 [유네스코 세계유산]', '대구광역시 달성군 구지면', '128.40', '35.70', '4'],
  ['800007', '병산서원 [유네스코 세계유산]', '경상북도 안동시 풍천면', '128.62', '36.57', '35'],
  ['800008', '무성서원 [유네스코 세계유산]', '전북특별자치도 정읍시 칠보면', '126.99', '35.56', '37'],
  ['800009', '돈암서원 [유네스코 세계유산]', '충청남도 논산시 연산면', '127.18', '36.21', '34'],
];

function dbRow(contentId, title, addr1, mapx, mapy, areaCode) {
  return {
    content_id: contentId,
    content_type_id: '12',
    title,
    addr1,
    addr2: '',
    area_code: areaCode,
    sigungu_code: '1',
    mapx,
    mapy,
    first_image: '',
    active: true,
    cat1: 'A02',
    cat2: 'A0201',
    cat3: 'A02010500',
    modified_time: '20260101000000',
  };
}

export const SEOWON_SEARCH_ROWS = [
  ...Array.from({ length: 200 }, (_, index) =>
    dbRow(
      String(700000 + index),
      `가${String(index).padStart(3, '0')}서원`,
      '서울특별시 종로구',
      '126.98',
      '37.57',
      '1',
    ),
  ),
  ...UNESCO.map((row) => dbRow(...row)),
  dbRow('800099', '대구광역시 서원구 보건소', '대구광역시 서원구', '128.60', '35.87', '4'),
].sort((a, b) => a.title.localeCompare(b.title, 'ko'));

function rowsForRequest(url) {
  const id = String(url.searchParams.get('content_id') || '').replace(/^eq\./, '');
  if (id) return SEOWON_SEARCH_ROWS.filter((row) => row.content_id === id);
  const hay = decodeURIComponent(url.toString());
  if (!hay.includes('서원') && !hay.toLowerCase().includes('seowon')) return [];
  const offset = Number(url.searchParams.get('offset') || '0');
  const limit = Number(url.searchParams.get('limit') || '0');
  if (!Number.isFinite(offset) || offset < 0) return SEOWON_SEARCH_ROWS;
  if (!limit) return SEOWON_SEARCH_ROWS.slice(offset);
  return SEOWON_SEARCH_ROWS.slice(offset, offset + limit);
}

export async function installExploreSeowonSearchMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();

  await target.route(/api\.mapbox\.com/i, async (route) => {
    const url = route.request().url();
    if (/suggest|forward|retrieve/i.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: [], features: [] }),
      });
      return;
    }
    await route.continue();
  });

  await target.route('**/rest/v1/tourapi_attraction**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    const url = new URL(route.request().url());
    const rows = rowsForRequest(url);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify(rows),
    });
  });

  await target.route(/\/functions\/v1\/tourapi-proxy/i, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ ok: true, items: [] }),
    });
  });
}
