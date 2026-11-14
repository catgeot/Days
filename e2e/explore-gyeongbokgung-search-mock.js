/** Explore «경복궁» — scenic suggestion one-tap (WebKit 390) */

export const GYEONGBOKGUNG_SCENIC = {
  content_id: '126508',
  content_type_id: '12',
  name: '경복궁',
  title: '경복궁',
  addr1: '서울특별시 종로구 사직로 161',
  addr2: '세종로',
  area_code: '1',
  sigungu_code: '23',
  mapx: '126.977041',
  mapy: '37.579430',
  first_image: 'https://tong.visitkorea.or.kr/cms/resource/e2e-gyeongbokgung.jpg',
  active: true,
  cat1: 'A02',
  cat2: 'A0201',
  cat3: 'A02010100',
  modified_time: '20260101000000',
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST',
};

function itemMatchesKeyword(item, keyword) {
  const k = String(keyword || '').trim().toLowerCase().replace(/\s+/g, '');
  const title = String(item.title || '').toLowerCase().replace(/\s+/g, '');
  return k.length >= 1 && (title.includes(k) || k.includes(title));
}

export async function installExploreGyeongbokgungSearchMock(contextOrPage) {
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
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    const hay = decodeURIComponent(route.request().url());
    const titleNeedles = [...hay.matchAll(/title[.=]ilike\.\*?%?([^%,)&*]+)%?\*?/gi)].map((m) =>
      decodeURIComponent(m[1]).trim().toLowerCase(),
    );
    const match = titleNeedles.some((n) => n.includes('경복') || n.includes('gyeongbok'));
    if (hay.includes('126508') || match) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify([GYEONGBOKGUNG_SCENIC]),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify([]),
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
    const action = String(body.action || body.type || '').trim();
    const contentId = String(body.contentId || body.contentid || '').trim();

    if (action === 'detailCommon' && contentId === GYEONGBOKGUNG_SCENIC.content_id) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          common: {
            contentid: GYEONGBOKGUNG_SCENIC.content_id,
            title: GYEONGBOKGUNG_SCENIC.title,
            addr1: GYEONGBOKGUNG_SCENIC.addr1,
            mapx: GYEONGBOKGUNG_SCENIC.mapx,
            mapy: GYEONGBOKGUNG_SCENIC.mapy,
            firstimage: GYEONGBOKGUNG_SCENIC.first_image,
          },
        }),
      });
      return;
    }

    if (action === 'searchKeyword') {
      const items = [GYEONGBOKGUNG_SCENIC].filter((row) => itemMatchesKeyword(row, body.keyword));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ ok: true, items }),
      });
      return;
    }

    await route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ ok: true }) });
  });
}