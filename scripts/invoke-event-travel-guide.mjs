#!/usr/bin/env node
/**
 * Invoke update-event-travel-guide Edge for one event (Tier0 facts → AI guide).
 *
 *   npm run invoke:event-travel-guide -- edinburgh-fringe-2026
 *   EVENT_TRAVEL_GUIDE_FORCE=1 npm run invoke:event-travel-guide -- edinburgh-fringe-2026
 *
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or anon) + GEMINI_API_KEY on Edge
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './lib/load-env-file.mjs';
import { buildWorldEventTier0Facts } from './lib/event-travel-guide-schema.mjs';
import { getWorldEventById } from '../src/utils/worldEvents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'outputs/event-travel-guide');

loadEnvFile();

const eventId = process.argv[2] || 'edinburgh-fringe-2026';
const url = process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon) required');
  process.exit(1);
}

const event = getWorldEventById(eventId);
if (!event) {
  console.error(`Unknown eventId: ${eventId}`);
  process.exit(1);
}

const facts = buildWorldEventTier0Facts(event);
const force = process.env.EVENT_TRAVEL_GUIDE_FORCE === '1';

const endpoint = `${url.replace(/\/$/, '')}/functions/v1/update-event-travel-guide`;
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({ facts, locale: 'ko', force }),
});

const data = await response.json();
mkdirSync(OUTPUT_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = join(OUTPUT_DIR, `${eventId}-${stamp}.json`);
writeFileSync(outPath, JSON.stringify({ request: { facts, force }, response: data }, null, 2));

if (!data?.success) {
  console.error('Invoke FAIL:', data?.error || 'unknown');
  console.error('Log:', outPath);
  process.exit(1);
}

console.log(`Invoke OK: ${eventId} cached=${Boolean(data.cached)} model=${data.model || 'n/a'}`);
console.log('Log:', outPath);

if (data.guide) {
  const fixturePath = join(
    __dirname,
    `fixtures/event-travel-guide/${eventId}.json`,
  );
  writeFileSync(fixturePath, JSON.stringify(data.guide, null, 2) + '\n');
  console.log('Fixture updated:', fixturePath);
}
