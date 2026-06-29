/**
 * 출발지 Metro Gateway 승격 smoke — GPS 좌표 → rental 허브 → gateway 승격.
 * Usage: node scripts/smoke-flight-origin-gateway.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function loadModule(relPath) {
  return import(pathToFileURL(join(root, relPath)).href);
}

const cases = [
  {
    id: 'seoul-myeongdong',
    label: '서울 명동 — GMP nearest → ICN',
    lat: 37.56,
    lng: 126.99,
    expectIata: 'ICN',
    expectNearest: 'GMP',
  },
  {
    id: 'seoul-incheon-airport',
    label: '인천공항 — ICN · 승격 없음',
    lat: 37.46,
    lng: 126.44,
    expectIata: 'ICN',
    expectNearest: 'ICN',
  },
  {
    id: 'shanghai-bund',
    label: '상하이 와이탄 — SHA nearest → PVG',
    lat: 31.24,
    lng: 121.5,
    expectIata: 'PVG',
    expectNearest: 'SHA',
  },
  {
    id: 'bohol-tagbilaran',
    label: '보홀 타그비라란 — TAG · 승격 없음',
    lat: 9.66,
    lng: 123.85,
    expectIata: 'TAG',
    expectNearest: 'TAG',
  },
  {
    id: 'cebu-city',
    label: '세부 시 — CEB · 승격 없음',
    lat: 10.32,
    lng: 123.89,
    expectIata: 'CEB',
    expectNearest: 'CEB',
  },
];

async function main() {
  const { resolveFlightOriginFromCoords } = await loadModule(
    'src/pages/Home/lib/flightCinemaOriginSearch.js'
  );
  const { promoteFlightOriginGateway } = await loadModule(
    'src/pages/Home/lib/flightOriginMetroGateways.js'
  );

  const results = [];

  for (const testCase of cases) {
    const checks = [];
    const resolved = resolveFlightOriginFromCoords(testCase.lat, testCase.lng);

    if (!resolved) {
      checks.push('resolveFlightOriginFromCoords returned null');
    } else if (resolved.iata !== testCase.expectIata) {
      checks.push(`iata: expected ${testCase.expectIata}, got ${resolved.iata}`);
    }

    const promoted = promoteFlightOriginGateway(
      testCase.expectNearest,
      testCase.lat,
      testCase.lng
    );
    const expectPromotion = testCase.expectIata !== testCase.expectNearest;
    if (expectPromotion && promoted !== testCase.expectIata) {
      checks.push(
        `promotion: expected ${testCase.expectIata}, got ${promoted ?? 'null'} (feeder ${testCase.expectNearest})`
      );
    }
    if (!expectPromotion && promoted != null) {
      checks.push(`promotion: expected null, got ${promoted}`);
    }

    results.push({
      id: testCase.id,
      label: testCase.label,
      pass: checks.length === 0,
      checks,
      resolvedIata: resolved?.iata ?? null,
      expectIata: testCase.expectIata,
      expectNearest: testCase.expectNearest,
    });
  }

  const passCount = results.filter((row) => row.pass).length;
  const outPath = join(root, 'scripts/outputs/flight-origin-gateway-smoke.json');
  writeFileSync(outPath, `${JSON.stringify({ passCount, total: results.length, results }, null, 2)}\n`);

  console.log(`Flight origin gateway smoke: ${passCount}/${results.length} pass`);
  for (const row of results) {
    const status = row.pass ? 'PASS' : 'FAIL';
    console.log(`  ${status} ${row.id} — iata=${row.resolvedIata ?? '—'} (expect ${row.expectIata})`);
    for (const check of row.checks) console.log(`         ${check}`);
  }
  console.log(`Output: ${outPath}`);

  if (passCount !== results.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
