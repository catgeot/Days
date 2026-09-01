#!/usr/bin/env node
/**
 * koreaLocalScenicLists.json 감사 — 오케스트레이터 게이트.
 * exit 0 = 이슈 0, exit 1 = 실패. WARN은 memberCountClaimed 불일치만.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const listsPath = join(root, 'src/pages/Home/data/koreaLocalScenicLists.json');
const hubsPath = join(root, 'src/pages/Home/data/cityAttractionHubs.json');

const LIST_KIND = new Set(['palgyeong', 'gugyeong', 'sipgyeong', 'gugok', 'other']);
const STATUS = new Set(['draft', 'verified', 'skip_no_source', 'skip_ambiguous']);
const LINK_STATUS = new Set(['linked', 'appended', 'pending_coord', 'skipped_conflict']);
const KIND = new Set([
  'beach',
  'market',
  'temple',
  'shrine',
  'viewpoint',
  'landmark',
  'museum',
  'neighborhood',
  'park',
]);

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const lists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

if (!Array.isArray(lists)) {
  console.error('FAIL: root must be array');
  process.exit(1);
}
if (!Array.isArray(hubs)) {
  console.error('FAIL: cityAttractionHubs root must be array');
  process.exit(1);
}

const hubById = new Map(hubs.map((h) => [h.hubId, h]));
const hubAttrByHub = new Map(
  hubs.map((h) => [
    h.hubId,
    new Set((h.attractions || []).map((a) => normalizeKey(a.name))),
  ]),
);

const issues = [];
const warnings = [];
const listIds = new Map();
const titleKeys = new Map();
let memberTotal = 0;

for (const list of lists) {
  if (!list?.listId) {
    issues.push('list missing listId');
    continue;
  }
  if (listIds.has(list.listId)) issues.push(`dup listId ${list.listId}`);
  listIds.set(list.listId, true);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(list.listId)) {
    issues.push(`${list.listId}: listId must be kebab-case`);
  }

  for (const field of ['hubId', 'title', 'listKind', 'status']) {
    if (!list[field]) issues.push(`${list.listId}: missing ${field}`);
  }

  if (list.listKind && !LIST_KIND.has(list.listKind)) {
    issues.push(`${list.listId}: bad listKind ${list.listKind}`);
  }
  if (list.status && !STATUS.has(list.status)) {
    issues.push(`${list.listId}: bad status ${list.status}`);
  }

  if (list.hubId && !hubById.has(list.hubId)) {
    issues.push(`${list.listId}: hubId ${list.hubId} not in cityAttractionHubs`);
  }

  if (list.status === 'verified' && !list.sourceUrl) {
    issues.push(`${list.listId}: verified requires sourceUrl`);
  }

  if (
    list.memberCountClaimed != null &&
    Array.isArray(list.members) &&
    list.memberCountClaimed !== list.members.length
  ) {
    warnings.push(
      `${list.listId}: memberCountClaimed ${list.memberCountClaimed} vs members ${list.members.length}`,
    );
  }

  for (const k of [list.listId, list.title, list.title_en, ...(list.aliases || [])]) {
    const nk = normalizeKey(k);
    if (!nk) continue;
    if (titleKeys.has(nk) && titleKeys.get(nk) !== list.listId) {
      issues.push(`title/alias collide "${k}" ${titleKeys.get(nk)} vs ${list.listId}`);
    } else {
      titleKeys.set(nk, list.listId);
    }
  }

  if (!Array.isArray(list.members)) {
    issues.push(`${list.listId}: members not array`);
    continue;
  }

  const hubAttrs = hubAttrByHub.get(list.hubId) || new Set();
  for (const m of list.members) {
    memberTotal += 1;
    if (!m?.attractionName) {
      issues.push(`${list.listId}: member missing attractionName`);
      continue;
    }
    if (m.kind && !KIND.has(m.kind)) {
      issues.push(`${list.listId}: member "${m.attractionName}" bad kind ${m.kind}`);
    }
    if (m.linkStatus && !LINK_STATUS.has(m.linkStatus)) {
      issues.push(`${list.listId}: member "${m.attractionName}" bad linkStatus ${m.linkStatus}`);
    }
    if (m.mapboxId != null && typeof m.mapboxId !== 'string') {
      issues.push(`${list.listId}: member "${m.attractionName}" mapboxId must be string|null`);
    }

    const memberKey = normalizeKey(m.attractionName);
    if (list.status === 'verified' && m.linkStatus === 'linked') {
      if (!hubAttrs.has(memberKey)) {
        issues.push(
          `${list.listId}: linked member "${m.attractionName}" not in hub ${list.hubId}`,
        );
      }
    }
    if (
      list.status === 'verified' &&
      m.linkStatus === 'appended' &&
      hubAttrs.has(memberKey)
    ) {
      issues.push(
        `${list.listId}: appended member "${m.attractionName}" already in hub ${list.hubId}`,
      );
    }
  }
}

const summary = {
  lists: lists.length,
  uniqueListIds: listIds.size,
  members: memberTotal,
  warnings: warnings.length,
  issues: issues.length,
};

console.log(JSON.stringify(summary, null, 2));

if (warnings.length) {
  console.warn('WARNINGS:');
  for (const line of warnings.slice(0, 20)) console.warn(' -', line);
}

if (issues.length) {
  console.error('ISSUES:');
  for (const line of issues.slice(0, 50)) console.error(' -', line);
  if (issues.length > 50) console.error(` ... +${issues.length - 50} more`);
  process.exit(1);
}

console.log('OK');
