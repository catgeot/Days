#!/usr/bin/env node
/**
 * 지구본 중분류 나라 목록 — 멤버십 유지 · 시작국 · nearest-neighbor 연쇄.
 * 네트워크 없음. Usage: npm run smoke:globe-face-neighbor-order
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

const {
  getFaceSubregions,
  getFaceRegionsForSubregion,
  orderRegionsByNeighborChain,
  regionCoordDistance,
} = await load('src/pages/Home/lib/globeFaceSubregions.js');
const { getFaceRegionsForCategory } = await load('src/pages/Home/lib/globeFaceRegions.js');
const { GLOBE_CATEGORY_IDS } = await load('src/pages/Home/lib/globeCategoryFocus.js');

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`OK: ${msg}`);
  }
}

{
  const sample = [
    { id: 'a', labelKo: 'A', lat: 0, lng: 0 },
    { id: 'b', labelKo: 'B', lat: 0, lng: 10 },
    { id: 'c', labelKo: 'C', lat: 0, lng: 20 },
  ];
  const ordered = orderRegionsByNeighborChain(sample, 'a');
  assert(
    ordered.map((r) => r.id).join(',') === 'a,b,c',
    'orderRegionsByNeighborChain a→b→c',
  );
  assert(regionCoordDistance(sample[0], sample[2]) > regionCoordDistance(sample[0], sample[1]), 'distance monotonic');
}

for (const cat of GLOBE_CATEGORY_IDS) {
  const subs = getFaceSubregions(cat);
  for (const sub of subs) {
    const faceFiltered = getFaceRegionsForCategory(cat).filter((r) =>
      sub.countryIds.includes(r.id),
    );
    const ordered = getFaceRegionsForSubregion(cat, sub.id);
    const faceIds = new Set(faceFiltered.map((r) => r.id));
    const orderedIds = new Set(ordered.map((r) => r.id));

    assert(
      faceIds.size === orderedIds.size && [...faceIds].every((id) => orderedIds.has(id)),
      `${cat}/${sub.id} membership preserved (${ordered.length})`,
    );

    const preferred = sub.countryIds.find((id) => faceIds.has(id));
    if (preferred) {
      assert(ordered[0]?.id === preferred, `${cat}/${sub.id} starts at ${preferred}`);
    }

    if (ordered.length >= 3) {
      let greedyOk = true;
      const rem = [...ordered];
      const path = [rem.shift()];
      while (rem.length > 0) {
        const cur = path[path.length - 1];
        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i < rem.length; i += 1) {
          const d = regionCoordDistance(cur, rem[i]);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        if (rem[best].id !== ordered[path.length].id) {
          greedyOk = false;
          break;
        }
        path.push(rem.splice(best, 1)[0]);
      }
      assert(greedyOk, `${cat}/${sub.id} matches greedy neighbor chain`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS smoke:globe-face-neighbor-order');
