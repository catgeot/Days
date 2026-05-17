/**
 * 오버라이드·감사 리포트 기준 검수 큐만 갱신합니다.
 * (generate/audit은 각각 npm run generate:airports / audit:airports 로 실행)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOT_AIRPORT_OVERRIDES } from './data/travel-spot-airport-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_PATH = join(__dirname, '../src/pages/Home/data/travelSpotAirports.json');
const AUDIT_PATH = join(__dirname, 'outputs/rental-airport-audit.json');
const OUT_DIR = join(__dirname, 'outputs');
const REPORT_PATH = join(OUT_DIR, 'travel-spot-airports-enrich-report.json');

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

const existing = loadJson(MAP_PATH);
const audit = loadJson(AUDIT_PATH);

const lowConfidence = [];
if (existing?.spots) {
  for (const [slug, row] of Object.entries(existing.spots)) {
    if (row.confidence === 'low' || row.confidence === 'very-low') {
      lowConfidence.push({ slug, primaryIatas: row.primaryIatas, confidence: row.confidence, rationale: row.rationale });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  overrideCount: Object.keys(TRAVEL_SPOT_AIRPORT_OVERRIDES).length,
  auditNoBanner: audit?.summary?.noBanner ?? audit?.noBanner?.length ?? null,
  lowConfidenceRows: lowConfidence,
  commands: {
    regenerate: 'npm run generate:airports',
    audit: 'npm run audit:airports'
  }
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

console.log('Wrote', REPORT_PATH);
console.log('Overrides:', report.overrideCount);
console.log('Low-confidence slugs:', lowConfidence.length);
if (lowConfidence.length) {
  for (const r of lowConfidence) console.log(`  - ${r.slug} → ${r.primaryIatas.join(', ')} (${r.confidence})`);
}
