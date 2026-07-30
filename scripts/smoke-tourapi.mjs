/**
 * TourAPI Edge 스모크 — 스키마/가드 + (옵션) 배포된 tourapi-proxy LIVE.
 *
 *   npm run smoke:tourapi
 *   TOURAPI_SMOKE_LIVE=1 npm run smoke:tourapi
 *
 * LIVE: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (.env.local)
 * 키 값·serviceKey는 로그하지 않음.
 */
import { loadEnvFile } from './lib/load-env-file.mjs';

loadEnvFile();

const ALLOWED_ACTIONS = [
  'searchKeyword',
  'detailCommon',
  'detailImage',
  'searchPhoto',
  'searchFestival',
  'areaBasedList',
  'areaCode',
  'detailIntro',
  'detailInfo',
  'festivalWindow',
  'festivalDetail',
];

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

function schemaGuards() {
  assert(ALLOWED_ACTIONS.length === 11, 'whitelist has 11 actions');
  for (const a of ALLOWED_ACTIONS) {
    assert(typeof a === 'string' && a.length > 0, `action name: ${a}`);
  }

  // Mirror Edge guards (local unit checks — no network)
  const keywordOk = (k) =>
    typeof k === 'string' && k.trim().length > 0 && k.trim().length <= 80;
  const contentIdOk = (id) => /^\d{1,32}$/.test(String(id ?? '').trim());
  const yyyymmddOk = (d) => /^\d{8}$/.test(String(d ?? '').trim());
  const contentTypeIdOk = (id) => /^\d{1,4}$/.test(String(id ?? '').trim());
  const areaCodeOk = (c) => /^\d{1,10}$/.test(String(c ?? '').trim());

  assert(keywordOk('경복궁'), 'keyword guard accepts 경복궁');
  assert(!keywordOk(''), 'keyword guard rejects empty');
  assert(!keywordOk('x'.repeat(81)), 'keyword guard rejects >80');
  assert(contentIdOk('126508'), 'contentId guard accepts 126508');
  assert(!contentIdOk('abc'), 'contentId guard rejects non-numeric');
  assert(!contentIdOk(''), 'contentId guard rejects empty');
  assert(yyyymmddOk('20260701'), 'eventStartDate guard accepts YYYYMMDD');
  assert(!yyyymmddOk('2026-07-01'), 'eventStartDate guard rejects dashed');
  assert(contentTypeIdOk('15'), 'contentTypeId guard accepts 15');
  assert(!contentTypeIdOk(''), 'contentTypeId guard rejects empty');
  assert(areaCodeOk('1'), 'areaCode guard accepts 1');
  assert(!areaCodeOk(''), 'areaCode guard rejects empty');

  const sampleShape = {
    ok: true,
    action: 'searchKeyword',
    items: [{ contentId: '126508', title: '경복궁', firstimage: 'https://example.com/a.jpg' }],
    rawCount: 1,
  };
  assert(
    sampleShape.ok === true &&
      Array.isArray(sampleShape.items) &&
      sampleShape.items[0].contentId,
    'response shape { ok, action, items[], rawCount }',
  );
}

async function mappingGuards() {
  const { resolveTourApiPlace, isDomesticKoreaLocation } = await import(
    '../src/utils/tourApiMatch.js'
  );
  const { scoreTourPhotoTitle } = await import(
    '../src/utils/tourApiPhotoRank.js'
  );

  const gb = resolveTourApiPlace('gyeongbokgung');
  assert(gb?.contentId === '126508', 'resolve gyeongbokgung → 126508');
  assert(gb?.photoKeyword === '경복궁', 'resolve gyeongbokgung photoKeyword');
  assert(
    Array.isArray(gb?.photoKeywords) && gb.photoKeywords.includes('경복궁 전경'),
    'resolve gyeongbokgung has scenic photoKeywords',
  );
  assert(
    scoreTourPhotoTitle('경복궁 전경', '경복궁', '경복궁') >
      scoreTourPhotoTitle('국립민속박물관', '경복궁', '경복궁'),
    'scenic title ranks above folk museum',
  );
  assert(
    scoreTourPhotoTitle('국립민속박물관', '경복궁', '경복궁') < 0,
    'off-topic folk museum score < 0',
  );
  assert(
    scoreTourPhotoTitle('서울전경', '서울', '서울') >
      scoreTourPhotoTitle('서울세계불꽃축제', '서울', '서울'),
    'scenic ranks above fireworks festival',
  );
  assert(
    scoreTourPhotoTitle('제주국제공항', '제주', '제주') <
      scoreTourPhotoTitle('성산일출봉 전경', '제주', '제주'),
    'airport ranks below scenic ilchulbong',
  );

  const byName = resolveTourApiPlace('경복궁');
  assert(byName?.slug === 'gyeongbokgung', 'resolve byName 경복궁');

  const seoul = resolveTourApiPlace({ slug: 'seoul', name: '서울', country: '한국' });
  assert(seoul?.photoKeyword === '서울', 'resolve seoul photoKeyword');
  assert(seoul?.curated === true, 'resolve seoul curated');

  const soft = resolveTourApiPlace({ name: '미등록국내테스트', country: '한국' });
  assert(soft?.photoKeyword === '미등록국내테스트', 'soft KR mapping');
  assert(soft?.curated === false, 'soft KR curated=false');
  assert(soft?.contentId == null, 'soft KR no contentId');

  assert(
    isDomesticKoreaLocation({ country: '한국' }),
    'isDomesticKoreaLocation 한국',
  );
  assert(
    !isDomesticKoreaLocation({ country: '일본' }),
    'isDomesticKoreaLocation rejects 일본',
  );
}

