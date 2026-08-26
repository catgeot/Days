#!/usr/bin/env node
/**
 * EventTravelGuide schema + hallucination audit against Tier0 facts
 *
 *   npm run audit:event-travel-guide
 *   npm run audit:event-travel-guide -- scripts/fixtures/event-travel-guide/edinburgh-fringe-2026.json
 *
 * exit 0 = PASS · exit 1 = FAIL
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  auditEventTravelGuideAgainstFacts,
  buildWorldEventTier0Facts,
  normalizeEventTravelGuide,
} from './lib/event-travel-guide-schema.mjs';
import { getWorldEventById } from '../src/utils/worldEvents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURE = join(
  __dirname,
  'fixtures/event-travel-guide/edinburgh-fringe-2026.json',
);

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

function loadGuideFromArg() {
  const argPath = process.argv[2];
  const path = argPath ? argPath : DEFAULT_FIXTURE;
  assert(existsSync(path), `fixture exists: ${path}`);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return normalizeEventTravelGuide(raw, { label: path });
}

function main() {
  const guide = loadGuideFromArg();
  const eventId = guide.event_id;

  const event = getWorldEventById(eventId);
  assert(Boolean(event), `worldEvents lookup: ${eventId}`);

  const facts = buildWorldEventTier0Facts(event);
  assert(facts.event_id === eventId, 'facts.event_id matches guide');

  try {
    const warnings = auditEventTravelGuideAgainstFacts(guide, facts);
    for (const w of warnings) warn(w);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  hallucination audit: ${err.message}`);
  }

  assert(guide.trip_presets.length >= 2, 'trip_presets >= 2');
  assert(guide.sections.length >= 2, 'sections >= 2');
  assert(guide.booking_tips.length >= 1, 'booking_tips >= 1');

  if (failed > 0) {
    console.error(`\naudit:event-travel-guide FAIL (${failed} error(s), ${warned} warning(s))`);
    process.exit(1);
  }

  console.log(`\naudit:event-travel-guide PASS (${warned} warning(s))`);
}

main();
