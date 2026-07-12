/**
 * Phase 2 — Heuristic Router vs OpenFlights graph diff audit.
 *
 * cinemaSafe profile만 heuristic 후보 (timeline auto-bake 금지).
 * conflict(dest-corpus) slug는 수동 승격 큐로 표시 — overrides 자동 반영 없음.
 * resolveFlightRoutePlan 미연결 (S4).
 *
 * npm run audit:flight-route-heuristic-diff
 * npm run audit:flight-route-heuristic-diff -- --origins ICN,BDA,MNL,PVG
 *
 * @see plans/flight-route-heuristic-ssot-plan.md Phase 2
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  MAX_FLIGHT_PATH_DETOUR_RATIO,
  flightPathDetourRatio,
  resolveDestRegion,
  scoreFlightPathV2,
} from '../src/pages/Home/lib/flightRouteGeoRules.js';
import { getDestArrivalProfile } from '../src/pages/Home/lib/destArrivalProfiles.js';
import {
  MAX_FLIGHT_LEG_HOURS,
  findOverlongFlightLegs,
  getAirportHubCoords,
} from '../src/pages/Home/lib/globeFlightCinema.js';
import {
  hasExplicitDirectFlightRoute,
  hasManualFlightRouteHubOverride,
  resolveCinemaDestIata,
} from '../src/utils/rentalAirportMatch.js';
import {
  loadAirportMetaMap,
  loadFlightRouteGraph,
  resolveGraphFlightRoute,
} from './lib/flight-route-resolver.mjs';
import { resolveHeuristicFlightRouteForAudit } from './lib/flight-route-heuristic.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(__dirname, 'outputs');
const OUTPUT_JSON = join(OUTPUT_DIR, 'heuristic-graph-diff.json');
const OUTPUT_MD = join(OUTPUT_DIR, 'heuristic-graph-diff.md');
const LIST_JSON = join(ROOT, 'src/pages/Home/data/travelSpots-list.json');
const AIRPORTS_JSON = join(ROOT, 'src/pages/Home/data/travelSpotAirports.json');
const ROUTES_JSON = join(ROOT, 'src/pages/Home/data/travelSpotFlightRoutes.json');
const CORPUS_JSON = join(OUTPUT_DIR, 'flight-route-dest-corpus.json');

const DEFAULT_ORIGINS = ['ICN'];
const SMOKE_ORIGINS = ['BDA', 'MNL', 'PVG'];
const PASS_RATE = 0.8;
const BOTH_BAD_CAP = 15;

function parseOriginsArg() {
  const idx = process.argv.indexOf('--origins');
  if (idx === -1 || !process.argv[idx + 1]) {
    return process.argv.includes('--with-smoke-origins')
      ? [...DEFAULT_ORIGINS, ...SMOKE_ORIGINS]
      : DEFAULT_ORIGINS;
  }
  return process.argv[idx + 1]
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length === 3);
}

function loadJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

/** @param {string[] | null | undefined} a @param {string[] | null | undefined} b */
function hubsEqual(a, b) {
  const aa = Array.isArray(a) ? a : [];
  const bb = Array.isArray(b) ? b : [];
  if (aa.length !== bb.length) return false;
  return aa.every((v, i) => v === bb[i]);
}

/**
 * @param {string[] | null | undefined} path
 * @param {Map<string, object> | null} airportMeta
 */
function assessPath(path, airportMeta) {
  const codes = Array.isArray(path)
    ? path.map((c) => String(c ?? '').trim().toUpperCase()).filter((c) => c.length === 3)
    : [];
  if (codes.length < 2) {
    return {
      path: codes,
      hubIatas: [],
      detour: null,
      score: null,
      overlongCount: 0,
      badDetour: true,
      badOverlong: true,
      isBad: true,
      missing: true,
    };
  }
  const detour = flightPathDetourRatio(codes);
  const score = scoreFlightPathV2(codes, { airportMeta });
  const overlong = findOverlongFlightLegs(codes, MAX_FLIGHT_LEG_HOURS);
  const badDetour = !Number.isFinite(detour) || detour > MAX_FLIGHT_PATH_DETOUR_RATIO;
  const badOverlong = overlong.length > 0;
  return {
    path: codes,
    hubIatas: codes.slice(1, -1),
    detour: Number.isFinite(detour) ? Number(detour.toFixed(3)) : null,
    score: Number.isFinite(score) ? Math.round(score) : null,
    overlongCount: overlong.length,
    badDetour,
    badOverlong,
    isBad: badDetour || badOverlong,
    missing: false,
  };
}

