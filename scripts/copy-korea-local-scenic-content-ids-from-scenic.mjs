/**
 * P0-C01 — scenic JSON 동일 hub+attractionName contentId → 팔경 멤버 + 동명 hub attraction.
 * Tour LIVE 없음. scenic 승격 없음.
 *
 *   node scripts/copy-korea-local-scenic-content-ids-from-scenic.mjs --dry-run
 *   node scripts/copy-korea-local-scenic-content-ids-from-scenic.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { normalizeKey } from './lib/tour-content-id-match.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LISTS_PATH = join(ROOT, 'src/pages/Home/data/koreaLocalScenicLists.json');
const HUBS_PATH = join(ROOT, 'src/pages/Home/data/cityAttractionHubs.json');
const SCENIC_PATH = join(ROOT, 'src/pages/Home/data/koreaScenicSpots.json');

const dryRun = process.argv.includes('--dry-run');

function scenicKey(hubId, attractionName) {
  return `${String(hubId).toLowerCase()}::${normalizeKey(attractionName)}`;
}

function hasContentId(value) {
  return value && /^\d{1,32}$/.test(String(value));
}

function buildScenicIndex(scenic) {
  const index = new Map();
  const dupes = [];
  for (const spot of scenic.spots || []) {
    if (!spot?.hubId || !spot?.attractionName) continue;
    if (!hasContentId(spot.contentId)) continue;
    const key = scenicKey(spot.hubId, spot.attractionName);
    const prev = index.get(key);
    if (prev && prev.contentId !== spot.contentId) {
      dupes.push({ key, prev: prev.contentId, next: spot.contentId });
      continue;
    }
    if (!prev) {
      index.set(key, {
        contentId: String(spot.contentId),
        scenicId: spot.id,
        scenicName: spot.attractionName,
      });
    }
  }
  return { index, dupes };
}

function collectTargets(lists, scenicIndex) {
  const targets = [];
  for (const list of lists) {
    if (list.status !== 'verified') continue;
    for (const member of list.members || []) {
      if (!member?.attractionName) continue;
      if (hasContentId(member.contentId)) continue;
      const key = scenicKey(list.hubId, member.attractionName);
      const scenic = scenicIndex.get(key);
      if (!scenic) continue;
      targets.push({
        listId: list.listId,
        hubId: list.hubId,
        attractionName: member.attractionName,
        contentId: scenic.contentId,
        scenicId: scenic.scenicId,
      });
    }
  }
  return targets;
}

function applyTargets(lists, hubs, targets) {
  let memberApplied = 0;
  let hubApplied = 0;

  for (const row of targets) {
    const list = lists.find((l) => l.listId === row.listId);
    if (!list) continue;
    for (const member of list.members || []) {
      if (member.attractionName !== row.attractionName) continue;
      if (hasContentId(member.contentId)) continue;
      member.contentId = row.contentId;
      memberApplied += 1;
    }

    const hub = hubs.find((h) => h.hubId === list.hubId);
    if (!hub) continue;
    const memberKeyNorm = normalizeKey(row.attractionName);
    const attr = (hub.attractions || []).find((a) => normalizeKey(a.name) === memberKeyNorm);
    if (attr && attr.contentId !== row.contentId) {
      attr.contentId = row.contentId;
      hubApplied += 1;
    }
  }

  return { memberApplied, hubApplied };
}

function main() {
  const scenic = JSON.parse(readFileSync(SCENIC_PATH, 'utf8'));
  const lists = JSON.parse(readFileSync(LISTS_PATH, 'utf8'));
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));

  const { index: scenicIndex, dupes } = buildScenicIndex(scenic);
  if (dupes.length) {
    console.warn(`[copy-scenic-contentId] WARN conflicting scenic IDs for ${dupes.length} keys`);
    for (const d of dupes.slice(0, 5)) {
      console.warn(`  ${d.key}: ${d.prev} vs ${d.next}`);
    }
  }

  const targets = collectTargets(lists, scenicIndex);
  console.log(
    `[copy-scenic-contentId] scenicIndex=${scenicIndex.size} targets=${targets.length}${
      dryRun ? ' · dry-run' : ''
    }`,
  );

  for (const row of targets) {
    console.log(
      `OK  ${row.listId}/${row.attractionName} → ${row.contentId} (scenic ${row.scenicId})`,
    );
  }

  if (!targets.length) {
    console.log('no targets — nothing to write');
    return;
  }

  if (dryRun) {
    console.log('dry-run: JSON not written');
    return;
  }

  const { memberApplied, hubApplied } = applyTargets(lists, hubs, targets);
  writeFileSync(LISTS_PATH, `${JSON.stringify(lists, null, 2)}\n`, 'utf8');
  writeFileSync(HUBS_PATH, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
  console.log(`wrote members=${memberApplied} hubAttrs=${hubApplied}`);
}

main();
