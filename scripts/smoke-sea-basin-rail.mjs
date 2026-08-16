#!/usr/bin/env node
import { pickVisibleSeaBasins, getSpotSlugsForSeaBasin } from '../src/pages/Home/lib/seaBasinRail.js';

const aegeanView = {
  viewBounds: [20, 34, 30, 42],
  viewCenter: { lng: 25, lat: 38 },
  category: 'urban',
};

const picked = pickVisibleSeaBasins(aegeanView);
if (picked.length < 3 || picked.length > 8) {
  console.error(`FAIL pickVisibleSeaBasins count=${picked.length} (expected 3~8)`);
  process.exit(1);
}

const hasAegean = picked.some((b) => b.id === 'aegean');
if (!hasAegean) {
  console.error('FAIL aegean view should include aegean basin');
  process.exit(1);
}

const slugs = getSpotSlugsForSeaBasin('aegean');
if (slugs.length < 2) {
  console.error(`FAIL aegean spot slugs=${slugs.length}`);
  process.exit(1);
}

console.log(`PASS sea-basin-rail (${picked.map((b) => b.id).join(', ')})`);
