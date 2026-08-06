#!/usr/bin/env node
/**
 * 국가유산청 OpenAPI — 지정 종목 명승(ccbaKdcd=15) → koreaHeritageScenic.json
 *
 *   npm run sync:cha-scenic
 *   npm run sync:cha-scenic -- --skip-detail
 *
 * 키 불필요. 브라우저 직접 호출 불가 → 배치 sync 후 정적 SSOT.
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(
  __dirname,
  '../src/pages/Home/data/koreaHeritageScenic.json',
);

const LIST_URL = 'https://www.khs.go.kr/cha/SearchKindOpenapiList.do';
const DETAIL_URL = 'https://www.khs.go.kr/cha/SearchKindOpenapiDt.do';
const IMAGE_URL = 'https://www.khs.go.kr/cha/SearchImageOpenapi.do';
const KDCD = '15';
const PAGE_UNIT = 100;
const DETAIL_SLEEP_MS = 70;
const CONTENT_MAX = 3200;
const GALLERY_MAX = 10;

/** CHA 시도코드 → gateo 권역 (51=강원특별자치 · 52=전북특별자치 포함) */
const CHA_CTCD_REGION = {
  11: '수도권',
  23: '수도권',
  31: '수도권',
  32: '강원',
  51: '강원',
  25: '충청',
  45: '충청',
  33: '충청',
  34: '충청',
  24: '전라',
  35: '전라',
  36: '전라',
  52: '전라',
  22: '경상',
  21: '경상',
  26: '경상',
  37: '경상',
  38: '경상',
  50: '제주',
};

