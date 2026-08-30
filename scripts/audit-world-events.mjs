#!/usr/bin/env node
/**
 * worldEvents.json SSOT audit
 *
 *   npm run audit:world-events
 *
 * exit 0 = PASS · exit 1 = FAIL
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  WORLD_EVENT_I18N_PILOT_EVENT_IDS,
  WORLD_EVENT_RECURRENCES,
  WORLD_EVENT_SOURCES,
  WORLD_EVENT_TYPES,
  normalizeWorldEventOverride,
} from './lib/world-event-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/worldEvents.json');
const SPOTS_LIST_PATH = join(__dirname, '../src/pages/Home/data/travelSpots-list.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

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
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const slugSet = loadSlugSet();
  const hubIdSet = loadHubIdSet();

  assert(data.meta?.version === 1, 'meta.version === 1');
  assert(typeof data.meta?.generatedAt === 'string', 'meta.generatedAt present');
  assert(
    data.meta?.source === 'scripts/data/world-event-overrides.mjs',
    'meta.source matches overrides SSOT',
  );
  assert(Array.isArray(data.events), 'events is array');

  const events = data.events;
  assert(
    data.meta?.eventCount === events.length,
    `meta.eventCount (${data.meta?.eventCount}) === events.length (${events.length})`,
  );

  const seenIds = new Set();
  const today = new Date().toISOString().slice(0, 10);
  let expiredCount = 0;

  for (let i = 0; i < events.length; i += 1) {
    const raw = events[i];
    let normalized;
    try {
      normalized = normalizeWorldEventOverride(raw, { index: i, slugSet, hubIdSet });
    } catch (err) {
      failed += 1;
      console.error(`FAIL  events[${i}]: ${err.message}`);
      continue;
    }

    assert(!seenIds.has(normalized.id), `unique id: ${normalized.id}`);
    seenIds.add(normalized.id);

    assert(WORLD_EVENT_TYPES.has(normalized.type), `${normalized.id}: type allowed`);
    assert(
      WORLD_EVENT_RECURRENCES.has(normalized.recurrence),
      `${normalized.id}: recurrence allowed`,
    );
    assert(WORLD_EVENT_SOURCES.has(normalized.source), `${normalized.id}: source allowed`);

    if (normalized.endDate < today) {
      expiredCount += 1;
    }

    if (normalized.detailOverviewEn) {
      assert(
        Boolean(normalized.detailOverview),
        `${normalized.id}: detailOverviewEn paired with detailOverview`,
      );
    }

    if (normalized.highlightsEn) {
      assert(
        Array.isArray(normalized.highlights) && normalized.highlights.length > 0,
        `${normalized.id}: highlightsEn paired with highlights`,
      );
      assert(
        normalized.highlightsEn.length === normalized.highlights.length,
        `${normalized.id}: highlightsEn length matches highlights`,
      );
    }

    if (WORLD_EVENT_I18N_PILOT_EVENT_IDS.includes(normalized.id)) {
      assert(
        Boolean(normalized.detailOverviewEn),
        `${normalized.id}: i18n pilot requires detailOverviewEn`,
      );
      assert(
        Array.isArray(normalized.highlightsEn) && normalized.highlightsEn.length >= 2,
        `${normalized.id}: i18n pilot requires highlightsEn`,
      );
    }
  }

  if (expiredCount > 0) {
    console.log(`info  expired events (endDate < ${today}): ${expiredCount} (warning only)`);
  }

  console.log(`events: ${events.length} · slugs checked: ${slugSet.size}`);

  if (failed > 0) {
    console.error(`\naudit:world-events FAIL (${failed} checks)`);
    process.exit(1);
  }

  console.log('\naudit:world-events PASS');
  process.exit(0);
}

main();
