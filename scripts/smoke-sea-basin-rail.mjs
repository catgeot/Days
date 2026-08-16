#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildHierarchicalSeaBasinRail,
  getSeaBasinById,
  getSpotSlugsForSeaBasin,
  inferTopOceanFromView,
  resolveTopOceanForBasin,
  seaBasinToFlyRegion,
  shouldRevealSmallSeaBasins,
  topOceanToFlyRegion,
  clampOceanFlyBbox,
  SEA_BASIN_TOP_OCEANS,
} from '../src/pages/Home/lib/seaBasinRail.js';
import { getFaceSeaOceans } from '../src/pages/Home/lib/faceSeaOceans.js';

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

if (SEA_BASIN_TOP_OCEANS.length !== 4) {
  console.error(`FAIL top oceans should be 4, got ${SEA_BASIN_TOP_OCEANS.length}`);
  process.exit(1);
}

const inferredOcean = inferTopOceanFromView(aegeanView);
if (inferredOcean !== 'mediterranean') {
  console.error(`FAIL inferTopOceanFromView aegean view expected mediterranean, got ${inferredOcean}`);
  process.exit(1);
}

const hierarchy = buildHierarchicalSeaBasinRail({
  ...aegeanView,
  selectedTopOceanId: 'mediterranean',
});
if (hierarchy.topOceans.length !== 4) {
  console.error(`FAIL hierarchy topOceans=${hierarchy.topOceans.length}`);
  process.exit(1);
}
if (hierarchy.activeTopOceanId !== 'mediterranean') {
  console.error(`FAIL hierarchy activeTopOceanId=${hierarchy.activeTopOceanId}`);
  process.exit(1);
}
if (!hierarchy.midRegions.some((b) => b.id === 'tyrrhenian')) {
  console.error(`FAIL mediterranean midRegions missing tyrrhenian: ${hierarchy.midRegions.map((b) => b.id).join(',')}`);
  process.exit(1);
}
if (hierarchy.showSmallSeas && !hierarchy.smallSeas.some((b) => b.id === 'aegean')) {
  console.error(`FAIL zoomed mediterranean should include aegean in smallSeas`);
  process.exit(1);
}

const wideView = buildHierarchicalSeaBasinRail({
  viewBounds: [120, -20, 200, 40],
  viewCenter: { lng: 160, lat: 10 },
  category: 'paradise',
  selectedTopOceanId: 'pacific',
});
if (!wideView.showSmallSeas) {
  console.error('FAIL pacific top-ocean browse should keep smallSeas tier visible');
  process.exit(1);
}
if (wideView.midRegions.length < 4) {
  console.error(`FAIL pacific midRegions=${wideView.midRegions.length} (expected >= 4 tier2)`);
  process.exit(1);
}

const selectedSmall = buildHierarchicalSeaBasinRail({
  ...aegeanView,
  selectedTopOceanId: 'mediterranean',
  selectedSeaBasinId: 'aegean',
});
if (!selectedSmall.showSmallSeas || !selectedSmall.smallSeas.some((b) => b.id === 'aegean')) {
  console.error('FAIL selected basin should reveal smallSeas including aegean');
  process.exit(1);
}

const aegeanOcean = resolveTopOceanForBasin({ id: 'aegean', parentOcean: 'mediterranean', tier: 1 });
if (aegeanOcean !== 'mediterranean') {
  console.error(`FAIL resolveTopOceanForBasin(aegean)=${aegeanOcean}`);
  process.exit(1);
}

if (!shouldRevealSmallSeaBasins(aegeanView.viewBounds, { selectedSeaBasinId: 'aegean' })) {
  console.error('FAIL shouldRevealSmallSeaBasins with selection');
  process.exit(1);
}
if (shouldRevealSmallSeaBasins([120, -20, 200, 40])) {
  console.error('FAIL shouldRevealSmallSeaBasins wide view');
  process.exit(1);
}

const flyRegion = topOceanToFlyRegion('mediterranean');
if (!flyRegion?.bbox || flyRegion.bbox.length !== 4) {
  console.error('FAIL topOceanToFlyRegion(mediterranean) bbox');
  process.exit(1);
}

const pacificFly = topOceanToFlyRegion('pacific');
if (pacificFly?.bbox) {
  const pacificSpan = pacificFly.bbox[2] - pacificFly.bbox[0];
  if (pacificSpan > 100) {
    console.error(`FAIL pacific fly bbox lng span too wide: ${pacificSpan}`);
    process.exit(1);
  }
}
const clamped = clampOceanFlyBbox([0, -40, 360, 50]);
if (!clamped || clamped[2] - clamped[0] > 100) {
  console.error(`FAIL clampOceanFlyBbox should cap lng span, got ${clamped}`);
  process.exit(1);
}

for (const basinId of ['south-pacific', 'yellow-sea', 'central-pacific']) {
  const basin = getSeaBasinById(basinId);
  const fly = seaBasinToFlyRegion(basin);
  if (!fly?.lat || !fly?.lng) {
    console.error(`FAIL seaBasinToFlyRegion(${basinId}) missing center`);
    process.exit(1);
  }
  if (fly.bbox) {
    const span = fly.bbox[2] - fly.bbox[0];
    if (span > 100 || span < 0) {
      console.error(`FAIL seaBasinToFlyRegion(${basinId}) bbox span=${span}`);
      process.exit(1);
    }
  } else if (!Number.isFinite(fly.zoom)) {
    console.error(`FAIL seaBasinToFlyRegion(${basinId}) needs bbox or zoom fallback`);
    process.exit(1);
  }
}

const slugs = getSpotSlugsForSeaBasin('aegean');
if (slugs.length < 2) {
  console.error(`FAIL aegean spot slugs=${slugs.length}`);
  process.exit(1);
}

const urbanOceans = getFaceSeaOceans('urban');
if (urbanOceans.length !== 4) {
  console.error(`FAIL urban face oceans expected 4, got ${urbanOceans.length}: ${urbanOceans.map((o) => o.id).join(',')}`);
  process.exit(1);
}

const medRail = buildHierarchicalSeaBasinRail({
  selectedTopOceanId: 'mediterranean',
  omitTopOceans: true,
});
if (medRail.midRegions.length < 1 || medRail.labelSeas.length < 3) {
  console.error(`FAIL mediterranean rail too small mid=${medRail.midRegions.length} label=${medRail.labelSeas.length}`);
  process.exit(1);
}

const indianRail = buildHierarchicalSeaBasinRail({
  selectedTopOceanId: 'indian',
  omitTopOceans: true,
});
if (indianRail.midRegions.length < 1 || indianRail.labelSeas.length < 4) {
  console.error(`FAIL indian rail too small mid=${indianRail.midRegions.length} label=${indianRail.labelSeas.length}`);
  process.exit(1);
}

const railOnly = buildHierarchicalSeaBasinRail({
  selectedTopOceanId: 'mediterranean',
  omitTopOceans: true,
});
if (railOnly.topOceans.length !== 0 || railOnly.omitTopOceans !== true) {
  console.error('FAIL omitTopOceans should hide top ocean row in rail');
  process.exit(1);
}

console.log(
  `PASS sea-basin-rail (hierarchy med=${hierarchy.midRegions.length} small=${hierarchy.smallSeas.length} urban=${urbanOceans.map((o) => o.id).join('+')} medLabel=${medRail.labelSeas.length})`,
);
