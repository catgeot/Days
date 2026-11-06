/** Explore Enter — 고산사 등 title exact TourAPI (CI fake Supabase 대체) */
export const EXPLORE_GOSANSA_HONGSEONG_ROW = {
  content_id: '125901',
  title: '고산사(홍성)',
  addr1: '충청남도 홍성군 결성면',
  addr2: '만해로127번길 35-99',
  area_code: '34',
  sigungu_code: '6',
  mapx: '126.5373285055',
  mapy: '36.5450325186',
  first_image: 'https://tong.visitkorea.or.kr/cms/resource/25/4125825_image2_1.jpg',
  active: true,
  cat1: 'A02',
  cat2: 'A0201',
  cat3: 'A02010800',
  modified_time: '20261021171150',
};

export const EXPLORE_GOSANSA_JANGHEUNG_ROW = {
  content_id: '127937',
  title: '고산사',
  addr1: '전라남도 장흥군',
  addr2: '회진면',
  area_code: '38',
  sigungu_code: '8',
  mapx: '126.7842',
  mapy: '34.6415',
  first_image: 'https://tong.visitkorea.or.kr/cms/e2e-gosansa-jangheung.jpg',
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

const GOSANSA_ROWS = [
  EXPLORE_GOSANSA_HONGSEONG_ROW,
  EXPLORE_GOSANSA_JANGHEUNG_ROW,
  EXPLORE_GOSANSA_JECHEON_ROW,
];

const TOUR_OVERVIEW_BY_ID = {
  '125901':
    '고산사는 충남 홍성 청룡산에 있으며, 창건연대는 미상이나 신라말에 도선국사가 창건하였다고 전해진다.',
  '127982':
    '고산사는 충남 홍성 청룡산에 있으며, 창건연대는 미상이나 신라말에 도선국사가 창건하였다고 전해진다.',
  '127937': '장흥 고산사는 전라남도 장흥군 회진면에 있는 사찰입니다.',
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST',
};

/** PostgREST title ilike(%needle%) — 운영 DB와 같이 needle 부분 일치만 반환 («고산사홍성» → 0건) */
function rowMatchesTitleIlike(row, decodedUrl) {
  const needles = [...decodedUrl.matchAll(/title[.=]ilike\.\*?%?([^%,)&*]+)%?\*?/gi)].map((m) =>
    m[1].trim().toLowerCase(),
  );
  if (!needles.length) return true;
  const title = String(row.title || '').toLowerCase();
  return needles.some((n) => n && title.includes(n));
}

/** TourAPI searchKeyword2 — title 부분 일치 */
function itemMatchesKeyword(item, keyword) {
  const k = String(keyword || '').trim().toLowerCase();
  if (!k) return true;
  const title = String(item.title || '').toLowerCase();
  return title.includes(k) || title.replace(/\s+/g, '').includes(k.replace(/\s+/g, ''));
}

function rowByContentId(id) {
  const resolved = String(id || '').trim() === '127982' ? '125901' : String(id || '').trim();
  return GOSANSA_ROWS.find((r) => r.content_id === resolved) || null;
}

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
    const contentIdEq = hay.match(/content_id=eq\.(\d{1,32})/i);
    const sigunguEq = hay.match(/sigungu_code=eq\.(\d+)/i);
    let rows = [];
    if (contentIdEq) {
      const one = rowByContentId(contentIdEq[1]);
      rows = one ? [one] : [];
    } else if (sigunguEq) {
      rows = GOSANSA_ROWS.filter((r) => String(r.sigungu_code) === sigunguEq[1]);
    } else {
      rows = [...GOSANSA_ROWS];
    }
    rows = rows.filter((r) => rowMatchesTitleIlike(r, hay));
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
    const action = String(body.action || body.type || '').trim();
    const contentId = String(body.contentId || body.contentid || '').trim();
    const row = rowByContentId(contentId);

    if (action === 'detailCommon' && row) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          items: [
            {
              contentid: row.content_id,
              contenttypeid: '12',
              title: row.title,
              addr1: row.addr1,
              addr2: row.addr2,
              mapx: row.mapx,
              mapy: row.mapy,
              overview: TOUR_OVERVIEW_BY_ID[row.content_id] || row.title,
              firstimage: row.first_image,
            },
          ],
          common: {
            contentid: row.content_id,
            contenttypeid: '12',
            title: row.title,
            addr1: row.addr1,
            addr2: row.addr2,
            mapx: row.mapx,
            mapy: row.mapy,
            overview: TOUR_OVERVIEW_BY_ID[row.content_id] || row.title,
            firstimage: row.first_image,
          },
        }),
      });
      return;
    }

    if (action === 'searchKeyword') {
      const courseRow = {
        contentId: '2677792',
        contentid: '2677792',
        title: '홍성 고산사 대웅전',
        addr1: '충청남도 홍성군',
        mapx: '126.66',
        mapy: '36.6',
        contentTypeId: '25',
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ok: true,
          items: [
            ...GOSANSA_ROWS.map((row) => ({
              contentId: row.content_id,
              contentid: row.content_id,
              title: row.title,
              addr1: row.addr1,
              addr2: row.addr2,
              mapx: row.mapx,
              mapy: row.mapy,
              firstimage: row.first_image,
              contentTypeId: '12',
            })),
            courseRow,
          ].filter((item) => itemMatchesKeyword(item, body.keyword)),
        }),
      });
      return;
    }

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
              firstimage: row.first_image,
            }
          : null,
      }),
    });
  });
}
