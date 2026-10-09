import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  evaluateFestivalDetailSections,
  evaluateFestivalLodging,
} from '../../src/pages/Korea/lib/festivalDetailSectionGate.js';
import { resolveFestivalCrossForItem } from '../../src/pages/Korea/lib/festivalDetailSectionGate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('gangneung festival lodging — main legacy hidden, branch visible', () => {
  const item = {
    contentId: '2930716',
    title: '강릉 국수 축제',
    addr1: '강원특별자치도 강릉시',
    eventStartDate: '20261001',
    eventEndDate: '20261010',
    mapx: '128.876',
    mapy: '37.751',
    areaCode: '32',
  };
  const cross = resolveFestivalCrossForItem(item);
  const main = evaluateFestivalLodging(cross, item, { legacyCategoryInference: true });
  const branch = evaluateFestivalLodging(cross, item, { legacyCategoryInference: false });
  assert.equal(main.strip, 'hidden');
  assert.equal(main.reason, 'canShowMrtStayStrip_false');
  assert.equal(branch.strip, 'visible');
});

test('festival section scan artifacts exist after generation', () => {
  const csv = join(root, 'artifacts/festival-section-scan/scan.csv');
  const summary = join(root, 'artifacts/festival-section-scan/summary.md');
  assert.ok(existsSync(csv), 'run npm run health:festival-detail-section-scan');
  assert.ok(existsSync(summary));
  const lines = readFileSync(csv, 'utf8').trim().split('\n');
  assert.ok(lines.length >= 300, `expected ~299 festivals, got ${lines.length - 1}`);
  assert.match(readFileSync(summary, 'utf8'), /Festivals: \*\*29/);
});
