/**
 * Apply 5-stage island aerial cinematic keyframes to globeLandmarks entries.
 * Run: node scripts/apply-island-cinematic-keyframes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIslandCinematicKeyframes } from '../src/pages/Home/lib/globeTourTemplates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDMARKS_PATH = path.join(__dirname, '../src/pages/Home/data/globeLandmarks.json');

/** overview = wide island view · landing = final POI/beach · scale = small|medium|large */
const ISLAND_CINEMATIC = {
  santorini: { overview: [25.42, 36.39], landing: [25.3753, 36.4618], scale: 'small' },
  bali: { overview: [115.19, -8.41], landing: [115.0882, -8.8291], scale: 'large' },
  phuket: { overview: [98.35, 7.95], landing: [98.298, 7.895], scale: 'medium' },
  maldives: { overview: [73.5405, 4.2081], landing: [73.529, 4.1918], scale: 'small', startBearing: -24 },
  hvar: { overview: [16.65, 43.12], landing: [16.442, 43.159], scale: 'small' },
  jeju: { overview: [126.53, 33.38], landing: [126.93, 33.46], scale: 'large' },
  honolulu: { overview: [-157.95, 21.48], landing: [-157.826, 21.279], scale: 'medium' },
  'el-nido': { overview: [119.39, 11.2], landing: [119.39, 11.2], scale: 'medium' },
  'phu-quoc': { overview: [103.98, 10.15], landing: [103.957, 10.228], scale: 'medium' },
  'phi-phi-islands': { overview: [98.678, 7.677], landing: [98.678, 7.677], scale: 'small' },
  'gili-meno': { overview: [116.07, -8.35], landing: [116.072, -8.348], scale: 'small' },
  sicily: { overview: [14.0, 37.6], landing: [15.29, 37.852], scale: 'large' },
  rarotonga: { overview: [-159.776, -21.237], landing: [-159.776, -21.237], scale: 'medium' },
  madeira: { overview: [-17.0, 32.75], landing: [-16.976, 32.656], scale: 'medium' },
  'canary-islands': { overview: [-15.57, 28.1], landing: [-15.576, 27.762], scale: 'large' },
  'komodo-island': { overview: [119.55, -8.55], landing: [119.524, -8.614], scale: 'medium', startBearing: -40 },
  'andaman-islands': { overview: [92.65, 11.75], landing: [92.984, 11.978], scale: 'medium' },
  crete: { overview: [24.9, 35.2], landing: [23.583, 35.497], scale: 'large' },
  lombok: { overview: [116.35, -8.65], landing: [116.038, -8.351], scale: 'medium' },
  hawaii: { overview: [-158.0, 21.5], landing: [-158.05, 21.64], scale: 'large' },
  palawan: { overview: [118.74, 10.0], landing: [118.74, 10.0], scale: 'large' },
  bohol: { overview: [124.0, 9.85], landing: [124.17, 9.82], scale: 'medium' },
  'cocos-islands': { overview: [96.873, -12.1642], landing: [96.873, -12.1642], scale: 'small' }
};

const landmarks = JSON.parse(fs.readFileSync(LANDMARKS_PATH, 'utf8'));
let applied = 0;
let skipped = 0;

for (const [slug, cfg] of Object.entries(ISLAND_CINEMATIC)) {
  const entry = landmarks[slug];
  if (!entry) {
    console.warn(`skip (missing slug): ${slug}`);
    skipped += 1;
    continue;
  }
  if (entry.keyframes?.length) {
    console.log(`skip (already has keyframes): ${slug}`);
    skipped += 1;
    continue;
  }

  const { overview, landing, scale, startBearing } = cfg;
  entry.keyframes = buildIslandCinematicKeyframes(overview, landing, { scale, startBearing });
  delete entry.template;
  delete entry.orbit;
  applied += 1;
  console.log(`applied: ${slug}`);
}

fs.writeFileSync(LANDMARKS_PATH, `${JSON.stringify(landmarks, null, 2)}\n`, 'utf8');
console.log(`\ndone — applied: ${applied}, skipped: ${skipped}`);
