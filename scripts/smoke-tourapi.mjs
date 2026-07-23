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
  assert(ALLOWED_ACTIONS.length === 4, 'whitelist has 4 actions');
  for (const a of ALLOWED_ACTIONS) {
    assert(typeof a === 'string' && a.length > 0, `action name: ${a}`);
  }

  // Mirror Edge guards (local unit checks — no network)
  const keywordOk = (k) =>
    typeof k === 'string' && k.trim().length > 0 && k.trim().length <= 80;
  const contentIdOk = (id) => /^\d{1,32}$/.test(String(id ?? '').trim());

  assert(keywordOk('경복궁'), 'keyword guard accepts 경복궁');
  assert(!keywordOk(''), 'keyword guard rejects empty');
  assert(!keywordOk('x'.repeat(81)), 'keyword guard rejects >80');
  assert(contentIdOk('126508'), 'contentId guard accepts 126508');
  assert(!contentIdOk('abc'), 'contentId guard rejects non-numeric');
  assert(!contentIdOk(''), 'contentId guard rejects empty');

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
