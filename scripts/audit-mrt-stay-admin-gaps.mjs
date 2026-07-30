/**
 * 국내 SSOT — 읍·면 + county 공백 stayAdmin 감사 (Phase 0).
 *
 *   npm run audit:mrt-stay-admin-gaps
 *   MRT_ADMIN_GAP_LIVE=1 npm run audit:mrt-stay-admin-gaps
 *   MRT_ADMIN_GAP_LIVE=1 MRT_ADMIN_GAP_LIMIT=50 node scripts/audit-mrt-stay-admin-gaps.mjs
 *
 * 기본 = 오프라인(캐시 있으면 RISK 분류 · 없으면 SSOT 읍·면 이름 후보만).
 * LIVE = Nominatim reverse 순차(딜레이) · 캐시 갱신.
 *
 * Env:
 *   MRT_ADMIN_GAP_LIVE=1
 *   MRT_ADMIN_GAP_LIMIT / OFFSET — LIVE 역지오 상한
 *   MRT_ADMIN_GAP_DELAY_MS — 기본 1100
 *   MRT_ADMIN_GAP_ATTR_LIMIT — 명소 샘플 상한(기본 40)
 *   MRT_ADMIN_GAP_SOURCES — comma: settlements,hubs,attractions (기본 전부)
 *   MRT_ADMIN_GAP_OUT — 출력 디렉터리
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveMrtStayQuery,
  stripKoAdminSuffix,
} from '../src/utils/mrtStayQuery.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const LIVE = process.env.MRT_ADMIN_GAP_LIVE === '1';
const LIMIT = Math.max(0, Number(process.env.MRT_ADMIN_GAP_LIMIT) || 0);
const OFFSET = Math.max(0, Number(process.env.MRT_ADMIN_GAP_OFFSET) || 0);
const DELAY_MS = Math.max(200, Number(process.env.MRT_ADMIN_GAP_DELAY_MS) || 1100);
const ATTR_LIMIT = Math.max(0, Number(process.env.MRT_ADMIN_GAP_ATTR_LIMIT) || 40);
const SOURCES = new Set(
  String(process.env.MRT_ADMIN_GAP_SOURCES || 'settlements,hubs,attractions')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const OUT_DIR =
  process.env.MRT_ADMIN_GAP_OUT ||
  (process.platform === 'win32'
    ? join(ROOT, 'tmp', 'mrt-stay-admin-gaps')
    : '/opt/cursor/artifacts/mrt-stay-admin-gaps');

const CACHE_PATH = join(OUT_DIR, 'nominatim-cache.json');
const UA = 'ProjectDays/1.0 (contact: project.days.dev@gmail.com)';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const KO_TOWNSHIP_RE = /[읍면]$/;
const KO_FINE_ADMIN_RE = /[동읍면리]$/;
/** SSOT 이름 후보 — 공백·2자 시명(정읍) 제외 · stayAdmin RISK는 KO_TOWNSHIP_RE 유지 */
const SSOT_TOWNSHIP_NAME_RE = /^[가-힣]{2,}[읍면]$/;

function isSsotTownshipCandidateName(name) {
  return SSOT_TOWNSHIP_NAME_RE.test(String(name || '').trim());
}

const SETTLEMENTS_PATH = join(ROOT, 'src/pages/Home/data/mapboxSettlementPlaces.json');
const HUBS_PATH = join(ROOT, 'src/pages/Home/data/cityAttractionHubs.json');
const LIST_PATH = join(ROOT, 'src/pages/Home/data/travelSpots-list.json');

function isDomesticKr(country, countryEn) {
  const c = String(country || '').trim();
  const ce = String(countryEn || '').trim().toLowerCase();
  if (!c && !ce) return false;
  if (c === '한국' || c === '대한민국' || c.includes('한국')) return true;
  return (
    ce === 'korea' ||
    ce === 'south korea' ||
    ce === 'republic of korea' ||
    ce.includes('korea')
  );
}

function isKoTownshipName(name) {
  return KO_TOWNSHIP_RE.test(String(name || '').trim());
}

