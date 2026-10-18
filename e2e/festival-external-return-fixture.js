import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const RECORDED_DETAIL = JSON.parse(
  readFileSync(join(__dir, 'fixtures/festival-2989642-detail.json'), 'utf8'),
);

const E2E_IMAGE_ORIGIN = 'https://e2e-static.gateo.test';
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** @type {Array<{ id: string, slug: string, region: string, title: string, addr1: string, mapx: string, mapy: string, eventStartDate: string, eventEndDate: string, venue: string, homepage: string }>} */
export const EXTERNAL_RETURN_FESTIVALS = [
  {
    id: '8099001',
    slug: 'yanggu-http',
    region: '강원·양구',
    title: '청춘양구 펀치볼 시래기사과축제',
    addr1: '강원특별자치도 양구군 양구읍',
    mapx: '127.989',
    mapy: '38.107',
    eventStartDate: '20261010',
    eventEndDate: '20261012',
    venue: '양구읍 일원',
    homepage: 'http://haean.kr',
    nearby: {
      contentId: '1287701',
      title: 'DMZ야생화공원',
      cardMatch: '야생화',
      homepage: 'http://yanggu-wildflower.e2e.test/',
    },
  },
  {
    id: '2930716',
    slug: 'gangneung',
    region: '강원·강릉',
    title: '강릉 국수 축제',
    addr1: '강원특별자치도 강릉시 경강로 2111 (임당동)',
    mapx: '128.8976016584',
    mapy: '37.7557770169',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    venue: '강릉 월화거리 일원',
    homepage: `${E2E_IMAGE_ORIGIN}/official/gangneung`,
    nearby: {
      contentId: '1287702',
      title: 'e2e 경포대 근처',
      cardMatch: 'e2e 경포대',
      homepage: 'http://gangneung-nearby.e2e.test/',
    },
  },
  {
    id: '637693',
    slug: 'masan',
    region: '경남·마산',
    title: '마산가고파국화축제',
    addr1: '경상남도 창원시 마산합포구',
    mapx: '128.489574',
    mapy: '35.194419',
    eventStartDate: '20261031',
    eventEndDate: '20261108',
    venue: '3·15해양누리공원',
    homepage: `${E2E_IMAGE_ORIGIN}/official/masan`,
    nearby: {
      contentId: '1287703',
      title: 'e2e 마산어시장 근처',
      cardMatch: 'e2e 마산',
      homepage: 'http://masan-nearby.e2e.test/',
    },
  },
];

export const HTTP_HOME_FESTIVAL_ID = EXTERNAL_RETURN_FESTIVALS[0].id;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function rowById(contentId) {
  return EXTERNAL_RETURN_FESTIVALS.find((r) => r.id === String(contentId)) || null;
}

function nearbyByContentId(contentId) {
  const id = String(contentId || '').trim();
  for (const festival of EXTERNAL_RETURN_FESTIVALS) {
    if (festival.nearby?.contentId === id) {
      return { festival, nearby: festival.nearby };
    }
  }
  return null;
}

function nearbySpotRow(festivalRow) {
  const nearby = festivalRow?.nearby;
  if (!nearby) return null;
  return {
    content_id: nearby.contentId,
    title: nearby.title,
    addr1: festivalRow.addr1,
    addr2: null,
    area_code: '32',
    mapx: String(festivalRow.mapx),
    mapy: String(festivalRow.mapy),
    first_image: `${E2E_IMAGE_ORIGIN}/nearby-${nearby.contentId}.png`,
    active: true,
    content_type_id: '12',
    cat1: 'A02',
    cat2: 'A0201',
    cat3: 'A02010800',
    homepage: nearby.homepage,
  };
}

function nearbyDetailItem(match) {
  const { festival, nearby } = match;
  const id = nearby.contentId;
  const hero = `${E2E_IMAGE_ORIGIN}/nearby-${id}.png`;
  return {
    contentId: id,
    contentTypeId: '12',
    title: nearby.title,
    homepage: nearby.homepage,
    overview: `e2e nearby — ${nearby.title}`,
    addr1: festival.addr1,
    firstimage: hero,
    imageUrl: hero,
  };
}