const CHA_CTCD_LABEL = {
  11: '서울',
  21: '부산',
  22: '대구',
  23: '인천',
  24: '광주',
  25: '대전',
  26: '울산',
  45: '세종',
  31: '경기',
  32: '강원',
  51: '강원',
  33: '충북',
  34: '충남',
  35: '전북',
  52: '전북',
  36: '전남',
  37: '경북',
  38: '경남',
  50: '제주',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripCdata(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
}

function tag(block, name) {
  const re = new RegExp(
    `<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`,
    'i',
  );
  const m = String(block || '').match(re);
  return m ? stripCdata(m[1]) : '';
}

function parseItems(xml) {
  const out = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function totalCnt(xml) {
  const m = String(xml || '').match(/<totalCnt>\s*(\d+)\s*<\/totalCnt>/i);
  return m ? Number(m[1]) : 0;
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice(7)}`;
  return s;
}

function truncate(text, max) {
  const s = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function heritageHref(ctcd, asno) {
  const q = new URLSearchParams({
    pageNo: '1_1_2_0',
    ccbaKdcd: KDCD,
    ccbaAsno: asno,
    ccbaCtcd: ctcd,
  });
  return `https://www.heritage.go.kr/heri/cul/culSelectDetail.do?${q}`;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'gateo-cha-scenic-sync/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function fetchListPage(pageIndex) {
  const u = new URL(LIST_URL);
  u.searchParams.set('ccbaKdcd', KDCD);
  u.searchParams.set('ccbaCncl', 'N');
  u.searchParams.set('pageUnit', String(PAGE_UNIT));
  u.searchParams.set('pageIndex', String(pageIndex));
  return fetchText(u.toString());
}

async function fetchDetail(ctcd, asno) {
  const u = new URL(DETAIL_URL);
  u.searchParams.set('ccbaKdcd', KDCD);
  u.searchParams.set('ccbaCtcd', ctcd);
  u.searchParams.set('ccbaAsno', asno);
  return fetchText(u.toString());
}

async function fetchImages(ctcd, asno) {
  const u = new URL(IMAGE_URL);
  u.searchParams.set('ccbaKdcd', KDCD);
  u.searchParams.set('ccbaCtcd', ctcd);
  u.searchParams.set('ccbaAsno', asno);
  return fetchText(u.toString());
}

function formatDesignatedAt(raw) {
  const s = String(raw || '').replace(/\D/g, '');
  if (s.length !== 8) return raw || null;
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

function designationNo(asno) {
  const n = Number.parseInt(String(asno || '').slice(0, 6), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseGallery(xml) {
  const urls = [];
  const seen = new Set();
  const re =
    /<imageUrl>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/imageUrl>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const https = toHttps(stripCdata(m[1]));
    if (!https || seen.has(https)) continue;
    seen.add(https);
    urls.push(https);
    if (urls.length >= GALLERY_MAX) break;
  }
  return urls;
}

function mapListItem(block) {
  const ctcd = tag(block, 'ccbaCtcd');
  const asno = tag(block, 'ccbaAsno');
  const cpno = tag(block, 'ccbaCpno');
  const cncl = tag(block, 'ccbaCncl');
  if (cncl === 'Y') return null;
  if (!ctcd || !asno) return null;
  const lat = Number(tag(block, 'latitude'));
  const lng = Number(tag(block, 'longitude'));
  const region = CHA_CTCD_REGION[ctcd] || null;
  const areaLabel = CHA_CTCD_LABEL[ctcd] || tag(block, 'ccbaCtcdNm') || null;
  const sigungu = tag(block, 'ccsiName') || tag(block, 'ccbaAdmin') || '';
  const name = tag(block, 'ccbaMnm1');
  if (!name || !region) return null;
  const id = cpno ? `cha-${cpno}` : `cha-15-${ctcd}-${asno}`;
  return {
    id,
    name,
    nameHanja: tag(block, 'ccbaMnm2') || null,
    region,
    ctcd,
    asno,
    cpno: cpno || null,
    areaLabel,
    locality: sigungu || null,
    lat: Number.isFinite(lat) && lat ? lat : null,
    lng: Number.isFinite(lng) && lng ? lng : null,
    cancelled: false,
    source: 'cha',
    kdcd: KDCD,
    homepage: heritageHref(ctcd, asno),
  };
}

async function main() {
  const skipDetail = process.argv.includes('--skip-detail');
  console.log(`=== CHA 명승(ccbaKdcd=${KDCD}) sync · skipDetail=${skipDetail}`);

  const first = await fetchListPage(1);
  const total = totalCnt(first);
  const pages = Math.max(1, Math.ceil(total / PAGE_UNIT));
  console.log(`totalCnt(ccbaCncl=N)=${total} pages=${pages}`);

  /** @type {ReturnType<typeof mapListItem>[]} */
  const spots = [];
  const seen = new Set();
  for (let p = 1; p <= pages; p += 1) {
    const xml = p === 1 ? first : await fetchListPage(p);
    for (const block of parseItems(xml)) {
      const row = mapListItem(block);
      if (!row || seen.has(row.id)) continue;
      seen.add(row.id);
      spots.push(row);
    }
    if (p < pages) await sleep(60);
  }

  spots.sort((a, b) => {
    const r = String(a.region).localeCompare(String(b.region), 'ko');
    if (r) return r;
    return String(a.name).localeCompare(String(b.name), 'ko');
  });

  if (!skipDetail) {
    let i = 0;
    for (const spot of spots) {
      i += 1;
      try {
        const xml = await fetchDetail(spot.ctcd, spot.asno);
        const item = parseItems(xml)[0] || xml;
        const content = truncate(tag(item, 'content'), CONTENT_MAX);
        const imageUrl = toHttps(tag(item, 'imageUrl'));
        const addr1 = tag(item, 'ccbaLcad') || null;
        const asdt = tag(item, 'ccbaAsdt') || null;
        const quan = tag(item, 'ccbaQuan') || null;
        const gcode = tag(item, 'gcodeName') || null;
        const bcode = tag(item, 'bcodeName') || null;
        const mcode = tag(item, 'mcodeName') || null;
        const scode = tag(item, 'scodeName') || null;
        const poss = tag(item, 'ccbaPoss') || null;
        const admin = tag(item, 'ccbaAdmin') || null;
        const hanja = tag(item, 'ccbaMnm2') || spot.nameHanja;
        spot.nameHanja = hanja || null;
        spot.blurb = content
          ? truncate(content, 120)
          : `${spot.areaLabel || ''} 국가유산 명승`.trim();
        spot.content = content || null;
        spot.imageUrl = imageUrl;
        spot.addr1 = addr1;
        spot.designatedAt = formatDesignatedAt(asdt);
        spot.designatedAtRaw = asdt || null;
        spot.designationNo = designationNo(spot.asno);
        spot.quantity = quan;
        spot.heritageType = gcode;
        spot.heritageKind = bcode;
        spot.category = mcode;
        spot.subCategory = scode || null;
        spot.owner = poss && poss !== '미상' ? poss : poss || null;
        spot.manager = admin || null;
        const dlat = Number(tag(xml, 'latitude') || tag(item, 'latitude'));
        const dlng = Number(tag(xml, 'longitude') || tag(item, 'longitude'));
        if ((!spot.lat || !spot.lng) && Number.isFinite(dlat) && Number.isFinite(dlng)) {
          spot.lat = dlat;
          spot.lng = dlng;
        }

        await sleep(DETAIL_SLEEP_MS);
        const imgXml = await fetchImages(spot.ctcd, spot.asno);
        const gallery = parseGallery(imgXml);
        if (imageUrl && !gallery.includes(imageUrl)) gallery.unshift(imageUrl);
        spot.galleryUrls = gallery.slice(0, GALLERY_MAX);
        if (!spot.imageUrl && spot.galleryUrls[0]) {
          spot.imageUrl = spot.galleryUrls[0];
        }
      } catch (err) {
        console.warn(`detail fail ${spot.id}:`, err?.message || err);
        spot.blurb = `${spot.areaLabel || ''} 국가유산 명승`.trim();
        spot.content = null;
        spot.imageUrl = null;
        spot.galleryUrls = [];
        spot.addr1 = null;
      }
      if (i % 20 === 0 || i === spots.length) {
        console.log(`detail+images ${i}/${spots.length}`);
      }
      await sleep(DETAIL_SLEEP_MS);
    }
  } else {
    for (const spot of spots) {
      spot.blurb = `${spot.areaLabel || ''} 국가유산 명승`.trim();
      spot.content = null;
      spot.imageUrl = null;
      spot.galleryUrls = [];
      spot.addr1 = null;
    }
  }

  const byRegion = {};
  for (const s of spots) {
    byRegion[s.region] = (byRegion[s.region] || 0) + 1;
  }

  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: spots.length,
      source: '국가유산청 OpenAPI SearchKindOpenapiList/Dt + SearchImageOpenapi',
      kdcd: KDCD,
      kdcdLabel: '명승',
      disclaimer:
        '국가유산청 지정 명승 목록입니다. 지정일·면적·분류·해설·사진은 국가유산청 Open API 기준이며, 해제 지정은 제외합니다.',
      byRegion,
      skipDetail,
    },
    spots,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`wrote ${OUTPUT_PATH} count=${spots.length}`);
  console.log('byRegion', byRegion);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
