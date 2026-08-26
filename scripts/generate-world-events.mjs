#!/usr/bin/env node
/**
 * world-event-overrides.mjs → worldEvents.json
 *
 *   npm run generate:world-events
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { WORLD_EVENT_OVERRIDES } from './data/world-event-overrides.mjs';
import {
  normalizeWorldEventOverride,
  sortWorldEvents,
} from './lib/world-event-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/worldEvents.json');
const SPOTS_LIST_PATH = join(__dirname, '../src/pages/Home/data/travelSpots-list.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

function loadSlugSet() {
  const list = JSON.parse(readFileSync(SPOTS_LIST_PATH, 'utf8'));
  return new Set(list.map((s) => s.slug));
}

function loadHubIdSet() {
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const rows = Array.isArray(hubs) ? hubs : [];
  return new Set(rows.map((h) => String(h.hubId || '').trim()).filter(Boolean));
}

function main() {
  const slugSet = loadSlugSet();
  const hubIdSet = loadHubIdSet();
  const seenIds = new Set();
  const events = [];

  if (!Array.isArray(WORLD_EVENT_OVERRIDES)) {
    throw new Error('[world-events] WORLD_EVENT_OVERRIDES must be an array');
  }

  for (let i = 0; i < WORLD_EVENT_OVERRIDES.length; i += 1) {
    const event = normalizeWorldEventOverride(WORLD_EVENT_OVERRIDES[i], {
      index: i,
      slugSet,
      hubIdSet,
    });
    if (seenIds.has(event.id)) {
      throw new Error(`[world-events] duplicate id: ${event.id}`);
    }
    seenIds.add(event.id);
    events.push(event);
  }

  const sorted = sortWorldEvents(events);
  const output = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      eventCount: sorted.length,
      source: 'scripts/data/world-event-overrides.mjs',
    },
    events: sorted,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} (${output.meta.eventCount} events)`);
}

main();
