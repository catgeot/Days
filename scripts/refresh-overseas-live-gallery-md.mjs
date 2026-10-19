#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../gateo-ops/audit/overseas-live-gallery-sample-2026-10-19');
const live = JSON.parse(readFileSync(join(dir, 'live-credit-sample.json'), 'utf8'));
const gate = JSON.parse(readFileSync(join(dir, 'overseas-live-gallery-gate.json'), 'utf8'));
const base = readFileSync(join(dir, 'overseas-live-gallery-sample.md'), 'utf8');
const tableStart = base.indexOf('## 10-place live credit sample');
const head = base.slice(0, tableStart);
const rows = live.map((row) => {
  const g = gate.sample.find((s) => s.slug === row.slug) || {};
  return `| ${row.slug} | ${row.continent || ''} | ${g.mainWouldTourApi ?? ''} | ${g.branchWouldTourApi ?? ''} | ${row.prod?.kto ? 'yes' : 'no'} — ${(row.prod?.text || row.error || '').replace(/\|/g, '/')} | ${row.local?.kto ? 'yes' : 'no'} — ${(row.local?.text || '').replace(/\|/g, '/')} |`;
});
const md = `${head}## 10-place live credit sample (PROD main vs local fix, search path)

| slug | continent | main gate | branch gate | prod credit (KTO?) | local credit (KTO?) |
|------|-----------|-----------|-------------|---------------------|---------------------|
${rows.join('\n')}

**PROD live TourAPI/KTO today (this sample):** ${live.filter((r) => r.prod?.kto).map((r) => r.slug).join(', ') || 'none'}

`;
writeFileSync(join(dir, 'overseas-live-gallery-sample.md'), md, 'utf8');
console.log('refreshed md');
