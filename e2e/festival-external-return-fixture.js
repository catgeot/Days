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

export const HTTP_HOME_FESTIVAL_ID = '8099001';

export const HTTP_HOME_FESTIVAL_ROW = {
  id: HTTP_HOME_FESTIVAL_ID,
  title: '청춘양구 펀치볼 시래기사과축제',
  addr1: '강원특별자치도 양구군 양구읍',
  mapx: '127.989',
  mapy: '38.107',
  eventStartDate: '20261010',
  eventEndDate: '20261012',
  venue: '양구읍 일원',
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function detailImageItems(contentId, count = 4) {
  return Array.from({ length: count }, (_, i) => ({
    contentId: String(contentId),
    contentTypeId: '15',
    originimgurl: `${E2E_IMAGE_ORIGIN}/festival-${contentId}-${i}.png`,
    imgname: `e2e festival still ${i + 1}`,
    serialnum: String(i + 1),
  }));
}

export function buildHttpHomeFestivalDetail() {
  const row = HTTP_HOME_FESTIVAL_ROW;
  const id = row.id;
  const hero = `${E2E_IMAGE_ORIGIN}/festival-hero-${id}.png`;
  const program = `${String(RECORDED_DETAIL.intro?.program || '').trim()}\n\n`.repeat(12);
  const overview = `${String(RECORDED_DETAIL.common?.overview || '').trim()}\n\n`.repeat(12);

  return {
    ok: true,
    contentId: id,
    intro: {
      ...RECORDED_DETAIL.intro,
      contentId: id,
      program,
      eventhomepage: 'http://haean.kr',
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
      homepage: 'http://haean.kr',
      firstimage: hero,
      imageUrl: hero,
    },
    info: (RECORDED_DETAIL.info || []).slice(0, 2).map((entry, index) => ({
      ...entry,
      contentId: id,
      infotext: index === 0 ? 'e2e 읽을거리 — HTTP 공식 홈 복귀 QA' : String(entry.infotext || ''),
    })),
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
          contentId: HTTP_HOME_FESTIVAL_ROW.id,
          contentTypeId: '15',
          title: HTTP_HOME_FESTIVAL_ROW.title,
          eventStartDate: HTTP_HOME_FESTIVAL_ROW.eventStartDate,
          eventEndDate: HTTP_HOME_FESTIVAL_ROW.eventEndDate,
          addr1: HTTP_HOME_FESTIVAL_ROW.addr1,
          mapx: HTTP_HOME_FESTIVAL_ROW.mapx,
          mapy: HTTP_HOME_FESTIVAL_ROW.mapy,
        },
      ],
      rawCount: 1,
    };
  }

  if (action === 'festivalDetail' && id === HTTP_HOME_FESTIVAL_ID) {
    return buildHttpHomeFestivalDetail();
  }

  if ((action === 'detailIntro' || action === 'detailCommon') && id === HTTP_HOME_FESTIVAL_ID) {
    const detail = buildHttpHomeFestivalDetail();
    if (action === 'detailIntro') return { ok: true, intro: detail.intro };
    return { ok: true, common: detail.common };
  }

  if (action === 'detailImage' && id === HTTP_HOME_FESTIVAL_ID) {
    return { ok: true, items: detailImageItems(id), rawCount: 4, fromCache: true };
  }

  if (action === 'searchPhoto') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }

  if (action === 'locationBasedList' || action === 'areaBasedList') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }

  return { ok: true, items: [], fromCache: true };
}

export async function installFestivalExternalReturnFixtures(context) {
  await context.route(new RegExp(E2E_IMAGE_ORIGIN.replace(/\./g, '\\.'), 'i'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG_1X1,
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
