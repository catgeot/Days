import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

export function mergeListsIntoTip(roundLists, { roundLabel = '' } = {}) {
  const listsPath = join(root, 'src/pages/Home/data/koreaLocalScenicLists.json');
  const hubsPath = join(root, 'src/pages/Home/data/cityAttractionHubs.json');
  const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
  const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
  const existingIds = new Set(existingLists.map((l) => l.listId));
  for (const list of roundLists) {
    if (existingIds.has(list.listId)) throw new Error(`listId exists: ${list.listId}`);
  }

  function addAliases(hub, titles) {
    if (!hub.aliases) hub.aliases = [];
    const seen = new Set(hub.aliases.map(normalizeKey));
    for (const t of titles) {
      const nk = normalizeKey(t);
      if (!nk || seen.has(nk)) continue;
      hub.aliases.push(t);
      seen.add(nk);
    }
  }

  function mergeListIntoHub(list) {
    const hub = hubs.find((h) => h.hubId === list.hubId);
    if (!hub) throw new Error(`hub missing ${list.hubId}`);
    if (!hub.attractions) hub.attractions = [];
    const attrKeys = new Set(hub.attractions.map((a) => normalizeKey(a.name)));
    addAliases(hub, [list.title, ...(list.aliases || [])]);
    for (const m of list.members) {
      const key = normalizeKey(m.attractionName);
      if (m.linkStatus === 'linked') {
        if (!attrKeys.has(key)) throw new Error(`${list.listId}: linked missing: ${m.attractionName}`);
        continue;
      }
      if (m.linkStatus === 'pending_coord' || m.linkStatus === 'skipped_conflict') continue;
      if (m.linkStatus === 'appended') {
        if (attrKeys.has(key)) throw new Error(`${list.listId}: dup append: ${m.attractionName}`);
        const row = { name: m.attractionName, name_en: m.name_en, kind: m.kind };
        if (m.lat != null) row.lat = m.lat;
        if (m.lng != null) row.lng = m.lng;
        if (m.mapboxId != null) row.mapboxId = m.mapboxId;
        hub.attractions.push(row);
        attrKeys.add(key);
      }
    }
  }

  for (const list of roundLists) mergeListIntoHub(list);
  writeFileSync(listsPath, `${JSON.stringify([...existingLists, ...roundLists], null, 2)}\n`, 'utf8');
  writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
  console.log(`merged ${roundLabel}:`, roundLists.map((l) => l.listId).join(', '));
}
