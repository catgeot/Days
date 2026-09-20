/**
 * 명소 세권 SSOT → koreaScenicClusters.json
 *
 *   npm run generate:korea-scenic-clusters
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_SCENIC_CLUSTER_OVERRIDES } from './data/korea-scenic-cluster-overrides.mjs';
import { KOREA_AREA_CODE_OVERRIDES } from './data/korea-area-code-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(
  __dirname,
  '../src/pages/Home/data/koreaScenicClusters.json',
);

function assertValid(src) {
  if (!src?.areas || typeof src.areas !== 'object') {
    throw new Error('[scenic-cluster] areas required');
  }
  const areaHubSets = new Map();
  for (const [code, entry] of Object.entries(
    KOREA_AREA_CODE_OVERRIDES.areas || {},
  )) {
    areaHubSets.set(
      String(code),
      new Set(
        (entry.hubIds || []).map((h) =>
          String(h || '')
            .trim()
            .toLowerCase(),
        ),
      ),
    );
  }

  /** @type {Map<string, { areaCode: string, clusterId: string }>} */
  const byHubId = new Map();
  for (const [code, entry] of Object.entries(src.areas)) {
    const areaCode = String(code).trim();
    if (!areaHubSets.has(areaCode)) {
      throw new Error(`[scenic-cluster] unknown areaCode ${areaCode}`);
    }
    const clusters = entry?.clusters;
    if (!Array.isArray(clusters) || clusters.length < 2) {
      throw new Error(
        `[scenic-cluster] ${areaCode}: clusters ≥2 required`,
      );
    }
    const covered = new Set();
    const idSeen = new Set();
    for (const c of clusters) {
      const id = String(c?.id || '').trim();
      const label = String(c?.label || '').trim();
      if (!id || !/^[a-z][a-z0-9-]{1,31}$/.test(id)) {
        throw new Error(`[scenic-cluster] ${areaCode}: bad cluster id`);
      }
      if (idSeen.has(id)) {
        throw new Error(`[scenic-cluster] ${areaCode}: dup cluster ${id}`);
      }
      idSeen.add(id);
      if (!label || label.length > 20) {
        throw new Error(`[scenic-cluster] ${areaCode}/${id}: label 1–20`);
      }
      const hubIds = c?.hubIds;
      if (!Array.isArray(hubIds) || hubIds.length < 1) {
        throw new Error(`[scenic-cluster] ${areaCode}/${id}: hubIds required`);
      }
      for (const hubId of hubIds) {
        const key = String(hubId || '')
          .trim()
          .toLowerCase();
        if (!key) throw new Error(`[scenic-cluster] ${areaCode}/${id}: empty hub`);
        if (!areaHubSets.get(areaCode).has(key)) {
          throw new Error(
            `[scenic-cluster] ${areaCode}/${id}: hub ${key} not in area SSOT`,
          );
        }
        if (covered.has(key) || byHubId.has(key)) {
          throw new Error(
            `[scenic-cluster] hub ${key} assigned twice`,
          );
        }
        covered.add(key);
        byHubId.set(key, { areaCode, clusterId: id });
      }
    }
    const expected = areaHubSets.get(areaCode);
    for (const hubId of expected) {
      if (!covered.has(hubId)) {
        throw new Error(
          `[scenic-cluster] ${areaCode}: uncovered hub ${hubId}`,
        );
      }
    }
  }
  return byHubId;
}

function main() {
  const byHubMap = assertValid(KOREA_SCENIC_CLUSTER_OVERRIDES);
  /** @type {Record<string, { clusters: { id: string, label: string, hubIds: string[] }[] }>} */
  const areas = {};
  for (const [code, entry] of Object.entries(
    KOREA_SCENIC_CLUSTER_OVERRIDES.areas,
  )) {
    areas[String(code)] = {
      clusters: (entry.clusters || []).map((c) => ({
        id: String(c.id).trim(),
        label: String(c.label).trim(),
        hubIds: c.hubIds.map((h) =>
          String(h)
            .trim()
            .toLowerCase(),
        ),
      })),
    };
  }
  /** @type {Record<string, { areaCode: string, clusterId: string }>} */
  const byHubId = {};
  for (const [hubId, ref] of byHubMap) byHubId[hubId] = ref;

  const out = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      source: 'scripts/data/korea-scenic-cluster-overrides.mjs',
    },
    areas,
    byHubId,
  };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(
    `[scenic-cluster] wrote ${OUTPUT_PATH} areas=${Object.keys(areas).length} hubs=${Object.keys(byHubId).length}`,
  );
}

main();
