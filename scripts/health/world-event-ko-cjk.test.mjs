import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import {
  collectWorldEventCjkViolations,
  containsCjkForKoBody,
} from '../lib/world-event-user-visible-cjk.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const jsonPath = join(root, 'src/pages/Home/data/worldEvents.json');

test('world events ko/en user-visible fields contain no CJK (kana/han)', async () => {
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const events = data.events ?? [];
  /** @type {Array<{ id: string, locale: string, path: string, value: string }>} */
  const failures = [];
  for (const event of events) {
    for (const hit of collectWorldEventCjkViolations(event, 'ko')) {
      failures.push({ id: event.id, locale: 'ko', ...hit });
    }
    for (const hit of collectWorldEventCjkViolations(event, 'en')) {
      failures.push({ id: event.id, locale: 'en', ...hit });
    }
  }
  if (failures.length) {
    const sample = failures
      .slice(0, 12)
      .map((f) => `${f.id} [${f.locale}] ${f.path}: ${f.value}`)
      .join('\n');
    assert.fail(`CJK in world event copy (${failures.length}):\n${sample}`);
  }
});

test('hangul remains allowed in ko body guard', () => {
  assert.equal(containsCjkForKoBody('오도리 공원 일루미네이션'), false);
  assert.equal(containsCjkForKoBody('駅前通'), true);
});

test('Sapporo stay doHere lines present', async () => {
  const { getWorldEventById, getWorldEventStayAreas } = await import(
    pathToFileURL(join(root, 'src/utils/worldEvents.js')).href
  );
  const event = getWorldEventById('sapporo-white-illumination-2026');
  assert.ok(event);
  const areas = getWorldEventStayAreas(event, 'ko');
  const odori = areas.find((a) => a.name === '오도리');
  assert.ok(odori?.doHere?.length >= 3, 'Odori doHere');
  for (const line of odori.doHere) {
    assert.equal(containsCjkForKoBody(line), false, line);
  }
});