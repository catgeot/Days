import {
  BACK_OVERVIEW_FESTIVAL_ROWS,
  E2E_IMAGE_ORIGIN,
  buildBackOverviewFestivalDetail,
} from './festival-back-overview-fixture.js';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, HEAD, OPTIONS',
  'access-control-allow-headers':
    'authorization, x-client-info, apikey, content-type, accept-profile, prefer',
};

/** @type {typeof BACK_OVERVIEW_FESTIVAL_ROWS[number][]} */
export const NEARBY_CARDS_FESTIVAL_ROWS = [
  ...BACK_OVERVIEW_FESTIVAL_ROWS.filter((r) => r.id === '825295'),
  {
    id: '4106717',
    title: '제13회 21세기 인문가치포럼',
    addr1: '경상북도 안동시',
    mapx: '128.7284000000',
    mapy: '36.5682000000',
    eventStartDate: '20261031',
    eventEndDate: '20261101',
    venue: '안동 e2e venue',
  },
  {
    id: '4128786',
    title: '2026 대한민국 제주정원문화박람회',
    addr1: '제주특별자치도 제주시',
    mapx: '126.5690000000',
    mapy: '33.3950000000',
    eventStartDate: '20260401',
    eventEndDate: '20260531',
    venue: '제주 e2e venue',
  },
];

const ATTRACTION_DIST_KM = [0.35, 0.75, 1.4, 2.8, 4.2, 6.5, 0.55, 3.1, 5.8, 0.9];

function rowById(contentId) {
  return NEARBY_CARDS_FESTIVAL_ROWS.find((r) => r.id === String(contentId)) || null;
}

function festivalOrigin(festivalId) {
  const row = rowById(festivalId);
  if (!row) return null;
  return { lat: Number(row.mapy), lng: Number(row.mapx), row };
}

function attractionRow(festivalId, index, distKm, title) {
  const origin = festivalOrigin(festivalId);
  if (!origin) return null;
  const { lat, lng } = origin;
  const mapy = lat + distKm / 111;
  const mapx = lng;
  return {
    content_id: `e2e-near-${festivalId}-${index}`,
    title,
    addr1: origin.row.addr1,
    addr2: null,
    area_code: festivalId === '4128786' ? '39' : '32',
    mapx: String(mapx),
    mapy: String(mapy),
    first_image: `${E2E_IMAGE_ORIGIN}/near-${festivalId}-${index}.png`,
    active: true,
    content_type_id: '12',
    cat1: 'A02',
    cat2: 'A0201',
    cat3: 'A02010800',
  };
}

const ALL_ATTRACTION_ROWS = NEARBY_CARDS_FESTIVAL_ROWS.flatMap((festival) => {
  const titles4106717 = [
    'e2e안동명소1',
    'e2e안동명소2',
    'e2e안동명소3',
    '예천박물관',
    'e2e안동명소5',
    'e2e안동명소6',
    'e2e안동명소7',
    'e2e안동명소8',
  ];
  return ATTRACTION_DIST_KM.map((distKm, i) => {
    const title =
      festival.id === '4106717'
        ? titles4106717[i] || `e2e안동명소${i + 1}`
        : `e2e명소 ${festival.id} ${i + 1}`;
    return attractionRow(festival.id, i + 1, distKm, title);
  }).filter(Boolean);
});

function parseBBoxFromTourapiUrl(url) {
  const u = new URL(url);
  const num = (key) => {
    const v = u.searchParams.get(key);
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    mapyGte: num('mapy.gte'),
    mapyLte: num('mapy.lte'),
    mapxGte: num('mapx.gte'),
    mapxLte: num('mapx.lte'),
  };
}

function rowInBBox(row, bbox) {
  const lat = Number(row.mapy);
  const lng = Number(row.mapx);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (bbox.mapyGte != null && lat < bbox.mapyGte - 1e-6) return false;
  if (bbox.mapyLte != null && lat > bbox.mapyLte + 1e-6) return false;
  if (bbox.mapxGte != null && lng < bbox.mapxGte - 1e-6) return false;
  if (bbox.mapxLte != null && lng > bbox.mapxLte + 1e-6) return false;
  return true;
}

