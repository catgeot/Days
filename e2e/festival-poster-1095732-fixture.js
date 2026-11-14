const E2E_IMAGE = 'https://e2e-static.gateo.test/festival/1095732';
export const FESTIVAL_POSTER_E2E_ID = '1095732';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

export const FESTIVAL_POSTER_WINDOW_ITEM = {
  contentId: FESTIVAL_POSTER_E2E_ID,
  contentTypeId: '15',
  title: '서울빛초롱축제',
  eventStartDate: '20261211',
  eventEndDate: '20270131',
  addr1: '서울특별시 중구 태평로1가',
  mapx: '126.9776330000',
  mapy: '37.5692040000',
  areaCode: '1',
  firstimage: `${E2E_IMAGE}/common-scene.png`,
  imageUrl: `${E2E_IMAGE}/common-scene.png`,
};

export function buildFestivalPoster1095732Detail() {
  return {
    ok: true,
    action: 'festivalDetail',
    contentId: FESTIVAL_POSTER_E2E_ID,
    intro: {
      contentId: FESTIVAL_POSTER_E2E_ID,
      contentTypeId: '15',
      eventStartDate: '20261211',
      eventEndDate: '20270131',
      eventplace: '청계천(청계광장 ~ 삼일교)',
      mapx: '126.9776330000',
      mapy: '37.5692040000',
      sponsor1tel: '02-3788-8168',
    },
    common: {
      contentId: FESTIVAL_POSTER_E2E_ID,
      contentTypeId: '15',
      title: '서울빛초롱축제',
      firstimage: `${E2E_IMAGE}/common-scene.png`,
      imageUrl: `${E2E_IMAGE}/common-scene.png`,
      mapx: '126.9776330000',
      mapy: '37.5692040000',
      addr1: '서울특별시 중구 태평로1가',
      tel: '02-3788-8168',
    },
    info: [],
  };
}

export function buildFestivalPoster1095732Images() {
  return {
    ok: true,
    action: 'detailImage',
    items: [
      {
        contentId: FESTIVAL_POSTER_E2E_ID,
        imgname: '2026 서울빛초롱축제 (6).jpg',
        imageUrl: `${E2E_IMAGE}/scene.jpg`,
      },
      {
        contentId: FESTIVAL_POSTER_E2E_ID,
        imgname: '2026 서울빛초롱축제 포스터.jpg',
        imageUrl: `${E2E_IMAGE}/2026-poster.png`,
      },
      {
        contentId: FESTIVAL_POSTER_E2E_ID,
        imgname: '2025 서울빛초롱축제 포스터.jpg',
        imageUrl: `${E2E_IMAGE}/2025-poster.png`,
      },
    ],
    rawCount: 3,
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

export async function installFestivalPoster1095732Fixtures(target) {
  if (typeof target.addInitScript === 'function') {
    await target.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* private mode */
      }
    });
  }
  await target.route(/tourapi-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
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
    if (action === 'festivalWindow' || action === 'searchFestival') {
      await jsonFulfill(route, {
        ok: true,
        items: [FESTIVAL_POSTER_WINDOW_ITEM],
        rawCount: 1,
      });
      return;
    }
    if (action === 'festivalDetail' || action === 'detailIntro' || action === 'detailCommon') {
      await jsonFulfill(route, buildFestivalPoster1095732Detail());
      return;
    }
    if (action === 'detailImage') {
      await jsonFulfill(route, buildFestivalPoster1095732Images());
      return;
    }
    await jsonFulfill(route, { ok: true, items: [], rawCount: 0 });
  });
  await target.route(/e2e-static\.gateo\.test/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    }),
  );
}