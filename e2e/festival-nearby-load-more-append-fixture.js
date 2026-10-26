import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const RECORDED_DETAIL = JSON.parse(
  readFileSync(join(__dir, 'fixtures/festival-2989642-detail.json'), 'utf8'),
);

export const E2E_NEARBY_APPEND_FESTIVAL_ID = '9995701';
const ORIGIN_LAT = 33.452;
const ORIGIN_LNG = 126.531;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, HEAD, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, accept-profile',
};

const FESTIVAL_ROW = {
  id: E2E_NEARBY_APPEND_FESTIVAL_ID,
  title: 'E2E 주변 더보기 append',
  addr1: '제주특별자치도 제주시 애월읍',
  mapx: String(ORIGIN_LNG),
  mapy: String(ORIGIN_LAT),
  eventStartDate: '20261010',
  eventEndDate: '20261012',
  venue: 'E2E venue',
  homepage: 'https://e2e-static.gateo.test/festival',
};

/** Distances 2–7.5 km — all within initial 8km radius; 4 more unlock on expand. */
export const E2E_NEARBY_APPEND_SPOT_DIST_KM = [
  2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.25, 7.5,
];

function attractionRow(contentId, title, distKm) {
  return {
    content_id: contentId,
    title,
    addr1: '제주특별자치도 제주시',
    addr2: null,
    area_code: '39',
    mapx: String(ORIGIN_LNG),
    mapy: String(ORIGIN_LAT + distKm / 111),
    first_image: null,
    active: true,
    content_type_id: '12',
    cat1: 'A02',
    cat2: 'A0201',
    cat3: 'A02010800',
  };
}

export const E2E_NEARBY_APPEND_ATTRACTION_ROWS = E2E_NEARBY_APPEND_SPOT_DIST_KM.map((distKm, i) =>
  attractionRow(`e2e-near-${i + 1}`, `E2E근처${String(i + 1).padStart(2, '0')}`, distKm),
);

function buildFestivalDetail(row) {
  const id = row.id;
  const hero = 'https://e2e-static.gateo.test/festival-hero.png';
  const scrollPad = '\n\n'.repeat(24);
  const program = `${String(RECORDED_DETAIL.intro?.program || '').trim()}${scrollPad}`;
  const overview = `${String(RECORDED_DETAIL.common?.overview || '').trim()}${scrollPad}`;
  return {
    ok: true,
    contentId: id,
    intro: {
      ...RECORDED_DETAIL.intro,
      contentId: id,
      program,
      eventplace: row.venue,
      eventStartDate: row.eventStartDate,
      eventEndDate: row.eventEndDate,
      mapx: row.mapx,
      mapy: row.mapy,
    },
    common: {
      ...RECORDED_DETAIL.common,
      contentId: id,
      title: row.title,
      addr1: row.addr1,
      mapx: row.mapx,
      mapy: row.mapy,
      overview,
      firstimage: hero,
      imageUrl: hero,
    },
    info: [],
    items: [{ ...RECORDED_DETAIL.intro, contentId: id, program }],
    fromCache: true,
  };
}

function jsonFulfill(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(payload),
  });
}

function payloadForTourAction(action, contentId) {
  const id = String(contentId || '').trim();
  if (action === 'festivalWindow') {
    return {
      ok: true,
      action: 'festivalWindow',
      items: [
        {
          contentId: FESTIVAL_ROW.id,
          contentTypeId: '15',
          title: FESTIVAL_ROW.title,
          eventStartDate: FESTIVAL_ROW.eventStartDate,
          eventEndDate: FESTIVAL_ROW.eventEndDate,
          addr1: FESTIVAL_ROW.addr1,
          mapx: FESTIVAL_ROW.mapx,
          mapy: FESTIVAL_ROW.mapy,
        },
      ],
      rawCount: 1,
    };
  }
  if (action === 'festivalDetail' && id === FESTIVAL_ROW.id) {
    return buildFestivalDetail(FESTIVAL_ROW);
  }
  if (action === 'detailIntro' && id === FESTIVAL_ROW.id) {
    const detail = buildFestivalDetail(FESTIVAL_ROW);
    return { ok: true, intro: detail.intro };
  }
  if (action === 'detailCommon' && id === FESTIVAL_ROW.id) {
    const detail = buildFestivalDetail(FESTIVAL_ROW);
    return { ok: true, common: detail.common };
  }
  if (action === 'detailImage' && id === FESTIVAL_ROW.id) {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }
  if (action === 'searchPhoto') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }
  return { ok: true, items: [], rawCount: 0, fromCache: true };
}

export async function installFestivalNearbyLoadMoreAppendFixtures(context) {
  await context.addInitScript(() => {
    try {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('gateo:nearby-attractions:')) sessionStorage.removeItem(key);
      }
    } catch {
      /* quota */
    }
  });

  await context.route('**/rest/v1/tourapi_attraction**', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          ...CORS,
          'access-control-allow-methods': 'GET, HEAD, OPTIONS',
        },
        body: '',
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(E2E_NEARBY_APPEND_ATTRACTION_ROWS),
    });
  });

  await context.route(/\/functions\/v1\/fetch-place-videos/i, async (route) => {
    await jsonFulfill(route, { ok: true, videos: [] });
  });

  await context.route(/tourapi-proxy/i, async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS, body: '' });
      return;
    }
    if (method !== 'POST') {
      await route.fulfill({ status: 200, headers: CORS, body: '' });
      return;
    }
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    const action = String(body.action || '');
    const contentId = String(body.contentId || body.contentid || '').trim();
    await jsonFulfill(route, payloadForTourAction(action, contentId));
  });
}