function findFestivalNearCoords(mapX, mapY) {
  let best = null;
  let bestD2 = Number.POSITIVE_INFINITY;
  for (const row of NEARBY_CARDS_FESTIVAL_ROWS) {
    const lat = Number(row.mapy);
    const lng = Number(row.mapx);
    const dy = (lat - mapY) * 111;
    const cos = Math.cos((mapY * Math.PI) / 180);
    const dx = (lng - mapX) * 111 * cos;
    const d2 = dy * dy + dx * dx;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = row;
    }
  }
  return bestD2 < 4 ? best : null;
}

function restaurantItems(originRow, count) {
  const lat = Number(originRow.mapy);
  const lng = Number(originRow.mapx);
  return Array.from({ length: count }, (_, i) => ({
    contentId: `e2e-food-${originRow.id}-${i + 1}`,
    contentTypeId: '39',
    title: `e2e맛집 ${originRow.id} ${i + 1}`,
    mapx: String(lng),
    mapy: String(lat + (0.4 + i * 0.25) / 111),
    distance: String(400 + i * 250),
    addr1: originRow.addr1,
    firstimage: `${E2E_IMAGE_ORIGIN}/food-${originRow.id}-${i}.png`,
  }));
}

function jsonFulfill(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(payload),
  });
}

function payloadForTourAction(action, body) {
  const contentId = String(body.contentId || body.contentid || '').trim();
  const row = rowById(contentId);

  if (action === 'festivalWindow') {
    return {
      ok: true,
      action: 'festivalWindow',
      items: NEARBY_CARDS_FESTIVAL_ROWS.map((r) => ({
        contentId: r.id,
        contentTypeId: '15',
        title: r.title,
        eventStartDate: r.eventStartDate,
        eventEndDate: r.eventEndDate,
        addr1: r.addr1,
        mapx: r.mapx,
        mapy: r.mapy,
      })),
      rawCount: NEARBY_CARDS_FESTIVAL_ROWS.length,
    };
  }

  if (action === 'festivalDetail' && row) {
    return buildBackOverviewFestivalDetail(row);
  }

  if ((action === 'detailIntro' || action === 'detailCommon') && row) {
    const detail = buildBackOverviewFestivalDetail(row);
    if (action === 'detailIntro') return { ok: true, intro: detail.intro };
    return { ok: true, common: detail.common };
  }

  if (action === 'detailImage' && row) {
    return {
      ok: true,
      items: [
        {
          contentId: row.id,
          contentTypeId: '15',
          originimgurl: `${E2E_IMAGE_ORIGIN}/festival-hero-${row.id}.png`,
          imgname: 'e2e hero',
          serialnum: '1',
        },
      ],
      rawCount: 1,
      fromCache: true,
    };
  }

  if (action === 'searchPhoto') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }

  if (action === 'locationBasedList') {
    const mapX = Number(body.mapX);
    const mapY = Number(body.mapY);
    const ct = String(body.contentTypeId || '').trim();
    const origin = findFestivalNearCoords(mapX, mapY);
    if (!origin) {
      return { ok: true, items: [], rawCount: 0, fromCache: true };
    }
    if (origin.id === '4106717' || ct !== '39') {
      return { ok: true, items: [], rawCount: 0, fromCache: true };
    }
    const items = restaurantItems(origin, 8);
    return { ok: true, items, rawCount: items.length, fromCache: true };
  }

  if (action === 'areaBasedList') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }

  return { ok: true, items: [], fromCache: true };
}

export async function installFestivalNearbyCardsFixtures(context) {
  await context.addInitScript(() => {
    try {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('gateo:nearby-attractions:')) sessionStorage.removeItem(key);
      }
    } catch {
      /* quota */
    }
  });

  await context.route(new RegExp(E2E_IMAGE_ORIGIN.replace(/\./g, '\\.'), 'i'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG_1X1,
    });
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
    const bbox = parseBBoxFromTourapiUrl(route.request().url());
    const rows = ALL_ATTRACTION_ROWS.filter((r) => rowInBBox(r, bbox));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    });
  });

  await context.route(/\/functions\/v1\/transport-proxy/i, async (route) => {
    await jsonFulfill(route, { ok: false, status: 'unavailable' });
  });

  await context.route(/\/functions\/v1\/fetch-place-videos/i, async (route) => {
    await jsonFulfill(route, { success: true, videos: [] });
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
    await jsonFulfill(route, payloadForTourAction(action, body));
  });
}
