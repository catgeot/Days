/**
 * 항공경로 위험군 분류 — 시네마 런타임 hub vs destArrivalProfile.
 *
 * 분류:
 * - false_direct: hubs=[] 인데 profile이 경유(gateway/nearDest/hub)를 가짐
 * - gateway_missing: profile gateway가 런타임 hub에 없음
 * - hub_mismatch: profile hub chain과 런타임 hub가 교집합 없음 (둘 다 비어있지 않음)
 * - ok: 교집합 있거나 profile도 직항
 *
 * npm run audit:flight-route-risk
 *
 * @see plans/2026-07-12-project-log.md
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getDestArrivalProfile } from '../src/pages/Home/lib/destArrivalProfiles.js';
import { resolveFlightRoutePlan, getAirportHubCoords } from '../src/pages/Home/lib/globeFlightCinema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(__dirname, 'outputs');
const AIRPORTS_JSON = join(ROOT, 'src/pages/Home/data/travelSpotAirports.json');
const LIST_JSON = join(ROOT, 'src/pages/Home/data/travelSpots-list.json');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function uniqIatas(list) {
  const out = [];
  const seen = new Set();
  for (const raw of list || []) {
    const c = String(raw ?? '').trim().toUpperCase();
    if (c.length !== 3 || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

function resolveRuntimeHubs(slug, row) {
  const destIata = String(row?.preferredLinkIata ?? row?.primaryIatas?.[0] ?? '')
    .trim()
    .toUpperCase();
  if (destIata.length !== 3) return { hubIatas: [], routeSource: 'no-dest', destIata: null };

  const origin = getAirportHubCoords('ICN');
  const dest = getAirportHubCoords(destIata);
  if (!origin || !dest) {
    return { hubIatas: [], routeSource: 'no-coords', destIata };
  }

  const location = { slug, ...row, type: 'travel-spot' };
  const plan = resolveFlightRoutePlan(origin, dest, location, {
    originIata: 'ICN',
    destIata,
  });
  return {
    hubIatas: uniqIatas(plan.hubIatas),
    routeSource: plan.routeSource ?? null,
    destIata,
  };
}

function profileExpectedHubs(profile) {
  if (!profile) return [];
  return uniqIatas([
    ...(profile.longHaulHubs || []),
    ...(profile.nearDestHubs || []),
    profile.gatewayIata,
    ...(profile.hubIatas || []),
  ]).filter((c) => c !== String(profile.finalIata || '').toUpperCase());
}

function classify(runtimeHubs, expectedHubs, profile) {
  const rt = uniqIatas(runtimeHubs);
  const ex = uniqIatas(expectedHubs);
  const overlap = rt.filter((c) => ex.includes(c));

  if (ex.length === 0) {
    return { risk: 'ok', reason: 'profile-direct-or-empty' };
  }
  if (rt.length === 0) {
    return { risk: 'false_direct', reason: 'empty-hubs-with-profile-gateway' };
  }
  if (profile?.gatewayIata) {
    const gw = String(profile.gatewayIata).toUpperCase();
    if (gw.length === 3 && !rt.includes(gw) && !overlap.length) {
      // gateway missing and no other overlap
      if (!rt.some((c) => ex.includes(c))) {
        return { risk: 'gateway_missing', reason: `missing-gateway-${gw}` };
      }
    }
    if (gw.length === 3 && !rt.includes(gw) && overlap.length) {
      return { risk: 'gateway_missing', reason: `missing-gateway-${gw}-partial-overlap` };
    }
  }
  if (overlap.length === 0) {
    return { risk: 'hub_mismatch', reason: 'no-overlap-with-profile-hubs' };
  }
  return { risk: 'ok', reason: 'overlap' };
}

function main() {
  const airports = loadJson(AIRPORTS_JSON);
  const list = loadJson(LIST_JSON);
  const slugs = Array.isArray(list)
    ? list.map((s) => s.slug || s).filter(Boolean)
    : Object.keys(airports.spots || {});

  const buckets = {
    false_direct: [],
    gateway_missing: [],
    hub_mismatch: [],
    ok: [],
    skipped: [],
  };

  for (const slug of slugs) {
    const row = airports.spots?.[slug];
    if (!row) {
      buckets.skipped.push({ slug, reason: 'no-airport-row' });
      continue;
    }

    const profile = getDestArrivalProfile(slug);
    const expected = profileExpectedHubs(profile);
    const runtime = resolveRuntimeHubs(slug, row);
    const { risk, reason } = classify(runtime.hubIatas, expected, profile);

    const entry = {
      slug,
      destIata: runtime.destIata,
      runtimeHubs: runtime.hubIatas,
      routeSource: runtime.routeSource,
      expectedHubs: expected,
      gatewayIata: profile?.gatewayIata ?? null,
      cinemaSafe: profile?.cinemaSafe ?? null,
      profileSource: profile?.source ?? null,
      hasManualOverride: Array.isArray(row.flightRouteHubIatas) && row.flightRouteHubIatas.length > 0,
      reason,
    };
    buckets[risk].push(entry);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = join(OUTPUT_DIR, 'flight-route-risk.json');
  const mdPath = join(OUTPUT_DIR, 'flight-route-risk.md');

  const summary = {
    total: slugs.length,
    false_direct: buckets.false_direct.length,
    gateway_missing: buckets.gateway_missing.length,
    hub_mismatch: buckets.hub_mismatch.length,
    ok: buckets.ok.length,
    skipped: buckets.skipped.length,
    riskTotal:
      buckets.false_direct.length +
      buckets.gateway_missing.length +
      buckets.hub_mismatch.length,
  };

  writeFileSync(
    jsonPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, buckets }, null, 2),
    'utf8'
  );

  const lines = [
    '# 항공경로 위험군 분류',
    '',
    `생성: ${new Date().toISOString()}`,
    '',
    '| 분류 | 건수 |',
    '|------|------|',
    `| false_direct | ${summary.false_direct} |`,
    `| gateway_missing | ${summary.gateway_missing} |`,
    `| hub_mismatch | ${summary.hub_mismatch} |`,
    `| ok | ${summary.ok} |`,
    `| skipped | ${summary.skipped} |`,
    `| **risk 합** | **${summary.riskTotal}** |`,
    '',
  ];

  for (const key of ['false_direct', 'gateway_missing', 'hub_mismatch']) {
    lines.push(`## ${key} (${buckets[key].length})`, '');
    if (!buckets[key].length) {
      lines.push('_없음_', '');
      continue;
    }
    lines.push('| slug | runtime | expected | source | cinemaSafe | override |', '|------|---------|----------|--------|------------|----------|');
    for (const e of buckets[key]) {
      lines.push(
        `| ${e.slug} | \`${e.runtimeHubs.join(',') || '∅'}\` | \`${e.expectedHubs.join(',') || '∅'}\` | ${e.routeSource} | ${e.cinemaSafe} | ${e.hasManualOverride ? 'Y' : ''} |`
      );
    }
    lines.push('');
  }

  writeFileSync(mdPath, lines.join('\n'), 'utf8');

  console.log('flight-route risk summary:', summary);
  console.log('Wrote', jsonPath);
  console.log('Wrote', mdPath);

  // 명확 후보: false_direct + expected hubs (override 없는 것만) — 다음 수정 큐
  const clearQueue = [...buckets.false_direct, ...buckets.gateway_missing]
    .filter((e) => !e.hasManualOverride && e.expectedHubs.length > 0)
    .map((e) => ({
      slug: e.slug,
      suggestHubs: e.expectedHubs.slice(0, 3),
      risk: e.reason.startsWith('empty') ? 'false_direct' : 'gateway_missing',
      gatewayIata: e.gatewayIata,
    }));

  writeFileSync(
    join(OUTPUT_DIR, 'flight-route-risk-fix-queue.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), count: clearQueue.length, items: clearQueue }, null, 2),
    'utf8'
  );
  console.log('clear fix-queue:', clearQueue.length);
}

main();
