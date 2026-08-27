#!/usr/bin/env node
/**
 * EventTravelGuide smoke — fixture audit + schema wiring
 *
 *   npm run smoke:event-travel-guide
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  EVENT_TRAVEL_GUIDE_SCHEMA_VERSION,
  EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS,
  normalizeEventTravelGuide,
} from './lib/event-travel-guide-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

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

function grepFile(path, pattern) {
  const full = join(ROOT, path);
  if (!existsSync(full)) return false;
  return readFileSync(full, 'utf8').includes(pattern);
}

function main() {
  assert(
    existsSync(join(__dirname, 'lib/event-travel-guide-schema.mjs')),
    'schema module present',
  );
  assert(
    existsSync(join(ROOT, 'supabase/functions/update-event-travel-guide/index.ts')),
    'Edge function present',
  );
  assert(
    existsSync(join(ROOT, 'supabase/migrations/20260826120000_event_travel_guide.sql')),
    'migration present',
  );

  const fixtureDir = join(__dirname, 'fixtures/event-travel-guide');
  const fixturePaths = readdirSync(fixtureDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(fixtureDir, name));
  assert(fixturePaths.length >= 3, 'Wave1.5 pilot fixtures edinburgh/munich/bali present');
  assert(
    fixturePaths.length === EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS.length,
    'fixture count matches pilot roster',
  );

  for (const fixturePath of fixturePaths) {
    const fixture = normalizeEventTravelGuide(
      JSON.parse(readFileSync(fixturePath, 'utf8')),
      { label: fixturePath },
    );
    assert(
      fixture.schema_version === EVENT_TRAVEL_GUIDE_SCHEMA_VERSION,
      `${fixture.event_id} schema_version`,
    );
  }

  assert(grepFile('src/utils/loadEventTravelGuideFixture.js', 'loadEventTravelGuideFixture'), 'fixture loader');

  assert(grepFile('src/utils/eventTravelGuideSurface.js', 'shouldShowEventTravelGuidePanel'), 'surface guard');
  assert(grepFile('src/pages/WorldEvents/EventDetailPage.jsx', 'shouldShowEventTravelGuidePanel'), 'panel suppress wired');
  assert(grepFile('src/pages/WorldEvents/EventDetailPage.jsx', 'EventTravelGuidePanel'), 'panel wired in detail page');
  assert(grepFile('src/utils/fetchEventTravelGuide.js', 'event_travel_guide'), 'fetch helper');

  const audit = spawnSync('node', ['scripts/audit-event-travel-guide.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  assert(audit.status === 0, 'audit:event-travel-guide PASS via smoke');

  if (failed > 0) {
    console.error(`\nsmoke:event-travel-guide FAIL (${failed})`);
    process.exit(1);
  }
  console.log('\nsmoke:event-travel-guide PASS');
}

main();
