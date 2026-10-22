/**
 * Lists attraction display names that receive parentCity on explore suggestions.
 * Output: artifacts/intro-sangwangbong-qa/parentcity-names.txt
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import hubs from '../src/pages/Home/data/cityAttractionHubs.json' with { type: 'json' };
import scenicLists from '../src/pages/Home/data/koreaLocalScenicLists.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts/intro-sangwangbong-qa');
const outFile = path.join(outDir, 'parentcity-names.txt');

/** @type {Map<string, { parentCity: string, name: string, source: string }>} */
const byKey = new Map();

function add(parentCity, name, source) {
  const p = String(parentCity || '').trim();
  const n = String(name || '').trim();
  if (!p || !n) return;
  const key = `${p}\t${n}`;
  if (!byKey.has(key)) byKey.set(key, { parentCity: p, name: n, source });
}

for (const hub of hubs) {
  const parentCity = hub.name;
  for (const a of hub.attractions || []) {
    add(parentCity, a.name, 'cityAttractionHubs');
  }
}

for (const list of scenicLists) {
  const hub = hubs.find((h) => h.hubId === list.hubId);
  const parentCity = hub?.name || list.hubId;
  for (const m of list.members || []) {
    add(parentCity, m.attractionName, 'koreaLocalScenicLists');
  }
  const display = list.title || list.title_en;
  if (display) add(parentCity, display, 'koreaLocalScenicLists.listTitle');
}

const lines = [...byKey.values()]
  .sort((a, b) => a.parentCity.localeCompare(b.name, 'ko') || a.name.localeCompare(b.name, 'ko'))
  .map((row) => `${row.parentCity}\t${row.name}\t${row.source}`);

const body = [
  '# parentCity + attraction name (tab-separated). Use for read-only place_chat_intro key audit.',
  `# generated: ${new Date().toISOString()}`,
  `# count: ${lines.length}`,
  'parentCity\tname\tsource',
  ...lines,
].join('\n');

await mkdir(outDir, { recursive: true });
await writeFile(outFile, `${body}\n`, 'utf8');
console.log(`Wrote ${lines.length} rows to ${outFile}`);
