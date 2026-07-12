/**
 * Phase A — 도착지 허브·관문 코퍼스 전수조사 (read-only).
 * overrides · graph precompute · toolkit journey_timeline 병렬 비교 + gateway 빈도표.
 *
 * npm run audit:flight-route-dest-corpus
 * npm run audit:flight-route-dest-corpus -- --skip-toolkit
 *
 * @see plans/flight-route-heuristic-ssot-plan.md · 항공경로 고유데이터 검토 Phase A
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';
import {
  extractArrivalIataCodesFromEssentialGuide,
  extractFlightRouteHubIatasFromEssentialGuide,
  resolveCinemaDestIata,
} from '../src/utils/rentalAirportMatch.js';
import { resolveDestRegion } from '../src/pages/Home/lib/flightRouteGeoRules.js';
import { TRAVEL_SPOT_AIRPORT_OVERRIDES } from './data/travel-spot-airport-overrides.mjs';
import { createSupabaseScriptClient, loadEnvFile } from './lib/supabase-script-env.mjs';
import { fetchAllPlaceToolkits } from './lib/fetch-place-toolkit.mjs';
import {
  buildSpotLookup,
  resolveTravelSpotFromPlaceId,
} from './lib/travel-spot-place-resolve.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'flight-route-dest-corpus.json');
const OUTPUT_MD = join(OUTPUT_DIR, 'flight-route-dest-corpus.md');
const AIRPORTS_JSON = join(ROOT, 'src/pages/Home/data/travelSpotAirports.json');
const ROUTES_JSON = join(ROOT, 'src/pages/Home/data/travelSpotFlightRoutes.json');

const ORIGIN_IATA = 'ICN';
const skipToolkit = process.argv.includes('--skip-toolkit');

const hubByIata = new Map(RENTAL_AIRPORT_HUBS.map((h) => [h.iata, h]));

/** @param {string} a @param {string} b */
function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return a == null && b == null;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/** @param {string[]} hubs */
function normalizeHubs(hubs) {
  if (!Array.isArray(hubs)) return null;
  return hubs
    .map((c) => String(c ?? '').trim().toUpperCase())
    .filter((c) => c.length === 3 && hubByIata.has(c));
}

/**
 * @param {string | null | undefined} iata
 * @returns {string}
 */
function regionForIata(iata) {
  const code = String(iata ?? '').trim().toUpperCase();
  if (!code) return 'unknown';
  const hub = hubByIata.get(code);
  const meta = hub
    ? { latitude_deg: hub.lat, longitude_deg: hub.lng }
    : null;
  return resolveDestRegion(code, meta);
}

/**
 * @param {{ overrideHubs: string[] | null, graphHubs: string[] | null, toolkitHubs: string[] | null, hasExplicitDirect: boolean }} row
 */
function classifyVerdict(row) {
  const { overrideHubs, graphHubs, toolkitHubs, hasExplicitDirect } = row;
  const hasOv = Array.isArray(overrideHubs);
  const hasTk = Array.isArray(toolkitHubs) && toolkitHubs.length > 0;
  const hasGr = Array.isArray(graphHubs);

  if (hasExplicitDirect && !hasTk) return 'override_only';
  if (hasExplicitDirect && hasTk) {
    return toolkitHubs.length === 0 ? 'agree' : 'conflict';
  }

  if (hasOv && hasTk && arraysEqual(overrideHubs, toolkitHubs)) return 'agree';
  if (hasOv && hasGr && !hasTk && arraysEqual(overrideHubs, graphHubs)) return 'agree';
  if (!hasOv && hasTk && hasGr && arraysEqual(toolkitHubs, graphHubs)) return 'agree';

  if (hasOv && hasTk && !arraysEqual(overrideHubs, toolkitHubs)) return 'conflict';
  if (hasOv && hasGr && !hasTk && !arraysEqual(overrideHubs, graphHubs)) return 'conflict';
  if (!hasOv && hasTk && hasGr && !arraysEqual(toolkitHubs, graphHubs)) return 'conflict';

  if (hasOv && !hasTk && !hasGr) return 'override_only';
  if (!hasOv && hasTk && !hasGr) return 'toolkit_only';
  if (!hasOv && !hasTk && hasGr) return 'graph_only';
  if (hasOv && !hasTk) return 'override_only';
  if (!hasOv && hasTk) return 'toolkit_only';
  return 'none';
}

