#!/usr/bin/env node
/**
 * TourAPI contentTypeId=12 (관광지) 시도별·cat 건수 프로브.
 * LIVE: TOUR_API_SERVICE_KEY 필요.
 * 용도: 테마여행 명승 전량 탐색 규모 확인 (#22).
 *
 *   node scripts/probe-tourapi-scenic-counts.mjs
 */
const KEY = String(process.env.TOUR_API_SERVICE_KEY || '').trim();
const BASE = 'https://apis.data.go.kr/B551011/KorService2';

const AREAS = [
  ['1', '서울'],
  ['2', '인천'],
  ['3', '대전'],
  ['4', '대구'],
  ['5', '광주'],
  ['6', '부산'],
  ['7', '울산'],
  ['8', '세종'],
  ['31', '경기'],
  ['32', '강원'],
  ['33', '충북'],
  ['34', '충남'],
  ['35', '경북'],
  ['36', '경남'],
  ['37', '전북'],
  ['38', '전남'],
  ['39', '제주'],
];

async function getJson(path, params) {
  const url = new URL(`${BASE}/${path}`);
  url.searchParams.set('serviceKey', KEY);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'gateo');
  url.searchParams.set('_type', 'json');
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }
  // serviceKey must not be double-encoded by URLSearchParams in some gateways —
  // rebuild like Edge: raw key + encoded rest
  const qs = new URLSearchParams(url.searchParams);
  qs.delete('serviceKey');
  const finalUrl = `${BASE}/${path}?serviceKey=${KEY}&${qs.toString()}`;
  const res = await fetch(finalUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

function totalCount(body) {
  const n = Number(body?.response?.body?.totalCount);
  return Number.isFinite(n) ? n : 0;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function areaCount(areaCode, extra = {}) {
  const j = await getJson('areaBasedList2', {
    contentTypeId: '12',
    areaCode,
    numOfRows: 1,
    pageNo: 1,
    ...extra,
  });
  return totalCount(j);
}

async function main() {
  if (!KEY) {
    console.error('TOUR_API_SERVICE_KEY missing — skip LIVE probe');
    process.exit(2);
  }

  console.log('=== TourAPI contentTypeId=12 per area ===');
  let total = 0;
  for (const [code, name] of AREAS) {
    const n = await areaCount(code);
    total += n;
    console.log(`${code}\t${name}\t${n}`);
    await sleep(80);
  }
  console.log(`TOTAL_CT12\t${total}`);

  console.log('\n=== cat1 ===');
  for (const cat1 of ['A01', 'A02']) {
    let t = 0;
    for (const [code] of AREAS) {
      t += await areaCount(code, { cat1 });
      await sleep(50);
    }
    console.log(`${cat1}\t${t}`);
  }

  console.log('\n=== cat2 ===');
  for (const cat2 of [
    'A0101',
    'A0102',
    'A0201',
    'A0202',
    'A0203',
    'A0204',
    'A0205',
  ]) {
    let t = 0;
    for (const [code] of AREAS) {
      t += await areaCount(code, { cat2 });
      await sleep(40);
    }
    console.log(`${cat2}\t${t}`);
  }

  console.log('\n=== Seoul sample location coverage (n=100) ===');
  const sample = await getJson('areaBasedList2', {
    contentTypeId: '12',
    areaCode: '1',
    numOfRows: 100,
    pageNo: 1,
  });
  const items = sample?.response?.body?.items?.item;
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  const withMap = arr.filter(
    (i) => i?.mapx && i?.mapy && Number(i.mapx) && Number(i.mapy),
  );
  const withImg = arr.filter((i) => i?.firstimage);
  console.log(
    `items=${arr.length} withMap=${withMap.length} withImg=${withImg.length}`,
  );
  if (arr[0]) {
    console.log(
      'sample fields:',
      ['title', 'mapx', 'mapy', 'addr1', 'cat1', 'cat2', 'cat3', 'contentid']
        .map((k) => `${k}=${arr[0][k] ?? ''}`)
        .join(' · '),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
