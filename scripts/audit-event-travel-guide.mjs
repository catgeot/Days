#!/usr/bin/env node
/**
 * EventTravelGuide schema + hallucination audit against Tier0 facts
 *
 *   npm run audit:event-travel-guide
 *   npm run audit:event-travel-guide -- scripts/fixtures/event-travel-guide/edinburgh-fringe-2026.json
 *
 * exit 0 = PASS · exit 1 = FAIL
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  auditEventTravelGuideAgainstFacts,
  buildWorldEventTier0Facts,
  EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS,
  normalizeEventTravelGuide,
} from './lib/event-travel-guide-schema.mjs';
import { getWorldEventById } from '../src/utils/worldEvents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, 'fixtures/event-travel-guide');

let failed = 0;
let warned = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

function warn(msg) {
  warned += 1;
  console.warn(`WARN  ${msg}`);
}

function auditFixture(path) {
  assert(existsSync(path), `fixture exists: ${path}`);
  const guide = normalizeEventTravelGuide(
    JSON.parse(readFileSync(path, 'utf8')),
    { label: path },
  );
  const eventId = guide.event_id;

  const event = getWorldEventById(eventId);
  assert(Boolean(event), `worldEvents lookup: ${eventId}`);

  const facts = buildWorldEventTier0Facts(event);
  assert(facts.event_id === eventId, `${eventId}: facts.event_id matches guide`);

  try {
    const warnings = auditEventTravelGuideAgainstFacts(guide, facts);
    for (const w of warnings) warn(`${eventId}: ${w}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${eventId} hallucination audit: ${err.message}`);
  }

  assert(guide.trip_presets.length >= 2, `${eventId}: trip_presets >= 2`);
  assert(guide.sections.length >= 2, `${eventId}: sections >= 2`);
  assert(guide.booking_tips.length >= 1, `${eventId}: booking_tips >= 1`);
  assert(
    EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS.includes(eventId),
    `${eventId}: pilot fixture roster`,
  );

  const raw = JSON.parse(readFileSync(path, 'utf8'));
  if (EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS.includes(eventId)) {
    assert(Array.isArray(raw.trip_presets_en) && raw.trip_presets_en.length >= 2, `${eventId}: trip_presets_en`);
    assert(Array.isArray(raw.sections_en) && raw.sections_en.length >= 2, `${eventId}: sections_en`);
    assert(Array.isArray(raw.booking_tips_en) && raw.booking_tips_en.length >= 1, `${eventId}: booking_tips_en`);
  }
}

function listFixturePaths() {
  const argPath = process.argv[2];
  if (argPath) return [argPath];
  return readdirSync(FIXTURE_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(FIXTURE_DIR, name))
    .sort();
}

function main() {
  const paths = listFixturePaths();
  assert(paths.length > 0, 'at least one fixture in event-travel-guide');

  for (const path of paths) {
    console.log(`\n--- ${path}`);
    auditFixture(path);
  }

  if (failed > 0) {
    console.error(`\naudit:event-travel-guide FAIL (${failed} error(s), ${warned} warning(s))`);
    process.exit(1);
  }

  console.log(`\naudit:event-travel-guide PASS (${paths.length} fixture(s), ${warned} warning(s))`);
}

main();