/**
 * Suspicious OpenFlights graph-direct on long-haul (heuristic usually better).
 * @param {{ source?: string, path?: string[] } | null} graph
 */
function isSuspiciousGraphDirect(graph) {
  if (!graph || graph.source !== 'graph-direct') return false;
  const path = graph.path ?? [];
  if (path.length !== 2) return false;
  const a = getAirportHubCoords(path[0]);
  const b = getAirportHubCoords(path[1]);
  if (!a || !b) return false;
  const detour = flightPathDetourRatio(path);
  // Direct edge with very long GC — often cargo/stale in OpenFlights 2014
  return Number.isFinite(detour) && detour <= 1.01 && path.length === 2
    ? (() => {
        const dLng = Math.abs(a.lng - b.lng);
        const span = Math.min(dLng, 360 - dLng);
        // rough: > ~4000km class → prefer hub chain when heuristic has one
        return span > 35 || Math.abs(a.lat - b.lat) > 40;
      })()
    : false;
}

/**
 * @param {{
 *   heuristic: ReturnType<typeof assessPath>,
 *   graph: ReturnType<typeof assessPath>,
 *   graphRaw: { source?: string, path?: string[] } | null,
 *   heuristicRaw: { hubIatas?: string[] } | null,
 * }} args
 */
function classifyVerdict({ heuristic, graph, graphRaw, heuristicRaw }) {
  if (heuristic.missing && graph.missing) {
    return { verdict: 'both_bad', rationale: 'both unresolved' };
  }
  if (!heuristic.missing && !graph.missing && hubsEqual(heuristic.hubIatas, graph.hubIatas)) {
    return { verdict: 'agree', rationale: 'identical hub chain' };
  }

  if (heuristic.missing && !graph.missing) {
    return graph.isBad
      ? { verdict: 'both_bad', rationale: 'heuristic missing · graph bad' }
      : { verdict: 'graph_wins', rationale: 'heuristic unresolved' };
  }
  if (graph.missing && !heuristic.missing) {
    return heuristic.isBad
      ? { verdict: 'both_bad', rationale: 'graph missing · heuristic bad' }
      : { verdict: 'heuristic_wins', rationale: 'graph unresolved · heuristic ok' };
  }

  const hBad = heuristic.isBad;
  const gBad = graph.isBad;
  if (!hBad && gBad) {
    return { verdict: 'heuristic_wins', rationale: 'graph detour/overlong · heuristic ok' };
  }
  if (hBad && !gBad) {
    return { verdict: 'graph_wins', rationale: 'heuristic detour/overlong · graph ok' };
  }
  if (hBad && gBad) {
    return { verdict: 'both_bad', rationale: 'both exceed detour or overlong' };
  }

  // Both geometrically ok but different chains
  const suspiciousDirect =
    isSuspiciousGraphDirect(graphRaw) && (heuristicRaw?.hubIatas?.length ?? 0) > 0;
  if (suspiciousDirect) {
    return {
      verdict: 'heuristic_wins',
      rationale: 'suspicious graph-direct vs heuristic hubs',
    };
  }

  const hScore = heuristic.score ?? 99999;
  const gScore = graph.score ?? 99999;
  const hDetour = heuristic.detour ?? 99;
  const gDetour = graph.detour ?? 99;

  // Prefer meaningfully better score/detour; small ties → heuristic (SSOT direction)
  if (hScore + 80 < gScore || hDetour + 0.08 < gDetour) {
    return { verdict: 'heuristic_wins', rationale: 'better score/detour' };
  }
  if (gScore + 80 < hScore || gDetour + 0.08 < hDetour) {
    return { verdict: 'graph_wins', rationale: 'graph better score/detour' };
  }
  if ((heuristic.hubIatas?.length ?? 99) < (graph.hubIatas?.length ?? 99)) {
    return { verdict: 'heuristic_wins', rationale: 'fewer hubs · similar quality' };
  }
  if ((graph.hubIatas?.length ?? 99) < (heuristic.hubIatas?.length ?? 99)) {
    return { verdict: 'graph_wins', rationale: 'fewer hubs · similar quality' };
  }
  return { verdict: 'heuristic_wins', rationale: 'tie · prefer heuristic SSOT' };
}

/**
 * @param {string} originIata
 * @param {string} destIata
 * @param {string} slug
 * @param {{ adjacency: Map, airportMeta: Map, bakedRoutes: object }} ctx
 */
