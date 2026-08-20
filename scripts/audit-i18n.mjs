#!/usr/bin/env node
/**
 * i18n 커버리지 감사 — locale 키 parity + P0 파일 한글 리터럴 baseline.
 * exit 0 = locale 키 parity OK (P0 한글 잔여는 baseline debt로 허용)
 * exit 1 = en 누락 키 또는 P0 파일 누락
 *
 * Usage: npm run audit:i18n
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { I18N_AUDIT_P0_ALL } from './data/i18n-audit-p0.mjs';
import { runI18nAudit } from './lib/audit-i18n.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'scripts/outputs');
const outJson = join(outDir, 'i18n-audit-baseline.json');

const report = runI18nAudit(root, I18N_AUDIT_P0_ALL);
mkdirSync(outDir, { recursive: true });
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

const { localeKeys, p0 } = report;
console.log('audit:i18n baseline');
console.log(`  locale keys  ko=${localeKeys.ko} en=${localeKeys.en}`);
console.log(`  missingInEn  ${localeKeys.missingInEn.length}`);
console.log(`  missingInKo  ${localeKeys.missingInKo.length}`);
console.log(`  P0 files     ${p0.fileCount} (${p0.filesWithHangul} with hangul lines: ${p0.hangulLineTotal})`);
for (const [tier, t] of Object.entries(p0.tierTotals).sort()) {
  console.log(`    tier ${tier}  files=${t.files} hangulLines=${t.hangulLines}`);
}
console.log(`  report       ${outJson}`);

if (localeKeys.missingInEn.length) {
  console.error('\nFAIL: en.json missing keys (first 10):');
  for (const k of localeKeys.missingInEn.slice(0, 10)) console.error(`  - ${k}`);
  process.exit(1);
}
if (p0.missingFiles.length) {
  console.error('\nFAIL: P0 file missing:');
  for (const p of p0.missingFiles) console.error(`  - ${p}`);
  process.exit(1);
}

const topDebt = p0.files
  .filter((f) => f.hangulLiterals > 0)
  .sort((a, b) => b.hangulLiterals - a.hangulLiterals)
  .slice(0, 8);
if (topDebt.length) {
  console.log('\nP0 hangul debt (top):');
  for (const f of topDebt) {
    console.log(`  ${f.hangulLiterals.toString().padStart(3)}  ${f.path}`);
  }
}

console.log('\nOK audit:i18n baseline (P0 debt tracked — not a gate yet)');