async function invokeEdge(action, payload) {
  const url = (process.env.VITE_SUPABASE_URL || 'https://phdjnbfitvmrguqzverm.supabase.co').replace(
    /\/$/,
    '',
  );
  const anon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!anon) {
    throw new Error('LIVE requires VITE_SUPABASE_ANON_KEY');
  }

  const res = await fetch(`${url}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json().catch(() => ({}));
  return { httpStatus: res.status, data };
}

function monthStartYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}${m}01`;
}

async function liveChain() {
  console.log('\n--- LIVE tourapi-proxy ---');

  const kw = await invokeEdge('searchKeyword', {
    keyword: '경복궁',
    numOfRows: 3,
  });
  assert(kw.httpStatus === 200, `searchKeyword HTTP ${kw.httpStatus}`);
  assert(kw.data?.ok === true, `searchKeyword ok (msg=${kw.data?.message || kw.data?.error || '-'})`);
  assert(
    Array.isArray(kw.data?.items) && kw.data.items.length >= 1,
    `searchKeyword items≥1 (rawCount=${kw.data?.rawCount ?? 0})`,
  );

  const hit =
    kw.data.items.find((it) => String(it.contentId) === '126508') || kw.data.items[0];
  const contentId = hit?.contentId;
  assert(Boolean(contentId), `searchKeyword contentId (${hit?.title || '-'})`);

  const detail = await invokeEdge('detailCommon', { contentId });
  assert(detail.httpStatus === 200, `detailCommon HTTP ${detail.httpStatus}`);
  assert(detail.data?.ok === true, `detailCommon ok (msg=${detail.data?.message || detail.data?.error || '-'})`);
  const detailTitle = detail.data?.items?.[0]?.title;
  assert(Boolean(detailTitle), `detailCommon title (${detailTitle || '-'})`);

  const images = await invokeEdge('detailImage', {
    contentId,
    numOfRows: 5,
  });
  assert(images.httpStatus === 200, `detailImage HTTP ${images.httpStatus}`);
  assert(images.data?.ok === true, `detailImage ok (msg=${images.data?.message || images.data?.error || '-'})`);

  const imageUrls = (images.data?.items || [])
    .map((it) => it.imageUrl || it.originimgurl || it.smallimageurl || it.firstimage)
    .filter(Boolean);
  const firstFromDetail =
    detail.data?.items?.[0]?.imageUrl || detail.data?.items?.[0]?.firstimage;
  const hasImage = imageUrls.length >= 1 || Boolean(firstFromDetail);
  assert(
    hasImage,
    `image URL ≥1 (detailImage=${imageUrls.length}, firstimage=${firstFromDetail ? 'yes' : 'no'})`,
  );

  // Optional — photo gallery (skip soft-fail if upstream not approved)
  const photo = await invokeEdge('searchPhoto', {
    keyword: '경복궁',
    numOfRows: 3,
  });
  if (photo.data?.ok && (photo.data.items || []).length > 0) {
    assert(true, `searchPhoto items=${photo.data.items.length}`);
  } else {
    console.log(
      `SKIP  searchPhoto (ok=${photo.data?.ok}, msg=${photo.data?.message || photo.data?.error || '-'})`,
    );
  }

  console.log('\n--- LIVE festival / area ---');

  const fest = await invokeEdge('searchFestival', {
    eventStartDate: monthStartYmd(),
    numOfRows: 5,
  });
  assert(fest.httpStatus === 200, `searchFestival HTTP ${fest.httpStatus}`);
  assert(
    fest.data?.ok === true,
    `searchFestival ok (msg=${fest.data?.message || fest.data?.error || '-'})`,
  );
  assert(
    Array.isArray(fest.data?.items) && fest.data.items.length >= 1,
    `searchFestival items≥1 (rawCount=${fest.data?.rawCount ?? 0})`,
  );
  const festHit = fest.data.items[0];
  assert(
    Boolean(festHit?.contentId) && Boolean(festHit?.title),
    `searchFestival contentId+title (${festHit?.title || '-'})`,
  );
  assert(
    Boolean(festHit?.eventStartDate),
    `searchFestival eventStartDate (${festHit?.eventStartDate || '-'})`,
  );

  const areas = await invokeEdge('areaCode', { numOfRows: 50 });
  assert(areas.httpStatus === 200, `areaCode HTTP ${areas.httpStatus}`);
  assert(
    areas.data?.ok === true,
    `areaCode ok (msg=${areas.data?.message || areas.data?.error || '-'})`,
  );
  assert(
    Array.isArray(areas.data?.items) && areas.data.items.length >= 17,
    `areaCode items≥17 (got=${areas.data?.items?.length ?? 0})`,
  );
  assert(
    Boolean(areas.data.items[0]?.code) && Boolean(areas.data.items[0]?.name),
    `areaCode code+name (${areas.data.items[0]?.name || '-'})`,
  );

  const list = await invokeEdge('areaBasedList', {
    areaCode: '1',
    contentTypeId: '12',
    numOfRows: 5,
  });
  assert(list.httpStatus === 200, `areaBasedList HTTP ${list.httpStatus}`);
  assert(
    list.data?.ok === true,
    `areaBasedList ok (msg=${list.data?.message || list.data?.error || '-'})`,
  );
  assert(
    Array.isArray(list.data?.items) && list.data.items.length >= 1,
    `areaBasedList items≥1 (rawCount=${list.data?.rawCount ?? 0})`,
  );

  const intro = await invokeEdge('detailIntro', {
    contentId: festHit.contentId,
    contentTypeId: festHit.contentTypeId || '15',
  });
  assert(intro.httpStatus === 200, `detailIntro HTTP ${intro.httpStatus}`);
  assert(
    intro.data?.ok === true,
    `detailIntro ok (msg=${intro.data?.message || intro.data?.error || '-'})`,
  );
  assert(
    Array.isArray(intro.data?.items) && intro.data.items.length >= 1,
    `detailIntro items≥1`,
  );

  // Expanded intro fields — soft presence check on a known festival sample
  const sampleId = '2550263'; // 세미원 연꽃문화제 (program 등 확장 필드 기대)
  const introSample = await invokeEdge('detailIntro', {
    contentId: sampleId,
    contentTypeId: '15',
  });
  assert(
    introSample.httpStatus === 200 && introSample.data?.ok === true,
    `detailIntro sample ${sampleId} ok`,
  );
  const introRow = introSample.data?.items?.[0] || {};
  const introExtendedKeys = [
    'program',
    'agelimit',
    'sponsor2',
    'sponsor2tel',
    'spendtimefestival',
    'discountinfofestival',
    'bookingplace',
    'placeinfo',
    'subevent',
  ];
  const introHasAnyExtended = introExtendedKeys.some((k) =>
    Boolean(String(introRow[k] || '').trim()),
  );
  assert(
    introHasAnyExtended || Boolean(introRow.sponsor1 || introRow.playtime),
    `detailIntro sample has extended or core fields (keys=${Object.keys(introRow).join(',')})`,
  );
  // Normalize must forward keys when upstream has them (not strip unknown)
  for (const k of introExtendedKeys) {
    if (introRow[k] != null) {
      assert(
        typeof introRow[k] === 'string' || typeof introRow[k] === 'number',
        `detailIntro extended field type ${k}`,
      );
    }
  }

  const info = await invokeEdge('detailInfo', {
    contentId: festHit.contentId,
    contentTypeId: festHit.contentTypeId || '15',
    numOfRows: 20,
  });
  assert(info.httpStatus === 200, `detailInfo HTTP ${info.httpStatus}`);
  assert(
    info.data?.ok === true,
    `detailInfo ok (msg=${info.data?.message || info.data?.error || '-'})`,
  );
  assert(Array.isArray(info.data?.items), `detailInfo items array`);
  if ((info.data?.items || []).length > 0) {
    const row = info.data.items[0];
    assert(
      Boolean(row.infoname || row.infotext),
      `detailInfo normalize infoname/infotext (${row.infoname || '-'})`,
    );
  } else {
    // Some festivals have empty detailInfo — verify sample with content
    const infoSample = await invokeEdge('detailInfo', {
      contentId: sampleId,
      contentTypeId: '15',
      numOfRows: 20,
    });
    assert(
      infoSample.httpStatus === 200 && infoSample.data?.ok === true,
      `detailInfo sample ${sampleId} ok`,
    );
    const sampleItems = infoSample.data?.items || [];
    if (sampleItems.length > 0) {
      assert(
        Boolean(sampleItems[0].infoname || sampleItems[0].infotext),
        `detailInfo sample normalize infoname/infotext`,
      );
    } else {
      console.log(`SKIP  detailInfo sample empty (rawCount=${infoSample.data?.rawCount ?? 0})`);
    }
  }

  console.log('\n--- LIVE festivalWindow / festivalDetail (S4 cache) ---');

  const window1 = await invokeEdge('festivalWindow', {});
  assert(window1.httpStatus === 200, `festivalWindow HTTP ${window1.httpStatus}`);
  assert(
    window1.data?.ok === true,
    `festivalWindow ok (msg=${window1.data?.message || window1.data?.error || '-'})`,
  );
  assert(
    Array.isArray(window1.data?.items) && window1.data.items.length >= 1,
    `festivalWindow items≥1 (got=${window1.data?.items?.length ?? 0})`,
  );
  assert(
    typeof window1.data?.fromCache === 'boolean',
    `festivalWindow fromCache boolean (${window1.data?.fromCache})`,
  );
  const windowHit = window1.data.items[0];
  assert(
    Boolean(windowHit?.contentId) && Boolean(windowHit?.title),
    `festivalWindow contentId+title (${windowHit?.title || '-'})`,
  );

  const window2 = await invokeEdge('festivalWindow', {});
  assert(
    window2.data?.ok === true && Array.isArray(window2.data?.items),
    `festivalWindow 2nd ok (fromCache=${window2.data?.fromCache})`,
  );
  assert(
    window2.data.fromCache === true || window2.data.stale === true ||
      window2.data.items.length >= 1,
    `festivalWindow 2nd reusable (fromCache=${window2.data?.fromCache}, stale=${window2.data?.stale})`,
  );

  const detailBundle = await invokeEdge('festivalDetail', {
    contentId: windowHit.contentId,
    contentTypeId: windowHit.contentTypeId || '15',
  });
  assert(
    detailBundle.httpStatus === 200,
    `festivalDetail HTTP ${detailBundle.httpStatus}`,
  );
  assert(
    detailBundle.data?.ok === true,
    `festivalDetail ok (msg=${detailBundle.data?.message || detailBundle.data?.error || '-'})`,
  );
  assert(
    Boolean(detailBundle.data?.intro || detailBundle.data?.common) ||
      (Array.isArray(detailBundle.data?.info) && detailBundle.data.info.length > 0),
    `festivalDetail has intro|common|info (fromCache=${detailBundle.data?.fromCache})`,
  );

  const detail2 = await invokeEdge('festivalDetail', {
    contentId: windowHit.contentId,
    contentTypeId: windowHit.contentTypeId || '15',
  });
  assert(
    detail2.data?.ok === true,
    `festivalDetail 2nd ok (fromCache=${detail2.data?.fromCache})`,
  );

  // Guard: unknown action rejected
  const bad = await invokeEdge('notAnAction', { keyword: 'x' });
  assert(
    bad.data?.ok === false,
    `unknown action rejected (ok=${bad.data?.ok})`,
  );
}

async function main() {
  console.log('TourAPI smoke — schema/guards');
  schemaGuards();

  console.log('\nTourAPI smoke — slug↔contentId mapping');
  await mappingGuards();

  if (process.env.TOURAPI_SMOKE_LIVE === '1') {
    await liveChain();
  } else {
    console.log('\n(LIVE skipped — set TOURAPI_SMOKE_LIVE=1 to invoke Edge)');
  }

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll TourAPI smoke checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