function resolveGraphForDiff(originIata, destIata, slug, ctx) {
  if (originIata === 'ICN') {
    const baked = ctx.bakedRoutes?.spots?.[slug];
    if (baked && baked.source !== 'graph-unresolved' && Array.isArray(baked.path)) {
      return {
        hubIatas: Array.isArray(baked.hubIatas) ? baked.hubIatas : baked.path.slice(1, -1),
        path: baked.path,
        source: baked.source ?? 'graph-precompute',
        hops: baked.hops ?? null,
      };
    }
    const airportRow = ctx.airports?.spots?.[slug];
    if (
      airportRow?.graphFlightRouteSource &&
      airportRow.graphFlightRouteSource !== 'graph-unresolved' &&
      Array.isArray(airportRow.graphFlightRouteHubIatas)
    ) {
      const hubs = airportRow.graphFlightRouteHubIatas;
      return {
        hubIatas: hubs,
        path: [originIata, ...hubs, destIata],
        source: airportRow.graphFlightRouteSource,
        hops: hubs.length + 1,
      };
    }
  }

  const live = resolveGraphFlightRoute(originIata, destIata, ctx.adjacency, {
    airportMeta: ctx.airportMeta,
  });
  if (!live) return null;
  return live;
}

function loadConflictSlugSet() {
  const corpus = loadJson(CORPUS_JSON);
  const list = corpus?.spots ?? corpus?.rows ?? [];
  if (!Array.isArray(list)) return new Set();
  return new Set(
    list.filter((r) => r.verdict === 'conflict').map((r) => r.slug).filter(Boolean),
  );
}

function formatPath(hubs, origin, dest) {
  const h = Array.isArray(hubs) ? hubs : [];
  return [origin, ...h, dest].filter(Boolean).join('→');
}

