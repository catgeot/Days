const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST',
};

/** Explore Enter — 고산사 등 title exact TourAPI (CI fake Supabase 대체) */
export const EXPLORE_GOSANSA_ATTRACTION_ROW = {
  content_id: '128866',
  title: '고산사',
  addr1: '충청북도 제천시',
  addr2: '한수동 산 1',
  area_code: '33',
  sigungu_code: '10',
  mapx: '128.2134567',
  mapy: '37.1423456',
  first_image: null,
  active: true,
  cat1: 'A02',
  cat2: 'A0201',
  cat3: 'A02010800',
  modified_time: '20260101000000',
};

export async function installExploreTourapiMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();

  await target.route('**/rest/v1/tourapi_attraction**', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: { ...CORS, 'access-control-allow-methods': 'GET, HEAD, OPTIONS' },
        body: '',
      });
      return;
    }
    if (method !== 'GET') {
      await route.continue();
      return;
    }
    const url = route.request().url();
    const hay = decodeURIComponent(url);
    const wantsGosansa = /고산사/i.test(hay) || /%ea%b3%a0%ec%82%b0%ec%82%ac/i.test(url);
    const rows = wantsGosansa ? [EXPLORE_GOSANSA_ATTRACTION_ROW] : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    });
  });

  await target.route(/\/functions\/v1\/tourapi-proxy/i, async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    if (method !== 'POST') {
      await route.fulfill({ status: 200, headers: CORS, body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({
        ok: true,
        item: {
          contentid: EXPLORE_GOSANSA_ATTRACTION_ROW.content_id,
          contenttypeid: '12',
          title: EXPLORE_GOSANSA_ATTRACTION_ROW.title,
          addr1: EXPLORE_GOSANSA_ATTRACTION_ROW.addr1,
          mapx: EXPLORE_GOSANSA_ATTRACTION_ROW.mapx,
          mapy: EXPLORE_GOSANSA_ATTRACTION_ROW.mapy,
        },
      }),
    });
  });
}
