/** Explore «빛초롱» — festival 1095732 + scenic POI (touch / Enter E2E) */

export const BITCHCHORONG_FESTIVAL = {
  contentId: '1095732',
  title: '서울빛초롱축제',
  titleEn: 'Seoul Lantern Festival',
  eventStartDate: '20261211',
  eventEndDate: '20270131',
  addr1: '서울특별시 중구 청계천',
  mapx: '126.978',
  mapy: '37.569',
  firstimage: 'https://tong.visitkorea.or.kr/cms/resource/e2e-seoul-lantern.jpg',
};

const GANGWON_FEST_A = {
  contentId: 'gw-mock-1',
  title: '강릉 커피 축제',
  eventStartDate: '20261109',
  eventEndDate: '20261113',
  addr1: '강원특별자치도 강릉시',
};

const GANGWON_FEST_B = {
  contentId: 'gw-mock-2',
  title: '평창 눈꽃축제',
  eventStartDate: '20261220',
  eventEndDate: '20261228',
  addr1: '강원특별자치도 평창군',
};

export const BITCHCHORONG_SCENIC_ROW = {
  content_id: '990011',
  content_type_id: '12',
  name: '빛초롱어린이집',
  title: '빛초롱어린이집',
  addr1: '서울특별시 중구',
  addr2: '을지로',
  area_code: '1',
  sigungu_code: '24',
  mapx: '126.989',
  mapy: '37.566',
  first_image: '',
  active: true,
  cat1: 'A02',
  cat2: 'A0201',
  cat3: 'A02010800',
  modified_time: '20260101000000',
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST',
};

const FESTIVAL_WINDOW_ITEMS = [BITCHCHORONG_FESTIVAL, GANGWON_FEST_A, GANGWON_FEST_B];

function itemMatchesKeyword(item, keyword) {
  const k = String(keyword || '').trim().toLowerCase().replace(/\s+/g, '');
  const title = String(item.title || '').toLowerCase().replace(/\s+/g, '');
  return k.length >= 2 && title.includes(k);
}

export async function installExploreBichchorongSearchMock(contextOrPage) {
  const target =
    typeof contextOrPage.route === 'function' ? contextOrPage : contextOrPage.context();

  await target.route(/api\.mapbox\.com/i, async (route) => {
    const url = route.request().url();
    if (/suggest|forward|retrieve/i.test(url)) {
      const body = {
        suggestions: [
          {
            mapbox_id: 'mock-bichchorong-daycare',
            name: '빛초롱어린이집',
            full_address: '서울특별시 중구',
            feature_type: 'poi',
          },
        ],
        features: [],
      };
      if (/retrieve/i.test(url)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [126.989, 37.566] },
                properties: {
                  name: '빛초롱어린이집',
                  full_address: '서울특별시 중구',
                  mapbox_id: 'mock-bichchorong-daycare',
                },
              },
            ],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
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
    const scenicTitleMatch = titleNeedles.some(
      (n) => n.length >= 2 && (n.includes('빛초롱') || n.includes('bichchorong')),
    );
    if (
      hay.includes('990011') ||
      hay.includes('%EB%B9%9B%EC%B4%88%EB%A1%') ||
      scenicTitleMatch
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify([BITCHCHORONG_SCENIC_ROW]),
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

    if (action === 'festivalWindow') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ ok: true, items: FESTIVAL_WINDOW_ITEMS }),
      });
      return;
    }

    if (action === 'festivalDetail' && contentId === BITCHCHORONG_FESTIVAL.contentId) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          contentId: BITCHCHORONG_FESTIVAL.contentId,
          intro: {
            contentId: BITCHCHORONG_FESTIVAL.contentId,
            contentTypeId: '15',
            eventStartDate: BITCHCHORONG_FESTIVAL.eventStartDate,
            eventEndDate: BITCHCHORONG_FESTIVAL.eventEndDate,
          },
          common: {
            contentid: BITCHCHORONG_FESTIVAL.contentId,
            contenttypeid: '15',
            title: BITCHCHORONG_FESTIVAL.title,
            addr1: BITCHCHORONG_FESTIVAL.addr1,
            mapx: BITCHCHORONG_FESTIVAL.mapx,
            mapy: BITCHCHORONG_FESTIVAL.mapy,
            firstimage: BITCHCHORONG_FESTIVAL.firstimage,
            overview: '서울빛초롱축제 E2E',
          },
        }),
      });
      return;
    }

    if (action === 'detailCommon' && contentId === BITCHCHORONG_SCENIC_ROW.content_id) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          common: {
            contentid: BITCHCHORONG_SCENIC_ROW.content_id,
            title: BITCHCHORONG_SCENIC_ROW.title,
            addr1: BITCHCHORONG_SCENIC_ROW.addr1,
            mapx: BITCHCHORONG_SCENIC_ROW.mapx,
            mapy: BITCHCHORONG_SCENIC_ROW.mapy,
            firstimage: BITCHCHORONG_SCENIC_ROW.first_image,
          },
        }),
      });
      return;
    }

    if (action === 'searchKeyword') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          items: [
            {
              contentId: BITCHCHORONG_SCENIC_ROW.content_id,
              contentid: BITCHCHORONG_SCENIC_ROW.content_id,
              title: BITCHCHORONG_SCENIC_ROW.title,
              addr1: BITCHCHORONG_SCENIC_ROW.addr1,
              mapx: BITCHCHORONG_SCENIC_ROW.mapx,
              mapy: BITCHCHORONG_SCENIC_ROW.mapy,
              contentTypeId: '12',
            },
          ].filter((row) => itemMatchesKeyword(row, body.keyword)),
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ ok: true }) });
  });
}

const GANGWON = { lat: 37.8854, lng: 127.7298 };

export async function installDelayedGangwonGeolocation(page) {
  await page.addInitScript(
    ({ position }) => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition(success) {
            window.setTimeout(
              () =>
                success({
                  coords: { latitude: position.lat, longitude: position.lng, accuracy: 10 },
                  timestamp: Date.now(),
                }),
              400,
            );
          },
          watchPosition: () => 0,
          clearWatch: () => {},
        },
      });
      if (navigator.permissions?.query) {
        const orig = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (desc) => {
          if (desc?.name === 'geolocation') {
            return Promise.resolve({ state: 'granted', onchange: null });
          }
          return orig(desc);
        };
      }
    },
    { position: GANGWON },
  );
}