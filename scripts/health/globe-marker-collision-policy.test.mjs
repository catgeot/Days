import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TRAVEL_SPOTS } from '../../src/pages/Home/data/travelSpots.js';
import {
  GLOBE_MAJOR_LABEL_OVERLAP_MIN_ZOOM,
  HIGH_ZOOM_FULL_REVEAL,
  TIER_STAGE_ZOOM_LEVELS,
  getMajorMergeThreshold,
  getMarkerCollisionThreshold,
} from '../../src/pages/Home/lib/globeZoomPolicy.js';
import { annotateLabelOverlapEligibility } from '../../src/pages/Home/lib/globeMarkerLabelOverlap.js';

const normalizeLngDelta = (a, b) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const areCoordsNear = (a, b, thresholdDeg) => {
  const latDiff = Math.abs(a.lat - b.lat);
  const lngDiff = normalizeLngDelta(a.lng, b.lng);
  return latDiff <= thresholdDeg && lngDiff <= thresholdDeg;
};

function simulateMajorMerge(slugs, zoom) {
  const spots = slugs.map((slug) => TRAVEL_SPOTS.find((s) => s.slug === slug)).filter(Boolean);
  const mergeThreshold = getMajorMergeThreshold(zoom);
  const sorted = [...spots].sort(
    (a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0),
  );
  const clusters = [];
  sorted.forEach((spot) => {
    const cluster = clusters.find((c) =>
      areCoordsNear(c.anchor, { lat: spot.lat, lng: spot.lng }, mergeThreshold),
    );
    if (cluster) cluster.items.push(spot);
    else clusters.push({ anchor: { lat: spot.lat, lng: spot.lng }, items: [spot] });
  });
  return { mergeThreshold, clusters };
}

test('tier-2 zoom gate matches major label overlap policy', () => {
  assert.equal(GLOBE_MAJOR_LABEL_OVERLAP_MIN_ZOOM, TIER_STAGE_ZOOM_LEVELS.tier2);
});

test('default globe zoom keeps coarse merge thresholds', () => {
  assert.equal(getMajorMergeThreshold(1.25), 1.75);
  assert.equal(getMarkerCollisionThreshold(1.25), 1.2);
});

test('khao-lak merges into phuket cluster below tier-2 zoom', () => {
  const { clusters } = simulateMajorMerge(['phuket', 'khao-lak'], 2.0);
  const phuketCluster = clusters.find((c) => c.items.some((s) => s.slug === 'phuket'));
  assert.ok(phuketCluster, 'phuket cluster');
  assert.ok(
    phuketCluster.items.some((s) => s.slug === 'khao-lak'),
    'khao-lak hidden in phuket merge below tier-2 zoom',
  );
});

test('phuket and khao-lak are label overlap-eligible when separate at tier-2', () => {
  const phuket = TRAVEL_SPOTS.find((s) => s.slug === 'phuket');
  const khao = TRAVEL_SPOTS.find((s) => s.slug === 'khao-lak');
  const out = annotateLabelOverlapEligibility([
    { ...phuket, type: 'major' },
    { ...khao, type: 'major' },
  ]);
  assert.ok(out.every((m) => m.labelOverlapEligible));
});

test('khao-lak and phuket stay separate from tier-2 zoom upward', () => {
  for (const zoom of [TIER_STAGE_ZOOM_LEVELS.tier2, 2.7, HIGH_ZOOM_FULL_REVEAL]) {
    const { clusters } = simulateMajorMerge(['phuket', 'khao-lak'], zoom);
    const khaoOwn = clusters.some((c) => c.items.length === 1 && c.items[0].slug === 'khao-lak');
    const phuketOwn = clusters.some((c) => c.items.length === 1 && c.items[0].slug === 'phuket');
    assert.ok(khaoOwn, `khao-lak own cluster at zoom ${zoom}`);
    assert.ok(phuketOwn, `phuket own cluster at zoom ${zoom}`);
  }
});
