import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  searchParamsWithFestival,
  searchParamsWithoutFestival,
} from '../src/pages/Korea/koreaFestivalDetailUrl.js';

const inbound = new URLSearchParams(
  'festival=1998564&utm_source=x&utm_medium=social&utm_campaign=fest-1998564',
);

function utmOf(params) {
  return ['utm_source', 'utm_medium', 'utm_campaign'].map((key) => params.get(key)).join('|');
}

assert.equal(utmOf(searchParamsWithoutFestival(inbound)), 'x|social|fest-1998564');
assert.equal(utmOf(searchParamsWithFestival(inbound, '1998564')), 'x|social|fest-1998564');

const listQs = searchParamsWithoutFestival(inbound).toString();
const detailQs = searchParamsWithFestival(inbound, '1998564').toString();
for (const search of [inbound.toString(), listQs, detailQs]) {
  const pagePath = `/korea?${search}`;
  assert.match(pagePath, /utm_source=x/);
  assert.match(pagePath, /utm_medium=social/);
  assert.match(pagePath, /utm_campaign=fest-1998564/);
  const strips =
    search.includes('error') ||
    search.includes('code=');
  assert.equal(strips, false);
}

const scenic = readFileSync(new URL('../src/pages/KoreaTheme/ScenicPage.jsx', import.meta.url), 'utf8');
assert.equal(scenic.includes("delete('utm"), false);
assert.match(scenic, /new URLSearchParams\(searchParams\)/);

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.match(app, /page_path: location\.pathname \+ location\.search/);
assert.match(app, /search\.includes\('error'\) \|\| hash\.includes\('access_token'\) \|\| search\.includes\('code='\)/);

const outboundFiles = [
  '../src/pages/Korea/data/festivalBookingLinks.json',
  '../src/pages/Korea/FestivalBookingActions.jsx',
  '../src/pages/Korea/lib/festivalBookingLinks.js',
  '../src/utils/reviewInlineMarkdown.js',
  '../src/components/PlaceCard/tabs/ReviewLinkChips.jsx',
  '../src/components/PlaceCard/tabs/ReviewInlineMarkdown.jsx',
  '../src/components/PlaceCard/tabs/planner/plannerToolkitError.js',
  '../src/components/PlaceCard/tabs/planner/PlannerToolkitErrorNotice.jsx',
];
const outboundQuery = /[?&](utm_|aff=|ref=|partner=)/;
for (const rel of outboundFiles) {
  const text = readFileSync(new URL(rel, import.meta.url), 'utf8');
  assert.equal(outboundQuery.test(text), false, rel);
}

console.log('smoke-inbound-utm: OK');