function isKoFineAdminName(name) {
  return KO_FINE_ADMIN_RE.test(String(name || '').trim());
}

function pickOsmAddr(address, keys) {
  if (!address) return '';
  for (const key of keys) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/** geocoding.buildStayAdminFromOsmAddress 인라인 — Node에서 geocoding.js import 불가 */
function buildStayAdminFromOsmAddress(addressKo, addressEn = null) {
  const ko = addressKo || addressEn;
  const en = addressEn || addressKo;
  if (!ko && !en) return null;

  const neighbourhood =
    pickOsmAddr(ko, ['neighbourhood', 'suburb', 'quarter', 'residential']) ||
    pickOsmAddr(en, ['neighbourhood', 'suburb', 'quarter', 'residential']);
  const district =
    pickOsmAddr(ko, ['borough', 'city_district', 'district']) ||
    pickOsmAddr(en, ['borough', 'city_district', 'district']);
  const city =
    pickOsmAddr(ko, ['city', 'town', 'village', 'municipality']) ||
    pickOsmAddr(en, ['city', 'town', 'village', 'municipality']);
  const cityEn = pickOsmAddr(en, ['city', 'town', 'village', 'municipality']);
  const county = pickOsmAddr(ko, ['county']) || pickOsmAddr(en, ['county']);
  const state =
    pickOsmAddr(ko, ['state', 'province', 'region']) ||
    pickOsmAddr(en, ['state', 'province', 'region']);

  if (!neighbourhood && !district && !city && !county && !state) return null;

  return {
    neighbourhood: neighbourhood || '',
    district: district || '',
    city: city || '',
    cityEn: cityEn || '',
    county: county || '',
    state: state || '',
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cacheKey(lat, lng) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    const raw = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

function collectTargets(hubs, settlements) {
  const hubMap = new Map(hubs.map((h) => [h.hubId, h]));
  const krHubs = hubs.filter((h) => isDomesticKr(h.country, h.country_en));
  const targets = [];

  if (SOURCES.has('settlements')) {
    for (const block of settlements) {
      const hub = hubMap.get(block.hubId);
      if (!hub || !isDomesticKr(hub.country, hub.country_en)) continue;
      for (const s of block.settlements || []) {
        if (s.lat == null || s.lng == null) continue;
        targets.push({
          id: `settlement:${s.placeId || `${block.hubId}:${s.name}`}`,
          source: 'settlement',
          hubId: block.hubId,
          placeId: s.placeId || '',
          name: s.name || '',
          name_en: s.name_en || '',
          parentCity: hub.name || '',
          lat: Number(s.lat),
          lng: Number(s.lng),
          featureType: s.featureType || '',
          priority: isSsotTownshipCandidateName(s.name) ? 0 : isKoFineAdminName(s.name) ? 1 : 2,
        });
      }
    }
  }

  if (SOURCES.has('hubs')) {
    for (const hub of krHubs) {
      if (hub.lat == null || hub.lng == null) continue;
      targets.push({
        id: `hub:${hub.hubId}`,
        source: 'hub',
        hubId: hub.hubId,
        placeId: hub.hubId,
        name: hub.name || '',
        name_en: hub.name_en || '',
        parentCity: hub.name || '',
        lat: Number(hub.lat),
        lng: Number(hub.lng),
        featureType: 'hub',
        priority: isSsotTownshipCandidateName(hub.name) ? 0 : 3,
      });
    }
  }

  if (SOURCES.has('attractions')) {
    let attrN = 0;
    for (const hub of krHubs) {
      for (const a of hub.attractions || []) {
        if (a.lat == null || a.lng == null) continue;
        const townshipish = isSsotTownshipCandidateName(a.name) || isKoFineAdminName(a.name);
        if (!townshipish && ATTR_LIMIT > 0 && attrN >= ATTR_LIMIT) continue;
        if (!townshipish) attrN += 1;
        targets.push({
          id: `attraction:${hub.hubId}:${a.name_en || a.name}`,
          source: 'attraction',
          hubId: hub.hubId,
          placeId: '',
          name: a.name || '',
          name_en: a.name_en || '',
          parentCity: hub.name || '',
          lat: Number(a.lat),
          lng: Number(a.lng),
          featureType: a.kind || 'attraction',
          priority: townshipish ? 0 : 4,
        });
      }
    }
  }

  targets.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  return { targets, krHubCount: krHubs.length };
}

async function reverseNominatim(lat, lng) {
  const url = `${NOMINATIM_REVERSE}?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=ko`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    return { error: `HTTP ${res.status}`, addressKo: null, display: '' };
  }
  const data = await res.json();
  return {
    error: null,
    addressKo: data?.address || null,
    display: data?.display_name || '',
  };
}

function classifyRisks(stayAdmin, target) {
  const flags = [];
  const city = String(stayAdmin?.city || '').trim();
  const county = String(stayAdmin?.county || '').trim();
  const neighbourhood = String(stayAdmin?.neighbourhood || '').trim();
  const name = String(target.name || '').trim();

  if (isKoTownshipName(city) && !county) {
    flags.push('RISK_TOWNSHIP_NO_COUNTY');
  }

  const fine = neighbourhood || name;
  const cityWeak = !city || isKoTownshipName(city) || isKoFineAdminName(city);
  const countyWeak = !county;
  if (isKoFineAdminName(fine) && cityWeak && countyWeak) {
    flags.push('RISK_FINE_NO_CITY');
  }

  return flags;
}

/** 1차 keyword가 읍·면 본명 또는 면 축약(대화면→대화) */
function isKwTownship(keyword, stayAdmin) {
  const kw = String(keyword || '').trim();
  if (!kw) return false;
  if (isKoTownshipName(kw)) return true;
  const city = String(stayAdmin?.city || '').trim();
  if (isKoTownshipName(city)) {
    const stripped = stripKoAdminSuffix(city);
    if (stripped && kw === stripped) return true;
  }
  return false;
}

/** city=리+county인데 1차가 리(또는 city 본명) — Phase 1 보강 대상 */
function isKwRiLeading(keyword, stayAdmin) {
  const city = String(stayAdmin?.city || '').trim();
  const county = String(stayAdmin?.county || '').trim();
  const kw = String(keyword || '').trim();
  if (!county || !/리$/.test(city) || !kw) return false;
  return kw === city || /리$/.test(kw);
}

function analyzeTarget(target, stayAdmin, meta = {}) {
  const location = {
    slug: target.placeId || target.hubId || '',
    name: target.name,
    name_en: target.name_en,
    name_ko: target.name,
    country: '한국',
    country_en: 'South Korea',
    parentCity: target.parentCity,
    stayAdmin: stayAdmin || {},
  };
  const q = resolveMrtStayQuery(location);
  const flags = stayAdmin ? classifyRisks(stayAdmin, target) : [];
  if (stayAdmin && isKwTownship(q.keyword, stayAdmin)) flags.push('kw_township');
  if (stayAdmin && isKwRiLeading(q.keyword, stayAdmin)) flags.push('kw_ri_leading');

  return {
    id: target.id,
    source: target.source,
    hubId: target.hubId,
    placeId: target.placeId,
    name: target.name,
    name_en: target.name_en,
    parentCity: target.parentCity,
    lat: target.lat,
    lng: target.lng,
    featureType: target.featureType,
    city: stayAdmin?.city || '',
    county: stayAdmin?.county || '',
    state: stayAdmin?.state || '',
    neighbourhood: stayAdmin?.neighbourhood || '',
    keyword: q.keyword,
    cityHints: (q.cityHints || []).slice(0, 6).join('|'),
    flags: flags.join('|'),
    display: meta.display || '',
    cacheHit: Boolean(meta.cacheHit),
    error: meta.error || '',
  };
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(path, rows) {
  const cols = [
    'id',
    'source',
    'hubId',
    'placeId',
    'name',
    'parentCity',
    'lat',
    'lng',
    'city',
    'county',
    'state',
    'neighbourhood',
    'keyword',
    'cityHints',
    'flags',
    'display',
    'cacheHit',
    'error',
  ];
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map((c) => csvEscape(r[c])).join(','));
  }
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');
}

function printTable(rows, title, limit = 20) {
  console.log(`\n=== ${title} (n=${rows.length}, sample≤${limit}) ===`);
  if (!rows.length) {
    console.log('(none)');
    return;
  }
  for (const r of rows.slice(0, limit)) {
    console.log(
      [
        r.flags || 'ssot_township',
        r.source,
        r.hubId,
        r.name,
        `city=${r.city || '-'}`,
        `county=${r.county || '-'}`,
        `kw=${r.keyword || '-'}`,
      ].join(' | '),
    );
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const hubs = loadJson(HUBS_PATH);
  const settlements = loadJson(SETTLEMENTS_PATH);
  const list = loadJson(LIST_PATH);
  const domesticList = list.filter((s) => isDomesticKr(s.country, s.country_en));

  const { targets, krHubCount } = collectTargets(hubs, settlements);
  const ssotTownship = targets.filter((t) => isSsotTownshipCandidateName(t.name));

  console.log(
    [
      `live=${LIVE}`,
      `targets=${targets.length}`,
      `ssot_township_names=${ssotTownship.length}`,
      `kr_hubs=${krHubCount}`,
      `travelSpots_list_domestic=${domesticList.length}(no coords; auxiliary)`,
      `sources=${[...SOURCES].join('+')}`,
      `attr_limit=${ATTR_LIMIT}`,
      `limit=${LIMIT || 'all'}`,
      `offset=${OFFSET}`,
      `delay_ms=${DELAY_MS}`,
      `out=${OUT_DIR}`,
    ].join(' '),
  );

  const cache = loadCache();
  const FORCE = process.env.MRT_ADMIN_GAP_FORCE === '1';
  let liveQueue = [];
  if (LIVE) {
    liveQueue = targets.filter((t) => {
      if (FORCE) return true;
      const hit = cache[cacheKey(t.lat, t.lng)];
      return !(hit && hit.stayAdmin);
    });
    if (OFFSET) liveQueue = liveQueue.slice(OFFSET);
    if (LIMIT > 0) liveQueue = liveQueue.slice(0, LIMIT);
  }

  let liveOk = 0;
  let liveErr = 0;

  if (LIVE) {
    console.log(`LIVE reverse queue=${liveQueue.length} (Nominatim sequential)`);
    for (let i = 0; i < liveQueue.length; i++) {
      const t = liveQueue[i];
      const key = cacheKey(t.lat, t.lng);
      try {
        const rev = await reverseNominatim(t.lat, t.lng);
        if (rev.error) {
          liveErr += 1;
          cache[key] = {
            lat: t.lat,
            lng: t.lng,
            error: rev.error,
            fetchedAt: new Date().toISOString(),
          };
        } else {
          const stayAdmin = buildStayAdminFromOsmAddress(rev.addressKo, null);
          cache[key] = {
            lat: t.lat,
            lng: t.lng,
            display: rev.display,
            addressKo: rev.addressKo,
            stayAdmin,
            fetchedAt: new Date().toISOString(),
          };
          liveOk += 1;
        }
      } catch (e) {
        liveErr += 1;
        cache[key] = {
          lat: t.lat,
          lng: t.lng,
          error: String(e?.message || e),
          fetchedAt: new Date().toISOString(),
        };
      }
      if ((i + 1) % 25 === 0 || i + 1 === liveQueue.length) {
        saveCache(cache);
        console.log(`  progress ${i + 1}/${liveQueue.length} ok=${liveOk} err=${liveErr}`);
      }
      if (i + 1 < liveQueue.length) await sleep(DELAY_MS);
    }
    saveCache(cache);
  }

  const rows = [];
  let withAdmin = 0;
  let pendingLive = 0;

  for (const t of targets) {
    const key = cacheKey(t.lat, t.lng);
    const hit = cache[key];
    if (hit?.stayAdmin) {
      withAdmin += 1;
      rows.push(
        analyzeTarget(t, hit.stayAdmin, {
          display: hit.display || '',
          cacheHit: !LIVE || Boolean(hit.fetchedAt),
          error: '',
        }),
      );
    } else if (hit?.error) {
      rows.push({
        ...analyzeTarget(t, null, { error: hit.error }),
        flags: 'GEOCODE_ERROR',
      });
    } else {
      pendingLive += 1;
      if (isSsotTownshipCandidateName(t.name)) {
        rows.push({
          id: t.id,
          source: t.source,
          hubId: t.hubId,
          placeId: t.placeId,
          name: t.name,
          name_en: t.name_en,
          parentCity: t.parentCity,
          lat: t.lat,
          lng: t.lng,
          featureType: t.featureType,
          city: '',
          county: '',
          state: '',
          neighbourhood: '',
          keyword: '',
          cityHints: '',
          flags: 'PENDING_LIVE|ssot_township_name',
          display: '',
          cacheHit: false,
          error: '',
        });
      }
    }
  }

  const riskTownship = rows.filter((r) => r.flags.includes('RISK_TOWNSHIP_NO_COUNTY'));
  const riskFine = rows.filter((r) => r.flags.includes('RISK_FINE_NO_CITY'));
  const kwTownship = rows.filter((r) => r.flags.includes('kw_township'));
  const kwRiLeading = rows.filter((r) => r.flags.includes('kw_ri_leading'));
  const pending = rows.filter((r) => r.flags.includes('PENDING_LIVE'));
  const hasCountyTownship = rows.filter(
    (r) =>
      isKoTownshipName(r.city) &&
      r.county &&
      !r.flags.includes('RISK_TOWNSHIP_NO_COUNTY'),
  );

  const adminRows = rows.filter((r) => r.city || r.county || r.state);
  const cityRiWithCounty = adminRows.filter(
    (r) => /리$/.test(r.city) && r.county && !isKoTownshipName(r.city),
  );
  const citySiNoCounty = adminRows.filter(
    (r) => /[시]$/.test(r.city) && !r.county,
  );
  const cityMetro = adminRows.filter((r) => /광역시|특별시|특별자치시/.test(r.city));

  const summary = {
    live: LIVE,
    targets: targets.length,
    withStayAdmin: withAdmin,
    pendingLive,
    liveOk,
    liveErr,
    cacheEntries: Object.keys(cache).length,
    RISK_TOWNSHIP_NO_COUNTY: riskTownship.length,
    RISK_FINE_NO_CITY: riskFine.length,
    kw_township: kwTownship.length,
    kw_ri_leading: kwRiLeading.length,
    township_with_county_ok: hasCountyTownship.length,
    city_ri_with_county: cityRiWithCounty.length,
    city_si_no_county: citySiNoCounty.length,
    city_metro: cityMetro.length,
    ssot_township_names: ssotTownship.length,
    travelSpots_list_domestic: domesticList.map((s) => s.slug),
    outDir: OUT_DIR,
  };

  writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  writeFileSync(join(OUT_DIR, 'rows.json'), JSON.stringify(rows, null, 2), 'utf8');
  writeCsv(join(OUT_DIR, 'risks.csv'), [
    ...riskTownship,
    ...riskFine.filter((r) => !r.flags.includes('RISK_TOWNSHIP_NO_COUNTY')),
    ...kwTownship.filter(
      (r) =>
        !r.flags.includes('RISK_TOWNSHIP_NO_COUNTY') &&
        !r.flags.includes('RISK_FINE_NO_CITY'),
    ),
  ]);
  writeCsv(join(OUT_DIR, 'all-flagged.csv'), rows.filter((r) => r.flags));
  writeFileSync(
    join(OUT_DIR, 'ssot-township-candidates.json'),
    JSON.stringify(
      ssotTownship.map((t) => ({
        id: t.id,
        source: t.source,
        hubId: t.hubId,
        name: t.name,
        parentCity: t.parentCity,
        lat: t.lat,
        lng: t.lng,
      })),
      null,
      2,
    ),
    'utf8',
  );

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));

  printTable(riskTownship, 'RISK_TOWNSHIP_NO_COUNTY');
  printTable(riskFine, 'RISK_FINE_NO_CITY');
  printTable(kwTownship, 'kw_township');
  printTable(kwRiLeading, 'kw_ri_leading (city=리+county · keyword 리 선두)');
  printTable(hasCountyTownship, 'township city + county present (OK path)');
  printTable(cityRiWithCounty, 'city=리 + county (참고 · keyword는 군 선두여야 함)');
  if (pending.length) {
    printTable(pending, 'PENDING_LIVE (ssot 읍·면 name · run with MRT_ADMIN_GAP_LIVE=1)');
  }

  const reportMd = [
    '# MRT stayAdmin 읍·면+county 공백 감사 (Phase 0)',
    '',
    `- live=${LIVE} · targets=${targets.length} · withStayAdmin=${withAdmin} · cache=${Object.keys(cache).length}`,
    `- SSOT 읍·면 이름 후보: ${ssotTownship.length}`,
    '',
    '| 플래그/버킷 | 건수 | 비고 |',
    '|-------------|------|------|',
    `| RISK_TOWNSHIP_NO_COUNTY | ${riskTownship.length} | city=/[읍면]$/ · county 공백 |`,
    `| RISK_FINE_NO_CITY | ${riskFine.length} | fine 동읍면리 · city·county 약함 |`,
    `| kw_township | ${kwTownship.length} | resolveMrtStayQuery 1차=읍면/축약 |`,
    `| kw_ri_leading | ${kwRiLeading.length} | city=리+county · 1차 keyword가 리 |`,
    `| township+county OK | ${hasCountyTownship.length} | #32 시·군 우선 경로 |`,
    `| city=리 + county | ${cityRiWithCounty.length} | OSM village→city · county 있음 |`,
    `| city=시 · county 공백 | ${citySiNoCounty.length} | 시 단위 · 면은 display만 |`,
    `| city=광역시/특별시 | ${cityMetro.length} | |`,
    '',
    '## RISK_TOWNSHIP_NO_COUNTY 샘플',
    '',
  ];
  if (!riskTownship.length) {
    reportMd.push('(none)');
  } else {
    reportMd.push('| hub | name | city | county | keyword |');
    reportMd.push('|-----|------|------|--------|---------|');
    for (const r of riskTownship.slice(0, 30)) {
      reportMd.push(
        `| ${r.hubId} | ${r.name} | ${r.city} | ${r.county || '∅'} | ${r.keyword} |`,
      );
    }
  }
  reportMd.push('', '## township+county OK 샘플', '');
  reportMd.push('| hub | name | city | county | keyword |');
  reportMd.push('|-----|------|------|--------|---------|');
  for (const r of hasCountyTownship.slice(0, 20)) {
    reportMd.push(
      `| ${r.hubId} | ${r.name} | ${r.city} | ${r.county} | ${r.keyword} |`,
    );
  }
  reportMd.push('', '## city=리 + county 샘플 (keyword는 군 선두여야 함)', '');
  reportMd.push(`kw_ri_leading=${kwRiLeading.length}`);
  reportMd.push('| hub | name | city | county | keyword |');
  reportMd.push('|-----|------|------|--------|---------|');
  for (const r of cityRiWithCounty.slice(0, 20)) {
    reportMd.push(
      `| ${r.hubId} | ${r.name} | ${r.city} | ${r.county} | ${r.keyword} |`,
    );
  }
  reportMd.push('');
  writeFileSync(join(OUT_DIR, 'report.md'), reportMd.join('\n'), 'utf8');

  console.log('\nAUDIT OK');
  if (!LIVE && withAdmin === 0) {
    console.log(
      'NOTE: offline with empty cache — RISK counts are 0; ssot_township_names listed for LIVE priority.',
    );
  }
}

main().catch((err) => {
  console.error('AUDIT FAIL', err);
  process.exit(1);
});
