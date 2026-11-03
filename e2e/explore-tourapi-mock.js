/** Explore Enter — 고산사 등 title exact TourAPI (CI fake Supabase 대체) */
export const EXPLORE_GOSANSA_HONGSEONG_ROW = {
  content_id: '127982',
  title: '홍성 고산사 대웅전',
  addr1: '충청남도 홍성군',
  addr2: '갈마면 고산사길 50',
  area_code: '34',
  sigungu_code: '6',
  mapx: '126.6608333',
  mapy: '36.4544444',
  first_image: null,
  active: true,
  cat1: 'A02',
  cat2: 'A0201',
  cat3: 'A02010800',
  modified_time: '20260101000000',
};

export const EXPLORE_GOSANSA_JECHEON_ROW = {
  content_id: '128421',
  title: '대한불교조계종 고산사',
  addr1: '충청북도 제천시',
  addr2: '화산면',
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

/** @deprecated use EXPLORE_GOSANSA_HONGSEONG_ROW */
export const EXPLORE_GOSANSA_ATTRACTION_ROW = EXPLORE_GOSANSA_HONGSEONG_ROW;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST',
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
    const contentIdEq = hay.match(/content_id=eq\.(\d{1,32})/i);
    let rows = wantsGosansa
      ? [EXPLORE_GOSANSA_HONGSEONG_ROW, EXPLORE_GOSANSA_JECHEON_ROW]
      : [];
    if (contentIdEq) {
      const one = rows.find((r) => r.content_id === contentIdEq[1]);
      rows = one ? [one] : [];
    }
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
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const contentId = String(body.contentId || body.contentid || '').trim();
    const row =
      contentId === EXPLORE_GOSANSA_HONGSEONG_ROW.content_id
        ? EXPLORE_GOSANSA_HONGSEONG_ROW
        : contentId === EXPLORE_GOSANSA_JECHEON_ROW.content_id
          ? EXPLORE_GOSANSA_JECHEON_ROW
          : null;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({
        ok: true,
        item: row
          ? {
              contentid: row.content_id,
              contenttypeid: '12',
              title: row.title,
              addr1: row.addr1,
              mapx: row.mapx,
              mapy: row.mapy,
            }
          : null,
      }),
    });
  });
}
