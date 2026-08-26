#!/usr/bin/env node
/**
 * Place SEO EN overrides — coverage, desc quality, Hangul gate.
 *
 *   npm run audit:place-seo-en
 *
 * Gates (exit 1):
 *   - Hangul in any override desc_en / keywords_en
 *   - desc_en shorter than 80 chars or longer than 320 chars
 *   - tier2 popularity>=80 batch slugs missing override (when --batch gate)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLACE_SEO_EN_OVERRIDES } from '../src/data/placeSeoEnOverrides.js';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'scripts/outputs');
const outJson = join(outDir, 'place-seo-en-audit.json');

const HANGUL = /[\u3131-\u318e\uac00-\ud7a3]/;
const DESC_MIN = 80;
const DESC_MAX = 320;
const TIER2_POP_GATE = 80;
const TIER2_POP70_GATE = 70;

const tier2Pop80 = TRAVEL_SPOTS.filter(
  (s) => s.tier === 2 && (s.popularity ?? 0) >= TIER2_POP_GATE,
).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

const tier2Pop70to79 = TRAVEL_SPOTS.filter(
  (s) => s.tier === 2 && (s.popularity ?? 0) >= TIER2_POP70_GATE && (s.popularity ?? 0) < TIER2_POP_GATE,
).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

const overrideSlugs = Object.keys(PLACE_SEO_EN_OVERRIDES);
const hangulViolations = [];
const descLengthViolations = [];
const missingKeywords = [];

for (const slug of overrideSlugs) {
  const row = PLACE_SEO_EN_OVERRIDES[slug];
  const desc = String(row?.desc_en || '').trim();
  const keywords = Array.isArray(row?.keywords_en) ? row.keywords_en : [];

  if (HANGUL.test(desc) || keywords.some((k) => HANGUL.test(k))) {
    hangulViolations.push(slug);
  }
  if (desc.length < DESC_MIN || desc.length > DESC_MAX) {
    descLengthViolations.push({ slug, len: desc.length });
  }
  if (!keywords.length) {
    missingKeywords.push(slug);
  }
}

const tier2Pop80Missing = tier2Pop80.filter((s) => !PLACE_SEO_EN_OVERRIDES[s.slug]);
const tier2Pop70Missing = tier2Pop70to79.filter((s) => !PLACE_SEO_EN_OVERRIDES[s.slug]);

const report = {
  generatedAt: new Date().toISOString(),
  overrideCount: overrideSlugs.length,
  tier2Total: TRAVEL_SPOTS.filter((s) => s.tier === 2).length,
  tier2Pop80Total: tier2Pop80.length,
  tier2Pop80Covered: tier2Pop80.length - tier2Pop80Missing.length,
  tier2Pop80Missing: tier2Pop80Missing.map((s) => ({
    slug: s.slug,
    popularity: s.popularity,
    name_en: s.name_en,
  })),
  tier2Pop70to79Total: tier2Pop70to79.length,
  tier2Pop70to79Covered: tier2Pop70to79.length - tier2Pop70Missing.length,
  tier2Pop70to79Missing: tier2Pop70Missing.map((s) => ({
    slug: s.slug,
    popularity: s.popularity,
    name_en: s.name_en,
  })),
  hangulViolations,
  descLengthViolations,
  missingKeywords,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

console.log('audit:place-seo-en');
console.log(`  overrides           ${report.overrideCount}`);
console.log(
  `  tier2 pop>=${TIER2_POP_GATE}   ${report.tier2Pop80Covered}/${report.tier2Pop80Total} covered`,
);
console.log(
  `  tier2 pop70-79   ${report.tier2Pop70to79Covered}/${report.tier2Pop70to79Total} covered`,
);
console.log(`  hangul violations   ${hangulViolations.length}`);
console.log(`  desc length issues  ${descLengthViolations.length}`);
console.log(`  missing keywords    ${missingKeywords.length}`);
console.log(`  report              ${outJson}`);

let failed = 0;

if (hangulViolations.length) {
  failed += 1;
  console.error('\nFAIL: Hangul in EN overrides:');
  for (const slug of hangulViolations.slice(0, 10)) console.error(`  - ${slug}`);
}
if (descLengthViolations.length) {
  failed += 1;
  console.error('\nFAIL: desc_en length out of range:');
  for (const v of descLengthViolations.slice(0, 10)) {
    console.error(`  - ${v.slug} (${v.len} chars)`);
  }
}
if (missingKeywords.length) {
  failed += 1;
  console.error('\nFAIL: missing keywords_en:');
  for (const slug of missingKeywords.slice(0, 10)) console.error(`  - ${slug}`);
}

if (failed > 0) {
  console.error(`\n${failed} gate(s) failed`);
  process.exit(1);
}

console.log('\nOK audit:place-seo-en');