function detailImageItems(contentId, count = 4) {
  return Array.from({ length: count }, (_, i) => ({
    contentId: String(contentId),
    contentTypeId: '15',
    originimgurl: `${E2E_IMAGE_ORIGIN}/festival-${contentId}-${i}.png`,
    imgname: `e2e festival still ${i + 1}`,
    serialnum: String(i + 1),
  }));
}

export function buildExternalReturnFestivalDetail(row) {
  const id = row.id;
  const hero = `${E2E_IMAGE_ORIGIN}/festival-hero-${id}.png`;
  const scrollPad = '\n\n'.repeat(48);
  const program = `${String(RECORDED_DETAIL.intro?.program || '').trim()}${scrollPad}`;
  const overview = `${String(RECORDED_DETAIL.common?.overview || '').trim()}${scrollPad}`;

  return {
    ok: true,
    contentId: id,
    intro: {
      ...RECORDED_DETAIL.intro,
      contentId: id,
      program,
      eventhomepage: row.homepage,
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
      homepage: row.homepage,
      firstimage: hero,
      imageUrl: hero,
    },
    info: (RECORDED_DETAIL.info || []).slice(0, 2).map((entry, index) => ({
      ...entry,
      contentId: id,
      infotext:
        index === 0
          ? `e2e 외부 복귀 QA — ${row.region}`
          : String(entry.infotext || '').slice(0, 120),
    })),
    items: [{ ...RECORDED_DETAIL.intro, contentId: id, program }],
    fromCache: true,
  };
}

/** @deprecated use buildExternalReturnFestivalDetail */
export function buildHttpHomeFestivalDetail() {
  return buildExternalReturnFestivalDetail(EXTERNAL_RETURN_FESTIVALS[0]);
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
  const row = rowById(id);

  if (action === 'festivalWindow') {
    return {
      ok: true,
      action: 'festivalWindow',
      items: EXTERNAL_RETURN_FESTIVALS.map((r) => ({
        contentId: r.id,
        contentTypeId: '15',
        title: r.title,
        eventStartDate: r.eventStartDate,
        eventEndDate: r.eventEndDate,
        addr1: r.addr1,
        mapx: r.mapx,
        mapy: r.mapy,
      })),
      rawCount: EXTERNAL_RETURN_FESTIVALS.length,
    };
  }

  if (action === 'festivalDetail' && row) {
    return buildExternalReturnFestivalDetail(row);
  }

  const near = nearbyByContentId(id);
  if (near) {
    const item = nearbyDetailItem(near);
    if (action === 'detailCommon') return { ok: true, items: [item], common: item };
    if (action === 'detailIntro') return { ok: true, items: [item], intro: item };
    if (action === 'detailImage') {
      return { ok: true, items: detailImageItems(id, 1), rawCount: 1, fromCache: true };
    }
    if (action === 'detailInfo') {
      return { ok: true, items: [], rawCount: 0, fromCache: true };
    }
  }

  if ((action === 'detailIntro' || action === 'detailCommon') && row) {
    const detail = buildExternalReturnFestivalDetail(row);
    if (action === 'detailIntro') return { ok: true, intro: detail.intro };
    return { ok: true, common: detail.common };
  }

  if (action === 'detailImage' && row) {
    return { ok: true, items: detailImageItems(id), rawCount: 4, fromCache: true };
  }

  if (action === 'searchPhoto') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }

  if (action === 'locationBasedList' || action === 'areaBasedList') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }

  return { ok: true, items: [], rawCount: 0, fromCache: true };
}

export async function installFestivalExternalReturnFixtures(context) {
  await context.route(new RegExp(E2E_IMAGE_ORIGIN.replace(/\./g, '\\.'), 'i'), async (route) => {
    const url = route.request().url();
    if (/\/official\//i.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><title>e2e official</title><p>stub official homepage</p>',
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG_1X1,
    });
  });

  await context.route(/^http:\/\/haean\.kr/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<!doctype html><title>haean.kr</title><p>e2e http official</p>',
    });
  });

  for (const festival of EXTERNAL_RETURN_FESTIVALS) {
    const home = festival.nearby?.homepage;
    if (!home || !/^http:\/\//i.test(home)) continue;
    const hostRe = new RegExp(`^${home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    await context.route(hostRe, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><title>${festival.slug} nearby</title><p>e2e http nearby official</p>`,
      });
    });
  }

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
    const rows = EXTERNAL_RETURN_FESTIVALS.map((f) => nearbySpotRow(f)).filter(Boolean);
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
