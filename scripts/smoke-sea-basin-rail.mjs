#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  pickVisibleSeaBasins,
  getSpotSlugsForSeaBasin,
  stabilizeSeaBasinList,
  SEA_BASIN_LIST_MAX_COUNT,
} from '../src/pages/Home/lib/seaBasinRail.js';

const highlightSrc = readFileSync(
  fileURLToPath(new URL('../src/pages/Home/lib/globeRegionHighlight.js', import.meta.url)),
  'utf8',
);
if (!highlightSrc.includes('gateo-sea-basin-highlight-label')) {
  console.error('FAIL sea basin map label layer missing in globeRegionHighlight.js');
  process.exit(1);
}

const aegeanView = {
  viewBounds: [20, 34, 30, 42],
  viewCenter: { lng: 25, lat: 38 },
  category: 'urban',
};

const picked = pickVisibleSeaBasins(aegeanView);
if (picked.length < 3) {
  console.error(`FAIL pickVisibleSeaBasins count=${picked.length} (expected >= 3 intersecting)`);
  process.exit(1);
}

const hasAegean = picked.some((b) => b.id === 'aegean');
if (!hasAegean) {
  console.error('FAIL aegean view should include aegean basin');
  process.exit(1);
}

const nudged = pickVisibleSeaBasins({
  viewBounds: [20.1, 34.1, 30.1, 42.1],
  viewCenter: { lng: 25.1, lat: 38.1 },
  category: 'urban',
});
const stable = stabilizeSeaBasinList(picked, nudged);
if (stable !== picked) {
  console.error(`FAIL stabilize should keep order/ref when same members: ${stable.map((b) => b.id).join(',')}`);
  process.exit(1);
}

const capped = pickVisibleSeaBasins({
  viewBounds: [120, -20, 200, 40],
  viewCenter: { lng: 160, lat: 10 },
  category: 'paradise',
  maxCount: 8,
});
if (capped.length > 8) {
  console.error(`FAIL maxCount cap should limit count, got ${capped.length}`);
  process.exit(1);
}

const uncapped = pickVisibleSeaBasins({
  viewBounds: [120, -20, 200, 40],
  viewCenter: { lng: 160, lat: 10 },
  category: 'paradise',
});
if (uncapped.length < capped.length) {
  console.error(`FAIL default maxCount=${SEA_BASIN_LIST_MAX_COUNT} should show >= capped view`);
  process.exit(1);
}

const slugs = getSpotSlugsForSeaBasin('aegean');
if (slugs.length < 2) {
  console.error(`FAIL aegean spot slugs=${slugs.length}`);
  process.exit(1);
}

console.log(`PASS sea-basin-rail (${picked.map((b) => b.id).join(', ')})`);
