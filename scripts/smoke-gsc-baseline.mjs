#!/usr/bin/env node
/**
 * GSC baseline template structure smoke.
 *
 *   npm run smoke:gsc-baseline
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const templatePath = join(root, 'scripts/data/gsc-seo-baseline-template.csv');

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

const raw = readFileSync(templatePath, 'utf8').trim();
const lines = raw.split('\n');
const header = lines[0];
const requiredCols = ['url', 'slug', 'intent', 'tab', 'checked_at', 'gsc_index_status', 'gsc_last_crawl', 'notes'];

assert(header === requiredCols.join(','), 'GSC template header columns');

const rows = lines.slice(1).map((line) => {
  const parts = line.split(',');
  return {
    url: parts[0],
    slug: parts[1],
    intent: parts[2],
    tab: parts[3],
    notes: parts[7] || '',
  };
});

assert(rows.length >= 128, `GSC template has tier1 minimum rows (${rows.length})`);
assert(rows.every((r) => r.url.startsWith('https://www.gateo.kr/')), 'all URLs use www.gateo.kr origin');

const tier1Gallery = rows.filter((r) => r.intent === 'gallery' && r.notes === 'tier1');
assert(tier1Gallery.length >= 64, 'tier1 gallery URLs present');

const crawlerRows = rows.filter((r) => r.url.includes('crawler=1'));
assert(crawlerRows.length >= 10, 'crawler=1 sample URLs for view-source QA');

const hubRows = rows.filter((r) => r.notes.startsWith('hub-crawler') || r.notes.startsWith('explore'));
assert(hubRows.length >= 5, 'hub/explore baseline URLs present');

const wikiRows = rows.filter((r) => r.intent === 'wiki');
assert(wikiRows.length >= 2, 'wiki crawler sample URLs');

const flightRows = rows.filter((r) => r.notes.includes('ICN'));
assert(flightRows.length >= 2, 'flight-route planner samples');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log(`\nsmoke:gsc-baseline PASS (${rows.length} URLs)`);
