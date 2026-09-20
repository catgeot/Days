#!/usr/bin/env node
/**
 * GSC baseline filled CSV audit — 173 URL completeness gate.
 *
 *   npm run audit:gsc-baseline
 *   GSC_BASELINE_CSV=/path/to/file.csv npm run audit:gsc-baseline
 *
 * Human workflow (로컬 PC — Cloud VM과 outputs 미공유 · gitignore):
 *   1. npm run generate:gsc-baseline
 *   2. cp scripts/data/gsc-seo-baseline-template.csv scripts/outputs/gsc-seo-baseline.csv
 *   3. Fill checked_at · gsc_index_status · gsc_last_crawl from GSC URL Inspection
 *   4. npm run audit:gsc-baseline
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { indexGscBaselineByUrl, parseGscBaselineCsv } from './lib/parse-gsc-baseline-csv.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const templatePath = join(root, 'scripts/data/gsc-seo-baseline-template.csv');
const outputPath =
  process.env.GSC_BASELINE_CSV?.trim() ||
  join(root, 'scripts/outputs/gsc-seo-baseline.csv');
const outDir = join(root, 'scripts/outputs');
const outJson = join(outDir, 'gsc-seo-baseline-audit.json');

function isFilled(value) {
  return String(value ?? '').trim().length > 0;
}

if (!existsSync(outputPath)) {
  console.error('audit:gsc-baseline');
  console.error(`  FAIL  missing ${outputPath.replace(`${root}/`, '')}`);
  console.error('  → cp scripts/data/gsc-seo-baseline-template.csv scripts/outputs/gsc-seo-baseline.csv');
  console.error('  → fill checked_at · gsc_index_status · gsc_last_crawl (GSC URL Inspection 173건)');
  process.exit(1);
}

const templateRows = parseGscBaselineCsv(readFileSync(templatePath, 'utf8'));
const filledRows = parseGscBaselineCsv(readFileSync(outputPath, 'utf8'));
const templateByUrl = indexGscBaselineByUrl(templateRows);
const filledByUrl = indexGscBaselineByUrl(filledRows);

const missingUrls = [];
const extraUrls = [];
const incompleteRows = [];

for (const url of templateByUrl.keys()) {
  if (!filledByUrl.has(url)) {
    missingUrls.push(url);
  }
}

for (const url of filledByUrl.keys()) {
  if (!templateByUrl.has(url)) {
    extraUrls.push(url);
  }
}

for (const row of filledRows) {
  const missingFields = [];
  if (!isFilled(row.checked_at)) missingFields.push('checked_at');
  if (!isFilled(row.gsc_index_status)) missingFields.push('gsc_index_status');
  if (!isFilled(row.gsc_last_crawl)) missingFields.push('gsc_last_crawl');
  if (missingFields.length) {
    incompleteRows.push({ url: row.url, notes: row.notes, missingFields });
  }
}

const statusCounts = {};
const notesCounts = {};

for (const row of filledRows) {
  const status = row.gsc_index_status.trim() || '(empty)';
  statusCounts[status] = (statusCounts[status] || 0) + 1;
  const noteKey = row.notes || '(none)';
  notesCounts[noteKey] = (notesCounts[noteKey] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  templateUrlCount: templateRows.length,
  filledUrlCount: filledRows.length,
  completeRowCount: filledRows.length - incompleteRows.length,
  incompleteRowCount: incompleteRows.length,
  missingUrlCount: missingUrls.length,
  extraUrlCount: extraUrls.length,
  statusCounts,
  notesCounts,
  missingUrls: missingUrls.slice(0, 20),
  extraUrls: extraUrls.slice(0, 20),
  incompleteRows: incompleteRows.slice(0, 20),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

console.log('audit:gsc-baseline');
console.log(`  filled CSV         ${outputPath.replace(`${root}/`, '')}`);
console.log(`  template URLs      ${report.templateUrlCount}`);
console.log(`  filled URLs        ${report.filledUrlCount}`);
console.log(`  complete rows      ${report.completeRowCount}/${report.filledUrlCount}`);
console.log(`  missing URLs       ${report.missingUrlCount}`);
console.log(`  extra URLs         ${report.extraUrlCount}`);
console.log(`  incomplete rows    ${report.incompleteRowCount}`);
console.log('  status breakdown');
for (const [status, count] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${count.toString().padStart(3)}  ${status}`);
}
console.log(`  report             ${outJson}`);

let failed = 0;

if (report.filledUrlCount !== report.templateUrlCount) {
  failed += 1;
  console.error(
    `\nFAIL: row count ${report.filledUrlCount} !== template ${report.templateUrlCount}`,
  );
}

if (missingUrls.length) {
  failed += 1;
  console.error(`\nFAIL: ${missingUrls.length} template URL(s) missing from output`);
  for (const url of missingUrls.slice(0, 5)) console.error(`  - ${url}`);
}

if (incompleteRows.length) {
  failed += 1;
  if (report.completeRowCount === 0 && report.incompleteRowCount === report.filledUrlCount) {
    console.error(
      '\nHINT: outputs CSV looks like an unfilled template copy — GSC URL Inspection 값을 아직 넣지 않은 상태입니다.',
    );
    console.error('  → Search Console → URL Inspection → 각 URL의 색인·크롤일을 CSV 3열에 기록');
    console.error('  → checked_at(점검일) · gsc_index_status · gsc_last_crawl');
    console.error(
      '  → scripts/outputs/ 는 gitignore · 로컬 PC에서 기록한 CSV는 Cloud Agent VM과 공유되지 않음',
    );
    console.error('  → 로컬에서 audit: GSC_BASELINE_CSV=~/path/gsc-seo-baseline.csv npm run audit:gsc-baseline');
  }
  console.error(`\nFAIL: ${incompleteRows.length} row(s) missing GSC fields`);
  for (const row of incompleteRows.slice(0, 5)) {
    console.error(`  - ${row.url} (${row.missingFields.join(', ')})`);
  }
  if (incompleteRows.length > 5) {
    console.error(`  … and ${incompleteRows.length - 5} more (see ${outJson.replace(`${root}/`, '')})`);
  }
}

if (extraUrls.length) {
  console.warn(`\nWARN: ${extraUrls.length} URL(s) not in template (ignored for gate)`);
}

if (failed > 0) {
  console.error(`\n${failed} gate(s) failed`);
  process.exit(1);
}

console.log('\nOK audit:gsc-baseline');