/**
 * Split override hub chain into long-haul vs near-dest (last hub often = gateway).
 * @param {string[] | null} hubs
 * @param {string | null} gatewayIata
 * @param {string} destRegion
 */
function splitHubLayers(hubs, gatewayIata, destRegion) {
  if (!Array.isArray(hubs) || hubs.length === 0) {
    return { longHaulHubs: [], nearDestHubs: [], inferredGateway: gatewayIata };
  }
  const gw = gatewayIata && hubs.includes(gatewayIata) ? gatewayIata : null;
  if (gw) {
    const idx = hubs.indexOf(gw);
    return {
      longHaulHubs: hubs.slice(0, idx),
      nearDestHubs: hubs.slice(idx),
      inferredGateway: gw,
    };
  }
  // Last hub in same dest region → treat as near-dest / gateway candidate
  const last = hubs[hubs.length - 1];
  if (regionForIata(last) === destRegion && destRegion !== 'unknown') {
    return {
      longHaulHubs: hubs.slice(0, -1),
      nearDestHubs: [last],
      inferredGateway: last,
    };
  }
  return { longHaulHubs: hubs, nearDestHubs: [], inferredGateway: gatewayIata };
}

function loadJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function loadToolkitBySlug() {
  /** @type {Map<string, { place_id: string, guide: object, arrivals: string[] | null, hubs: string[] | null }>} */
  const bySlug = new Map();
  if (skipToolkit) {
    console.log('[skip-toolkit] place_toolkit 조회 생략');
    return bySlug;
  }

  loadEnvFile();
  const url = process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      'Supabase 미설정 — toolkit 생략. 재실행: .env 설정 후 npm run audit:flight-route-dest-corpus'
    );
    return bySlug;
  }

  const supabase = createSupabaseScriptClient();
  const lookup = buildSpotLookup(TRAVEL_SPOTS);
  console.log('place_toolkit 조회 중…');
  const rows = await fetchAllPlaceToolkits(supabase, {
    select: 'place_id, essential_guide, toolkit_updated_at',
  });
  console.log('툴킷 행:', rows.length);

  for (const row of rows) {
    const guide = row.essential_guide;
    if (!guide || typeof guide !== 'object') continue;

    const resolved = resolveTravelSpotFromPlaceId(lookup, TRAVEL_SPOTS, row.place_id);
    const spot = resolved?.spot;
    if (!spot?.slug) continue;

    const arrivals = extractArrivalIataCodesFromEssentialGuide(guide);
    const destHint =
      (Array.isArray(arrivals) && arrivals[0]) ||
      TRAVEL_SPOT_AIRPORT_OVERRIDES[spot.slug]?.preferredLinkIata ||
      null;
    const hubs = extractFlightRouteHubIatasFromEssentialGuide(guide, {
      originIata: ORIGIN_IATA,
      finalDestIata: destHint ?? undefined,
    });

    const prev = bySlug.get(spot.slug);
    const updatedAt = row.toolkit_updated_at ?? '';
    if (prev && prev.updatedAt && updatedAt && prev.updatedAt > updatedAt) continue;

    bySlug.set(spot.slug, {
      place_id: row.place_id,
      guide,
      arrivals: arrivals?.length ? arrivals : null,
      hubs: hubs?.length ? normalizeHubs(hubs) : null,
      updatedAt,
    });
  }

  return bySlug;
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# Flight route destination corpus');
  lines.push('');
  lines.push(`generatedAt: \`${report.generatedAt}\``);
  lines.push(`origin: \`${report.originIata}\` · skipToolkit: \`${report.skipToolkit}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|------:|');
  for (const [k, v] of Object.entries(report.summary)) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push('');
  lines.push('## Verdict counts');
  lines.push('');
  lines.push('| Verdict | Count |');
  lines.push('|---------|------:|');
  for (const [k, v] of Object.entries(report.verdictCounts)) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push('');
  lines.push('## Gateway frequency (tripFlightArrival + inferred)');
  lines.push('');
  lines.push('| Gateway | Slug count | Dest regions |');
  lines.push('|---------|----------:|--------------|');
  for (const row of report.gatewayFrequency.slice(0, 40)) {
    lines.push(
      `| ${row.gatewayIata} | ${row.slugCount} | ${row.destRegions.join(', ') || '—'} |`
    );
  }
  lines.push('');
  lines.push('## Near-dest hub frequency (override last-leg / gateway)');
  lines.push('');
  lines.push('| Hub | Slug count | Dest regions |');
  lines.push('|-----|----------:|--------------|');
  for (const row of report.nearDestHubFrequency.slice(0, 40)) {
    lines.push(
      `| ${row.hubIata} | ${row.slugCount} | ${row.destRegions.join(', ') || '—'} |`
    );
  }
  lines.push('');
  lines.push('## Region → top gateways');
  lines.push('');
  for (const [region, gateways] of Object.entries(report.regionGateways)) {
    const top = gateways
      .slice(0, 5)
      .map((g) => `${g.iata}(${g.count})`)
      .join(', ');
    lines.push(`- **${region}**: ${top || '—'}`);
  }
  lines.push('');
  lines.push('## Conflict Top 40 (override vs toolkit hubs)');
  lines.push('');
  lines.push('| Slug | Dest | Override | Toolkit | Graph |');
  lines.push('|------|------|----------|---------|-------|');
  for (const r of report.conflicts.slice(0, 40)) {
    lines.push(
      `| ${r.slug} | ${r.destIata ?? '—'} | ${(r.overrideHubs ?? []).join('→') || '—'} | ${(r.toolkitHubs ?? []).join('→') || '—'} | ${(r.graphHubs ?? []).join('→') || '—'} |`
    );
  }
  lines.push('');
  lines.push('## Quality gates');
  lines.push('');
  lines.push(
    `- toolkit mapped with arrival extract: **${report.quality.toolkitArrivalRate}** (${report.quality.toolkitWithArrival}/${report.quality.toolkitMapped})`
  );
  lines.push(
    `- override hub chains clusterable to gateway pattern: **${report.quality.overrideGatewayClusterRate}** (${report.quality.overrideWithGatewayPattern}/${report.quality.overrideWithHubs})`
  );
  lines.push(
    `- timeline hub vs override agree (both present): **${report.quality.timelineOverrideAgreeRate}** (${report.quality.timelineOverrideAgree}/${report.quality.timelineOverrideCompared})`
  );
  lines.push('');
  lines.push('> timeline hub auto-bake to cinema remains **forbidden** (audit / manual promote only).');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const airportsMap = loadJson(AIRPORTS_JSON) ?? { spots: {} };
  const routesMap = loadJson(ROUTES_JSON) ?? { spots: {} };
  const toolkitBySlug = await loadToolkitBySlug();

  /** @type {object[]} */
  const rows = [];
  const verdictCounts = {
    agree: 0,
    conflict: 0,
    override_only: 0,
    toolkit_only: 0,
    graph_only: 0,
    none: 0,
  };

  let toolkitMapped = 0;
  let toolkitWithArrival = 0;
  let overrideWithHubs = 0;
  let overrideWithGatewayPattern = 0;
  let timelineOverrideCompared = 0;
  let timelineOverrideAgree = 0;

  /** @type {Map<string, { count: number, regions: Set<string>, slugs: string[] }>} */
  const gatewayFreq = new Map();
  /** @type {Map<string, { count: number, regions: Set<string> }>} */
  const nearDestFreq = new Map();
  /** @type {Map<string, Map<string, number>>} */
  const regionGateway = new Map();

  const bumpGateway = (iata, region, slug) => {
    if (!iata) return;
    const cur = gatewayFreq.get(iata) ?? { count: 0, regions: new Set(), slugs: [] };
    cur.count += 1;
    cur.regions.add(region);
    if (cur.slugs.length < 8) cur.slugs.push(slug);
    gatewayFreq.set(iata, cur);
    if (!regionGateway.has(region)) regionGateway.set(region, new Map());
    const rm = regionGateway.get(region);
    rm.set(iata, (rm.get(iata) ?? 0) + 1);
  };

  const bumpNear = (iata, region) => {
    if (!iata) return;
    const cur = nearDestFreq.get(iata) ?? { count: 0, regions: new Set() };
    cur.count += 1;
    cur.regions.add(region);
    nearDestFreq.set(iata, cur);
  };

  for (const spot of TRAVEL_SPOTS) {
    const slug = spot.slug;
    const ov = TRAVEL_SPOT_AIRPORT_OVERRIDES[slug] ?? null;
    const baked = airportsMap.spots?.[slug] ?? null;
    const graphRow = routesMap.spots?.[slug] ?? null;
    const tk = toolkitBySlug.get(slug) ?? null;

    const location = { slug, name: spot.name, lat: spot.lat, lng: spot.lng };
    const destIata =
      resolveCinemaDestIata(location) ||
      ov?.preferredLinkIata ||
      baked?.preferredLinkIata ||
      (tk?.arrivals?.[0] ?? null);

    const destRegion = regionForIata(destIata);

    const hasExplicitDirect =
      Array.isArray(ov?.flightRouteHubIatas) && ov.flightRouteHubIatas.length === 0;
    const overrideHubs = Array.isArray(ov?.flightRouteHubIatas)
      ? normalizeHubs(ov.flightRouteHubIatas)
      : null;

    const tripGw = String(ov?.tripFlightArrivalIata ?? baked?.tripFlightArrivalIata ?? '')
      .trim()
      .toUpperCase();
    const gatewayIata =
      tripGw.length === 3 && tripGw !== destIata && hubByIata.has(tripGw) ? tripGw : null;

    let graphHubs = null;
    if (graphRow && graphRow.source !== 'graph-unresolved') {
      graphHubs = normalizeHubs(graphRow.hubIatas ?? []) ?? [];
    } else if (Array.isArray(baked?.graphFlightRouteHubIatas)) {
      graphHubs = normalizeHubs(baked.graphFlightRouteHubIatas) ?? [];
    }

    const toolkitHubs = tk?.hubs ?? null;
    const toolkitArrivals = tk?.arrivals ?? null;

    if (tk) {
      toolkitMapped += 1;
      if (toolkitArrivals?.length) toolkitWithArrival += 1;
    }

    if (overrideHubs?.length) {
      overrideWithHubs += 1;
    }

    const layers = splitHubLayers(overrideHubs, gatewayIata, destRegion);
    if (overrideHubs?.length && (layers.inferredGateway || layers.nearDestHubs.length)) {
      overrideWithGatewayPattern += 1;
    }

    if (overrideHubs && toolkitHubs) {
      timelineOverrideCompared += 1;
      if (arraysEqual(overrideHubs, toolkitHubs)) timelineOverrideAgree += 1;
    }

    const verdict = classifyVerdict({
      overrideHubs,
      graphHubs,
      toolkitHubs,
      hasExplicitDirect,
    });
    verdictCounts[verdict] = (verdictCounts[verdict] ?? 0) + 1;

    // Toolkit last hub (≠ final) is often the true dest-side gateway (PPT, ATH, BKK…)
    let toolkitNearDest = [];
    let toolkitLongHaul = [];
    if (toolkitHubs?.length) {
      const tkLayers = splitHubLayers(toolkitHubs, gatewayIata, destRegion);
      toolkitNearDest = tkLayers.nearDestHubs;
      toolkitLongHaul = tkLayers.longHaulHubs;
      if (!toolkitNearDest.length && toolkitHubs.length) {
        const last = toolkitHubs[toolkitHubs.length - 1];
        if (last !== destIata) {
          toolkitNearDest = [last];
          toolkitLongHaul = toolkitHubs.slice(0, -1);
        }
      }
    }

    const effectiveGateway =
      gatewayIata ||
      layers.inferredGateway ||
      toolkitNearDest[0] ||
      null;

    if (effectiveGateway) bumpGateway(effectiveGateway, destRegion, slug);
    for (const h of layers.nearDestHubs) bumpNear(h, destRegion);
    for (const h of toolkitNearDest) bumpNear(h, destRegion);
    if (effectiveGateway && !layers.nearDestHubs.includes(effectiveGateway)) {
      bumpNear(effectiveGateway, destRegion);
    }

    const longHaulHubs =
      layers.longHaulHubs.length > 0 ? layers.longHaulHubs : toolkitLongHaul;
    const nearDestHubs =
      layers.nearDestHubs.length > 0 ? layers.nearDestHubs : toolkitNearDest;

    rows.push({
      slug,
      destIata: destIata || null,
      destRegion,
      gatewayIata: effectiveGateway,
      overrideHubs,
      graphHubs,
      toolkitHubs,
      toolkitArrivals,
      hasExplicitDirect,
      longHaulHubs,
      nearDestHubs,
      verdict,
      sources: {
        hasOverride: Boolean(ov),
        hasToolkit: Boolean(tk),
        hasGraph: graphHubs != null,
        bakedSource: baked?.source ?? null,
      },
    });
  }

  const conflicts = rows
    .filter((r) => r.verdict === 'conflict')
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const gatewayFrequency = [...gatewayFreq.entries()]
    .map(([gatewayIata, v]) => ({
      gatewayIata,
      slugCount: v.count,
      destRegions: [...v.regions].sort(),
      sampleSlugs: v.slugs,
    }))
    .sort((a, b) => b.slugCount - a.slugCount);

  const nearDestHubFrequency = [...nearDestFreq.entries()]
    .map(([hubIata, v]) => ({
      hubIata,
      slugCount: v.count,
      destRegions: [...v.regions].sort(),
    }))
    .sort((a, b) => b.slugCount - a.slugCount);

  /** @type {Record<string, { iata: string, count: number }[]>} */
  const regionGateways = {};
  for (const [region, map] of regionGateway.entries()) {
    regionGateways[region] = [...map.entries()]
      .map(([iata, count]) => ({ iata, count }))
      .sort((a, b) => b.count - a.count);
  }

  const pct = (n, d) => (d === 0 ? 'n/a' : `${((100 * n) / d).toFixed(1)}%`);

  const report = {
    generatedAt: new Date().toISOString(),
    originIata: ORIGIN_IATA,
    skipToolkit,
    note:
      'Read-only corpus. Cinema does NOT auto-bake toolkit timeline hubs — promote via overrides only.',
    summary: {
      totalSlugs: rows.length,
      withDestIata: rows.filter((r) => r.destIata).length,
      withGateway: rows.filter((r) => r.gatewayIata).length,
      withOverrideHubs: overrideWithHubs,
      withToolkitMapped: toolkitMapped,
      withToolkitHubs: rows.filter((r) => r.toolkitHubs?.length).length,
      withGraphHubs: rows.filter((r) => r.graphHubs != null).length,
      conflictCount: conflicts.length,
      uniqueGateways: gatewayFrequency.length,
      uniqueNearDestHubs: nearDestHubFrequency.length,
    },
    verdictCounts,
    quality: {
      toolkitMapped,
      toolkitWithArrival,
      toolkitArrivalRate: pct(toolkitWithArrival, toolkitMapped),
      overrideWithHubs,
      overrideWithGatewayPattern,
      overrideGatewayClusterRate: pct(overrideWithGatewayPattern, overrideWithHubs),
      timelineOverrideCompared,
      timelineOverrideAgree,
      timelineOverrideAgreeRate: pct(timelineOverrideAgree, timelineOverrideCompared),
    },
    gatewayFrequency,
    nearDestHubFrequency,
    regionGateways,
    conflicts,
    spots: rows,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), 'utf8');
  writeFileSync(OUTPUT_MD, buildMarkdown(report), 'utf8');

  console.log('Wrote', OUTPUT_JSON);
  console.log('Wrote', OUTPUT_MD);
  console.log('total:', report.summary.totalSlugs);
  console.log('verdicts:', JSON.stringify(verdictCounts));
  console.log('quality:', JSON.stringify(report.quality));
  console.log(
    `unique gateways: ${report.summary.uniqueGateways} · nearDest hubs: ${report.summary.uniqueNearDestHubs}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
