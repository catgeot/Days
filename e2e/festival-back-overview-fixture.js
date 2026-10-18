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

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

/** @type {Array<{ id: string, title: string, addr1: string, mapx: string, mapy: string, eventStartDate: string, eventEndDate: string, venue: string }>} */
export const BACK_OVERVIEW_FESTIVAL_ROWS = [
  {
    id: '637693',
    title: '마산가고파국화축제',
    addr1: '경상남도 창원시 마산합포구',
    mapx: '128.489574',
    mapy: '35.194419',
    eventStartDate: '20261031',
    eventEndDate: '20261108',
    venue: '3·15해양누리공원',
  },
  {
    id: '638576',
    title: '대한민국 국향대전',
    addr1: '전라남도 함평군 함평읍 곤재로 27',
    mapx: '126.5221985649',
    mapy: '35.0591629478',
    eventStartDate: '20261023',
    eventEndDate: '20261108',
    venue: '함평 엑스포공원 일원',
  },
  {
    id: '2930716',
    title: '강릉 국수 축제',
    addr1: '강원특별자치도 강릉시 경강로 2111 (임당동)',
    mapx: '128.8976016584',
    mapy: '37.7557770169',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    venue: '강릉 월화거리 일원',
  },
  {
    id: '1998564',
    title: '궁중문화축전',
    addr1: '서울특별시 종로구 사직로 161',
    mapx: '126.9769768009',
    mapy: '37.5787676270',
    eventStartDate: '20261007',
    eventEndDate: '20261011',
    venue: '경복궁,창덕궁,덕수궁,창경궁,종묘',
  },
];

const PROGRAM_BODY = String(RECORDED_DETAIL.intro?.program || '').trim();
const OVERVIEW_BODY = String(RECORDED_DETAIL.common?.overview || '').trim();
const PROGRAM_SECTION_REPEATS = 48;
const OVERVIEW_PARAGRAPH_REPEATS = 28;
const DETAIL_IMAGE_COUNT = 144;
const READING_VIDEO_COUNT = 10;

function buildLongProgram() {
  const blocks = [];
  for (let i = 0; i < PROGRAM_SECTION_REPEATS; i += 1) {
    blocks.push(
      `${i + 1}. e2e 무대·체험 블록 ${i + 1}\n` +
        '- 육군 태권도 시범 및 의장대 동작 시범\n' +
        '- 군악대 연주와 장병 공연\n' +
        '- 문화예술단체 초청 공연과 체험 부스\n' +
        '- 푸드트럭과 지역 먹거리 존 운영\n' +
        PROGRAM_BODY,
    );
  }
  return blocks.join('\n\n');
}

function buildLongOverview() {
  const chunks = [];
  for (let i = 0; i < OVERVIEW_PARAGRAPH_REPEATS; i += 1) {
    chunks.push(
      `e2e 개요 단락 ${i + 1}. ${OVERVIEW_BODY} ` +
        '온 가족이 함께 호국의 의미를 배우고 즐길 수 있는 프로그램이 마련되어 있다.',
    );
  }
  return chunks.join('\n\n');
}

function buildLongInfoRows(contentId) {
  const rows = [];
  for (let i = 0; i < 18; i += 1) {
    rows.push({
      fldgubun: '2',
      infoname: `e2e 행사 안내 ${i + 1}`,
      infotext:
        `${i + 1}. 현장 안내 — 셔틀버스는 정각마다 운행하며 주차장은 서측 입구를 이용한다. ` +
        '우천 시 일부 체험은 실내로 이동하며, 문의는 현장 안내 데스크로 연락한다.',
      contentId,
      serialnum: String(100 + i),
      contentTypeId: '15',
    });
  }
  return rows;
}

function buildReadingVideos() {
  return Array.from({ length: READING_VIDEO_COUNT }, (_, i) => ({
    id: `e2evideo${String(i).padStart(3, '0')}`,
    title:
      `e2e 축제 현장 스케치 ${i + 1} — ` +
      '공연 하이라이트와 체험 부스, 야간 경관 영상을 담은 가이드 클립입니다.',
  }));
}

function rowById(contentId) {
  return BACK_OVERVIEW_FESTIVAL_ROWS.find((r) => r.id === String(contentId)) || null;
}

function detailImageItems(contentId, count = DETAIL_IMAGE_COUNT) {
  return Array.from({ length: count }, (_, i) => ({
    contentId: String(contentId),
    contentTypeId: '15',
    originimgurl: `${E2E_IMAGE_ORIGIN}/festival-${contentId}-${i}.png`,
    imgname: `e2e festival still ${i + 1}`,
    serialnum: String(i + 1),
  }));
}

function nearbyItems(originId) {
  const base = Number(originId) || 900000;
  return Array.from({ length: 14 }, (_, i) => ({
    contentId: String(base + i + 1),
    contentTypeId: '12',
    title: `e2e-nearby-${originId}-${i + 1}`,
    mapx: '127.0',
    mapy: '37.5',
    dist: String(200 + i * 50),
  }));
}

export function buildBackOverviewFestivalDetail(row) {
  const id = row.id;
  const hero = `${E2E_IMAGE_ORIGIN}/festival-hero-${id}.png`;
  const program = buildLongProgram();
  const overview = buildLongOverview();
  const info = [
    ...(RECORDED_DETAIL.info || []).map((entry, index) => ({
      ...entry,
      contentId: id,
      infotext:
        index === 0
          ? 'e2e 읽을거리 보조 안내 — 주차·셔틀·현장 유의사항을 확인하세요.'
          : String(entry.infotext || '').slice(0, 200),
    })),
    ...buildLongInfoRows(id),
  ];

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
    info,
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
  const row = rowById(id);

  if (action === 'festivalWindow') {
    return {
      ok: true,
      action: 'festivalWindow',
      items: BACK_OVERVIEW_FESTIVAL_ROWS.map((r) => ({
        contentId: r.id,
        contentTypeId: '15',
        title: r.title,
        eventStartDate: r.eventStartDate,
        eventEndDate: r.eventEndDate,
        addr1: r.addr1,
        mapx: r.mapx,
        mapy: r.mapy,
      })),
      rawCount: BACK_OVERVIEW_FESTIVAL_ROWS.length,
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
      items: detailImageItems(id),
      rawCount: DETAIL_IMAGE_COUNT,
      fromCache: true,
    };
  }

  if (action === 'searchPhoto') {
    return { ok: true, items: [], rawCount: 0, fromCache: true };
  }

  if (action === 'locationBasedList' || action === 'areaBasedList') {
    const nearId = id || BACK_OVERVIEW_FESTIVAL_ROWS[0].id;
    return { ok: true, items: nearbyItems(nearId), rawCount: 6, fromCache: true };
  }

  return { ok: true, items: [], fromCache: true };
}

/**
 * Deterministic TourAPI + Edge stubs for festival back-to-overview E2E (CI example.supabase.co).
 */
export async function installFestivalBackOverviewFixtures(context) {
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
    await jsonFulfill(route, { success: true, videos: buildReadingVideos() });
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