async function main() {
  const origins = parseOriginsArg();
  const list = loadJson(LIST_JSON, []);
  const airports = loadJson(AIRPORTS_JSON, { spots: {} });
  const bakedRoutes = loadJson(ROUTES_JSON, { spots: {} });
  const conflictSlugs = loadConflictSlugSet();

  if (!Array.isArray(list) || list.length === 0) {
    console.error('Missing travelSpots-list.json');
    process.exit(1);
  }

  const graphCtx = {
    adjacency: (await loadFlightRouteGraph({ skipDownload: true })).adjacency,
    airportMeta: await loadAirportMetaMap({ skipDownload: true }),
    bakedRoutes,
    airports,
  };

  /** @type {Record<string, number>} */
  const counts = {
    agree: 0,
    heuristic_wins: 0,
    graph_wins: 0,
    both_bad: 0,
    skipped_no_dest: 0,
    skipped_same_airport: 0,
  };

  /** @type {Array<Record<string, unknown>>} */
  const rows = [];
  /** @type {Array<Record<string, unknown>>} */
  const smokeRows = [];

  for (const originIata of origins) {
    if (!getAirportHubCoords(originIata)) {
      console.error('Missing origin coords:', originIata);
      process.exit(1);
    }

    for (const item of list) {
      const slug = item.slug;
      const airportRow = airports.spots?.[slug] ?? null;
      const location = {
        slug,
        name: item.name,
        lat: airportRow?.lat ?? item.lat,
        lng: airportRow?.lng ?? item.lng,
      };
      const destIata = resolveCinemaDestIata(location);
      if (!destIata) {
        if (originIata === 'ICN') counts.skipped_no_dest += 1;
        continue;
      }
      // Same-airport (e.g. seoul→ICN) — not a route pair; exclude from pass metric
      if (destIata === originIata) {
        if (originIata === 'ICN') counts.skipped_same_airport += 1;
        continue;
      }

      const profile = getDestArrivalProfile(slug);
      const cinemaSafe = profile?.cinemaSafe === true;
      const manualOverride = hasManualFlightRouteHubOverride(location);
      const explicitDirect = hasExplicitDirectFlightRoute(location);
      const conflictQueue = conflictSlugs.has(slug);

      const graphRaw = resolveGraphForDiff(originIata, destIata, slug, graphCtx);
      const heuristicRaw = resolveHeuristicFlightRouteForAudit({
        originIata,
        destIata,
        slug,
        airportMeta: graphCtx.airportMeta,
        adjacency: graphCtx.adjacency,
        useRegionGatewaySeed: true,
      });

      const graphAssess = assessPath(graphRaw?.path ?? null, graphCtx.airportMeta);
      const heuristicAssess = assessPath(heuristicRaw?.path ?? null, graphCtx.airportMeta);
      const { verdict, rationale } = classifyVerdict({
        heuristic: heuristicAssess,
        graph: graphAssess,
        graphRaw,
        heuristicRaw,
      });

      const destRegion = resolveDestRegion(
        destIata,
        graphCtx.airportMeta.get(destIata) ?? null,
      );

      const row = {
        originIata,
        slug,
        destIata,
        destRegion,
        verdict,
        rationale,
        graphPath: graphAssess.missing
          ? null
          : formatPath(graphAssess.hubIatas, originIata, destIata),
        heuristicPath: heuristicAssess.missing
          ? null
          : formatPath(heuristicAssess.hubIatas, originIata, destIata),
        graphHubs: graphAssess.hubIatas,
        heuristicHubs: heuristicAssess.hubIatas,
        graphSource: graphRaw?.source ?? 'unresolved',
        heuristicMacroId: heuristicRaw?.rationale?.macroId ?? null,
        heuristicScore: heuristicAssess.score,
        graphScore: graphAssess.score,
        heuristicDetour: heuristicAssess.detour,
        graphDetour: graphAssess.detour,
        cinemaSafe,
        profileUsed: heuristicRaw?.rationale?.profileUsed === true,
        manualOverride,
        explicitDirect,
        conflictQueue,
        // toolkit-audit profiles never auto-applied
        profileSource: profile?.source ?? null,
      };

      if (originIata === 'ICN') {
        counts[verdict] = (counts[verdict] ?? 0) + 1;
        rows.push(row);
      } else {
        smokeRows.push(row);
      }
    }
  }

  const icnTotal = rows.length;
  const passCount = (counts.agree ?? 0) + (counts.heuristic_wins ?? 0);
  const passRate = icnTotal > 0 ? passCount / icnTotal : 0;
  const passOk = passRate >= PASS_RATE;
  const bothBadOk = (counts.both_bad ?? 0) <= BOTH_BAD_CAP;

  const byRegion = {};
  for (const row of rows) {
    const r = row.destRegion || 'unknown';
    if (!byRegion[r]) {
      byRegion[r] = { agree: 0, heuristic_wins: 0, graph_wins: 0, both_bad: 0, total: 0 };
    }
    byRegion[r][row.verdict] = (byRegion[r][row.verdict] ?? 0) + 1;
    byRegion[r].total += 1;
  }

  const bothBad = rows.filter((r) => r.verdict === 'both_bad');
  const graphWins = rows.filter((r) => r.verdict === 'graph_wins');
  const conflictQueueRows = rows.filter((r) => r.conflictQueue);
  const heuristicWinsSample = rows
    .filter((r) => r.verdict === 'heuristic_wins')
    .slice(0, 40);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    phase: 'S2-heuristic-graph-diff',
    origins,
    thresholds: {
      passRate: PASS_RATE,
      bothBadCap: BOTH_BAD_CAP,
      maxDetourRatio: MAX_FLIGHT_PATH_DETOUR_RATIO,
      maxLegHours: MAX_FLIGHT_LEG_HOURS,
    },
    summary: {
      icnTotal,
      skippedNoDest: counts.skipped_no_dest,
      skippedSameAirport: counts.skipped_same_airport,
      counts,
      passCount,
      passRate: Number(passRate.toFixed(4)),
      passOk,
      bothBadOk,
      conflictQueueCount: conflictQueueRows.length,
      cinemaSafeUsed: rows.filter((r) => r.profileUsed).length,
      cinemaSafeAvailable: rows.filter((r) => r.cinemaSafe).length,
    },
    byRegion,
    bothBad,
    graphWins,
    conflictQueue: conflictQueueRows.map((r) => ({
      slug: r.slug,
      destIata: r.destIata,
      verdict: r.verdict,
      graphPath: r.graphPath,
      heuristicPath: r.heuristicPath,
      note: 'dest-corpus conflict — manual promote via overrides.mjs only',
    })),
    heuristicWinsSample,
    smokeRows,
    rows,
  };

  writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const md = [];
  md.push('# Heuristic ↔ Graph diff audit');
  md.push('');
  md.push(`generatedAt: \`${report.generatedAt}\``);
  md.push(`origin primary: \`ICN\` · also: ${origins.filter((o) => o !== 'ICN').join(', ') || '—'}`);
  md.push('');
  md.push('## Summary (ICN)');
  md.push('');
  md.push('| Metric | Count |');
  md.push('|--------|------:|');
  md.push(`| total | ${icnTotal} |`);
  md.push(`| agree | ${counts.agree ?? 0} |`);
  md.push(`| heuristic_wins | ${counts.heuristic_wins ?? 0} |`);
  md.push(`| graph_wins | ${counts.graph_wins ?? 0} |`);
  md.push(`| both_bad | ${counts.both_bad ?? 0} |`);
  md.push(
    `| **agree+heuristic_wins** | **${passCount} (${(passRate * 100).toFixed(1)}%)** ${passOk ? '✅' : '❌'} ≥80% |`,
  );
  md.push(
    `| both_bad ≤${BOTH_BAD_CAP} | ${(counts.both_bad ?? 0) <= BOTH_BAD_CAP ? '✅' : '❌'} |`,
  );
  md.push(`| cinemaSafe profile used | ${report.summary.cinemaSafeUsed} / ${report.summary.cinemaSafeAvailable} available |`);
  md.push(`| dest-corpus conflict queue | ${conflictQueueRows.length} (manual promote only) |`);
  md.push('');
  md.push('## By dest region');
  md.push('');
  md.push('| Region | total | agree | heuristic_wins | graph_wins | both_bad |');
  md.push('|--------|------:|------:|---------------:|-----------:|---------:|');
  for (const [region, c] of Object.entries(byRegion).sort((a, b) => b[1].total - a[1].total)) {
    md.push(
      `| ${region} | ${c.total} | ${c.agree} | ${c.heuristic_wins} | ${c.graph_wins} | ${c.both_bad} |`,
    );
  }
  md.push('');
  md.push('## both_bad (manual L3 / QA queue)');
  md.push('');
  if (!bothBad.length) {
    md.push('_none_');
  } else {
    md.push('| slug | dest | graph | heuristic | rationale |');
    md.push('|------|------|-------|-----------|-----------|');
    for (const r of bothBad) {
      md.push(
        `| ${r.slug} | ${r.destIata} | ${r.graphPath ?? '—'} | ${r.heuristicPath ?? '—'} | ${r.rationale} |`,
      );
    }
  }
  md.push('');
  md.push('## graph_wins (macro/seed reinforce)');
  md.push('');
  if (!graphWins.length) {
    md.push('_none_');
  } else {
    md.push('| slug | dest | region | graph | heuristic | rationale |');
    md.push('|------|------|--------|-------|-----------|-----------|');
    for (const r of graphWins.slice(0, 80)) {
      md.push(
        `| ${r.slug} | ${r.destIata} | ${r.destRegion} | ${r.graphPath ?? '—'} | ${r.heuristicPath ?? '—'} | ${r.rationale} |`,
      );
    }
    if (graphWins.length > 80) md.push(`\n_… ${graphWins.length - 80} more in JSON_`);
  }
  md.push('');
  md.push('## Conflict queue (dest-corpus conflict · no timeline bake)');
  md.push('');
  md.push(
    `corpus conflict slugs in this ICN run: **${conflictQueueRows.length}** — promote only via \`overrides.mjs\` → \`generate:airports\`.`,
  );
  md.push('');
  if (conflictQueueRows.length) {
    const byVerdict = {};
    for (const r of conflictQueueRows) {
      byVerdict[r.verdict] = (byVerdict[r.verdict] ?? 0) + 1;
    }
    md.push('Verdict mix inside conflict queue:');
    for (const [v, n] of Object.entries(byVerdict)) {
      md.push(`- ${v}: ${n}`);
    }
  }
  md.push('');
  md.push('## Notes');
  md.push('');
  md.push('- cinemaSafe destArrivalProfiles only influence heuristic candidates');
  md.push('- toolkit-audit / journey_timeline never auto-baked');
  md.push('- `resolveFlightRoutePlan` not wired (S4)');
  md.push('');

  writeFileSync(OUTPUT_MD, `${md.join('\n')}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: passOk && bothBadOk,
        icnTotal,
        counts,
        passRate: report.summary.passRate,
        passOk,
        bothBadOk,
        conflictQueue: conflictQueueRows.length,
        outputs: {
          json: OUTPUT_JSON,
          md: OUTPUT_MD,
          corpusLoaded: existsSync(CORPUS_JSON),
        },
      },
      null,
      2,
    ),
  );

  if (!passOk || !bothBadOk) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
