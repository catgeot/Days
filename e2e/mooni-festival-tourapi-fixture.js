import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const E2E_FESTIVAL_ID = '2989642';

const __dir = dirname(fileURLToPath(import.meta.url));
const RECORDED_DETAIL = JSON.parse(
  readFileSync(join(__dir, 'fixtures/festival-2989642-detail.json'), 'utf8'),
);
const RECORDED_WINDOW_EMPTY = JSON.parse(
  readFileSync(join(__dir, 'fixtures/festival-2989642-window-item.json'), 'utf8'),
);

/** Deep-link sheet open (mapx/mapy required) — MOONi staging QA + offline E2E. */
const TRANSPORT_FESTIVAL_DETAIL_STUBS = {
  '637693': {
    ok: true,
    contentId: '637693',
    intro: {
      contentId: '637693',
      contentTypeId: '15',
      eventStartDate: '20261031',
      eventEndDate: '20261108',
      eventplace: '3·15해양누리공원',
      mapx: '128.489574',
      mapy: '35.194419',
    },
    common: {
      contentId: '637693',
      title: '마산가고파국화축제',
      addr1: '경상남도 창원시 마산합포구',
      mapx: '128.489574',
      mapy: '35.194419',
    },
  },
  '2930716': {
    ok: true,
    contentId: '2930716',
    intro: {
      contentId: '2930716',
      contentTypeId: '15',
      eventStartDate: '20261015',
      eventEndDate: '20261018',
      eventplace: '강릉 월화거리 일원',
      mapx: '128.8976016584',
      mapy: '37.7557770169',
    },
    common: {
      contentId: '2930716',
      title: '강릉 국수 축제',
      addr1: '강원특별자치도 강릉시 경강로 2111 (임당동)',
      mapx: '128.8976016584',
      mapy: '37.7557770169',
    },
  },
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonFulfill(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(payload),
  });
}

export function buildFestivalDetailFixture(contentId = E2E_FESTIVAL_ID) {
  const id = String(contentId);
  const transportStub = TRANSPORT_FESTIVAL_DETAIL_STUBS[id];
  if (transportStub) return { ...transportStub };
  if (id === E2E_FESTIVAL_ID) return { ...RECORDED_DETAIL };
  return { ok: true, contentId: id, intro: {}, common: {} };
}

function recordedPayloadForAction(action, contentId, festivalId) {
  const id = String(festivalId);
  const cid = String(contentId || '').trim();
  if (action === 'festivalWindow') return RECORDED_WINDOW_EMPTY;
  if (action === 'festivalDetail') {
    const key = cid || id;
    const transportStub = TRANSPORT_FESTIVAL_DETAIL_STUBS[key];
    if (transportStub) return transportStub;
    if (!cid || cid === id) return RECORDED_DETAIL;
    return {
      ok: true,
      contentId: cid,
      fromCache: true,
      intro: {
        contentId: cid,
        contentTypeId: '15',
        eventStartDate: '20260101',
        eventEndDate: '20260102',
      },
      common: { contentId: cid, title: `stub ${cid}` },
    };
  }
  if (action === 'detailIntro') return { ok: true, intro: RECORDED_DETAIL.intro };
  if (action === 'detailCommon') return { ok: true, common: RECORDED_DETAIL.common };
  return { ok: true, items: [], fromCache: true };
}

/**
 * TourAPI: try live Edge (fast path), fall back to recorded 2989642 fixtures (Chromium / offline).
 */
export async function installFestivalTourApiFixtures(context, { festivalId = E2E_FESTIVAL_ID } = {}) {
  const id = String(festivalId);
  const liveTimeoutMs = Number(process.env.MOONI_TOURAPI_LIVE_TIMEOUT_MS) || 14_000;

  await context.route(/tourapi-proxy/i, async (route) => {
    const method = route.request().method();
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

    if (process.env.MOONI_TOURAPI_STUB_ONLY === '1') {
      await jsonFulfill(route, recordedPayloadForAction(action, contentId, id));
      return;
    }

    try {
      const response = await route.fetch({ timeout: liveTimeoutMs });
      await route.fulfill({ response });
    } catch {
      await jsonFulfill(route, recordedPayloadForAction(action, contentId, id));
    }
  });
}
