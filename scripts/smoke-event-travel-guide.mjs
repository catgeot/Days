#!/usr/bin/env node
/**
 * EventTravelGuide smoke — fixture audit + schema wiring
 *
 *   npm run smoke:event-travel-guide
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  EVENT_TRAVEL_GUIDE_SCHEMA_VERSION,
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

  const fixturePath = join(
    __dirname,
    'fixtures/event-travel-guide/edinburgh-fringe-2026.json',
  );
  assert(existsSync(fixturePath), 'edinburgh fixture present');

  const fixture = normalizeEventTravelGuide(
    JSON.parse(readFileSync(fixturePath, 'utf8')),
    { label: 'edinburgh-fringe-2026' },
  );
  assert(fixture.event_id === 'edinburgh-fringe-2026', 'fixture event_id');
  assert(fixture.schema_version === EVENT_TRAVEL_GUIDE_SCHEMA_VERSION, 'fixture schema_version');

  assert(grepFile('src/pages/WorldEvents/EventTravelGuidePanel.jsx', 'EventTravelGuidePanel'), 'panel component');
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
