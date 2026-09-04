#!/usr/bin/env node
/**
 * Generate merge-local-scenic-r13..r29.mjs from ROUND_DATA + hub link resolution.
 * Run: node scripts/build-merge-local-scenic-r13-r29.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ROUND_DATA } from './lib/local-scenic-rounds-r13-r29-data.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const hubsPath = join(scriptsDir, '..', 'src/pages/Home/data/cityAttractionHubs.json');
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const hubKeys = new Map();
for (const h of hubs) {
  hubKeys.set(
    h.hubId,
    new Set((h.attractions || []).map((a) => normalizeKey(a.name))),
  );
}

function resolveMember(hubId, m) {
  const keys = hubKeys.get(hubId);
  if (!keys) throw new Error(`hub missing: ${hubId}`);
  const candidates = [m.hubLink, m.attractionName].filter(Boolean);
  for (const c of candidates) {
    if (keys.has(normalizeKey(c))) {
      return {
        attractionName: c,
        name_en: m.name_en,
        kind: m.kind,
        linkStatus: 'linked',
      };
    }
  }
  const row = {
    attractionName: m.attractionName,
    name_en: m.name_en,
    kind: m.kind,
    linkStatus: 'pending_coord',
  };
  if (m.lat != null) row.lat = m.lat;
  if (m.lng != null) row.lng = m.lng;
  return row;
}

function finalizeList(list) {
  return {
    ...list,
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: list.members.map((m) => resolveMember(list.hubId, m)),
  };
}

function formatMember(m, indent) {
  const parts = [
    `attractionName: '${m.attractionName.replace(/'/g, "\\'")}'`,
    `name_en: '${m.name_en.replace(/'/g, "\\'")}'`,
    `kind: '${m.kind}'`,
  ];
  if (m.lat != null) parts.push(`lat: ${m.lat}`);
  if (m.lng != null) parts.push(`lng: ${m.lng}`);
  parts.push(`linkStatus: '${m.linkStatus}'`);
  return `${indent}{ ${parts.join(', ')} }`;
}

function formatList(list, indent) {
  const aliasStr = list.aliases.map((a) => `'${a.replace(/'/g, "\\'")}'`).join(', ');
  const memberLines = list.members.map((m) => formatMember(m, indent + '  ')).join(',\n');
  return `${indent}{
${indent}  listId: '${list.listId}',
${indent}  hubId: '${list.hubId}',
${indent}  title: '${list.title.replace(/'/g, "\\'")}',
${indent}  title_en: '${list.title_en.replace(/'/g, "\\'")}',
${indent}  listKind: '${list.listKind}',
${indent}  memberCountClaimed: ${list.memberCountClaimed},
${indent}  aliases: [${aliasStr}],
${indent}  sourceUrl: '${list.sourceUrl}',
${indent}  sourceOrg: '${list.sourceOrg.replace(/'/g, "\\'")}',
${indent}  sourceFetchedAt: '2026-09-04',
${indent}  status: 'verified',
${indent}  members: [
${memberLines}
${indent}  ],
${indent}}`;
}

for (const [roundKey, round] of Object.entries(ROUND_DATA)) {
  const n = roundKey.replace('R', '');
  const outPath = join(scriptsDir, `merge-local-scenic-r${n}.mjs`);
  const skipLines = (round.skipNote || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ` * ${s}`)
    .join('\n');

  if (round.skipOnly) {
    const body = `#!/usr/bin/env node
/**
 * F R${n}: koreaLocalScenicLists append 없음.
${skipLines}
 */
console.log('merged R${n}: (none)');
${round.skipNote
  ?.split('|')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => `console.log('${s.replace(/'/g, "\\'")}');`)
  .join('\n')}
`;
    writeFileSync(outPath, body, 'utf8');
    console.log('wrote', outPath, '(skip-only)');
    continue;
  }

  const lists = round.lists.map(finalizeList);
  const listsStr = lists.map((l) => formatList(l, '  ')).join(',\n');

  const body = `#!/usr/bin/env node
/**
 * F R${n}: koreaLocalScenicLists append + hub merge.
${skipLines}
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R${n}_LISTS = [
${listsStr}
];

mergeListsIntoTip(R${n}_LISTS, { roundLabel: 'R${n}' });
`;
  writeFileSync(outPath, body, 'utf8');
  console.log('wrote', outPath, `(${lists.length} lists)`);
}
