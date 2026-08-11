/**
 * 명승 홈 분류칩 기본값 — 첫 중·소분류, 목록이 길면 ~10건 안팎.
 */
import {
  countKoreaScenicSpotsByRegion,
  countKoreaScenicSpotsByTourArea,
  listKoreaScenicClusterChips,
  listKoreaScenicHubChips,
} from '../Home/lib/koreaScenicSpots.js';
import {
  areaHasScenicClusters,
  resolveScenicClusterAreaCode,
} from '../Home/lib/koreaScenicClusters.js';
import {
  countKoreaHeritageScenicByRegion,
  countKoreaHeritageScenicByTourArea,
  listKoreaHeritageCategoryChips,
  listKoreaHeritageScenic,
} from '../Home/lib/koreaHeritageScenic.js';
import {
  labelScenicAreaCode,
  listScenicRegionAreas,
} from '../Home/lib/koreaTourAttractionMap.js';
import {
  listTourAttractionCat2,
  listTourAttractionCat3,
} from '../Home/lib/koreaTourAttractionCategories.js';

/** 기본 목록 상한(~10개 안팎) — 넘으면 한 단계 더 좁힘 */
export const DEFAULT_LIST_SOFT_MAX = 12;

function chipLabelsEqual(a, b) {
  return String(a || '').trim() === String(b || '').trim();
}

/**
 * @param {{ code?: string, hubId?: string, id?: string, label: string, count?: number }[]} chips
 * @returns {{ code?: string, hubId?: string, id?: string, label: string, count?: number } | null}
 */
export function pickFirstChipNearTarget(chips) {
  const list = (chips || []).filter((c) => (Number(c.count) || 0) > 0);
  if (!list.length) return null;
  const near = list.find(
    (c) => (Number(c.count) || 0) <= DEFAULT_LIST_SOFT_MAX,
  );
  return near || list[0];
}

/**
 * @param {string} region
 * @param {Record<string, number> | null | undefined} areaCounts
 * @returns {{ code: string, label: string, count: number }[]}
 */
export function listAreaChipsWithCounts(region, areaCounts) {
  return listScenicRegionAreas(region)
    .map((chip) => ({
      ...chip,
      count: Number(areaCounts?.[chip.code]) || 0,
    }))
    .filter((chip) => chip.count > 0);
}

/**
 * 시도 중분류가 2개 이상일 때 첫 칩. (강원·제주처럼 1개면 null — 소분류로)
 * @param {string} region
 * @param {Record<string, number> | null | undefined} areaCounts
 * @returns {string | null}
 */
export function pickDefaultAreaCode(region, areaCounts) {
  const chips = listAreaChipsWithCounts(region, areaCounts);
  if (chips.length <= 1) return null;
  return chips[0].code;
}

/**
 * @param {string} region
 * @param {string | null | undefined} areaCode
 * @param {Record<string, number> | null | undefined} areaCounts
 * @param {Record<string, number> | null | undefined} regionCounts
 * @returns {number}
 */
export function listCountForRegionArea(
  region,
  areaCode,
  areaCounts,
  regionCounts,
) {
  if (areaCode) return Number(areaCounts?.[areaCode]) || 0;
  return Number(regionCounts?.[region]) || 0;
}

/**
 * 세권 기본값 — 해당 시도(또는 단일 시도 권역)에 세권이 있으면 첫 칩.
 * @param {string} region
 * @param {string | null | undefined} areaCode
 * @returns {string | null}
 */
export function pickDefaultClusterId(region, areaCode) {
  const clusterArea = resolveScenicClusterAreaCode(region, areaCode);
  if (!clusterArea || !areaHasScenicClusters(clusterArea)) return null;
  const midChips = listAreaChipsWithCounts(
    region,
    countKoreaScenicSpotsByTourArea(region),
  );
  if (midChips.length > 1 && !areaCode) return null;
  const chips = listKoreaScenicClusterChips(region, clusterArea);
  return chips[0]?.id || null;
}

/**
 * 명소 여행지 소분류 — 목록이 soft max 초과일 때만.
 * @param {string} region
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} clusterId
 * @param {Record<string, number> | null | undefined} areaCounts
 * @param {Record<string, number> | null | undefined} regionCounts
 * @returns {string | null}
 */
export function pickDefaultCuratedHubId(
  region,
  areaCode,
  clusterId,
  areaCounts,
  regionCounts,
) {
  // 구 시그니처 호환: (region, area, areaCounts, regionCounts)
  if (
    clusterId &&
    typeof clusterId === 'object' &&
    !Array.isArray(clusterId)
  ) {
    regionCounts = areaCounts;
    areaCounts = clusterId;
    clusterId = null;
  }

  const midChips = listAreaChipsWithCounts(region, areaCounts);
  const hasMidRow = midChips.length > 1;
  if (hasMidRow && !areaCode) return null;

  const clusterArea = resolveScenicClusterAreaCode(region, areaCode);
  const hasClusterRow = areaHasScenicClusters(clusterArea);
  if (hasClusterRow && !clusterId) return null;

  let n;
  if (clusterId && clusterArea) {
    const chip = listKoreaScenicClusterChips(region, clusterArea).find(
      (c) => c.id === clusterId,
    );
    n = Number(chip?.count) || 0;
  } else {
    n = listCountForRegionArea(
      region,
      areaCode,
      areaCounts,
      regionCounts,
    );
  }
  if (n <= DEFAULT_LIST_SOFT_MAX) return null;

  const hubs = (
    hasClusterRow
      ? listKoreaScenicHubChips(region, clusterArea, clusterId)
      : hasMidRow
        ? listKoreaScenicHubChips(region, areaCode)
        : listKoreaScenicHubChips(region, null)
  ).filter((chip) => (chip.count || 0) > 0);

  const parentLabel =
    hasMidRow && areaCode ? labelScenicAreaCode(areaCode) : null;
  const soleAreaLabel = !hasMidRow ? midChips[0]?.label || null : null;
  const visible = hubs.filter((chip) => {
    if (parentLabel && chipLabelsEqual(chip.label, parentLabel)) return false;
    if (soleAreaLabel && chipLabelsEqual(chip.label, soleAreaLabel)) {
      return false;
    }
    return true;
  });
  const pick = pickFirstChipNearTarget(visible);
  return pick?.hubId || null;
}

/**
 * 명승 경관 소분류 — 목록이 soft max 초과일 때만.
 * @param {string} region
 * @param {string | null | undefined} areaCode
 * @param {number} listCount
 * @returns {string | null}
 */
export function pickDefaultHeritageCategory(region, areaCode, listCount) {
  if ((Number(listCount) || 0) <= DEFAULT_LIST_SOFT_MAX) return null;
  const midLabels = new Set(
    listAreaChipsWithCounts(
      region,
      countKoreaHeritageScenicByTourArea(region),
    ).map((c) => String(c.label || '').trim()),
  );
  const activeMidLabel = areaCode ? labelScenicAreaCode(areaCode) : null;
  const chips = listKoreaHeritageCategoryChips({
    region,
    areaCode: areaCode || null,
  }).filter((chip) => {
    if ((chip.count || 0) <= 0) return false;
    const label = String(chip.label || '').trim();
    if (activeMidLabel && chipLabelsEqual(label, activeMidLabel)) return false;
    if (midLabels.has(label)) return false;
    return true;
  });
  return pickFirstChipNearTarget(chips)?.code || null;
}

/**
 * @param {string} region
 * @returns {{
 *   areaCode: string | null,
 *   clusterId: string | null,
 *   hubId: string | null,
 * }}
 */
export function resolveDefaultCuratedChips(region) {
  const areaCounts = countKoreaScenicSpotsByTourArea(region);
  const regionCounts = countKoreaScenicSpotsByRegion();
  const areaCode = pickDefaultAreaCode(region, areaCounts);
  const clusterId = pickDefaultClusterId(region, areaCode);
  const hubId = pickDefaultCuratedHubId(
    region,
    areaCode,
    clusterId,
    areaCounts,
    regionCounts,
  );
  return { areaCode, clusterId, hubId };
}

/**
 * @param {string} region
 * @returns {{
 *   areaCode: string | null,
 *   category: string | null,
 * }}
 */
export function resolveDefaultHeritageChips(region) {
  const areaCounts = countKoreaHeritageScenicByTourArea(region);
  const regionCounts = countKoreaHeritageScenicByRegion();
  const areaCode = pickDefaultAreaCode(region, areaCounts);
  const listCount = listCountForRegionArea(
    region,
    areaCode,
    areaCounts,
    regionCounts,
  );
  const scoped = listKoreaHeritageScenic({
    region,
    areaCode: areaCode || null,
  }).length;
  const category = pickDefaultHeritageCategory(
    region,
    areaCode,
    scoped || listCount,
  );
  return { areaCode, category };
}

/**
 * 관광지 시도 중분류 기본값 (동기 — 칩 건수 맵 기준).
 * @param {string} region
 * @param {Record<string, number> | null | undefined} areaCounts
 * @returns {string | null}
 */
export function resolveDefaultTourAreaCode(region, areaCounts) {
  return pickDefaultAreaCode(region, areaCounts);
}

/**
 * 관광지 종목 중·소분류 — 첫 중분류, 길면 첫 소분류(~10).
 * @param {string | null | undefined} cat1
 * @param {string | null | undefined} cat2
 * @param {string | null | undefined} cat3
 * @param {{
 *   cat2Counts?: Record<string, number>,
 *   cat3Counts?: Record<string, number>,
 * }} chipCounts
 * @returns {{ cat2: string | null, cat3: string | null, changed: boolean }}
 */
export function resolveDefaultTourCatChips(cat1, cat2, cat3, chipCounts) {
  const cat2Counts = chipCounts?.cat2Counts || {};
  const cat3Counts = chipCounts?.cat3Counts || {};
  const cat2Loaded = listTourAttractionCat2(cat1).some((c) =>
    Number.isFinite(Number(cat2Counts[c.code])),
  );
  if (!cat2Loaded) {
    return { cat2: cat2 || null, cat3: cat3 || null, changed: false };
  }

  let nextCat2 = cat2 || null;
  let nextCat3 = cat3 || null;
  let changed = false;

  if (!nextCat2) {
    const pick = listTourAttractionCat2(cat1).find(
      (c) => (Number(cat2Counts[c.code]) || 0) > 0,
    );
    if (pick) {
      nextCat2 = pick.code;
      changed = true;
    }
  }

  if (nextCat2 && !nextCat3) {
    const midCount = Number(cat2Counts[nextCat2]) || 0;
    if (midCount > DEFAULT_LIST_SOFT_MAX) {
      const cat3Loaded = listTourAttractionCat3(cat1, nextCat2).some((c) =>
        Number.isFinite(Number(cat3Counts[c.code])),
      );
      if (cat3Loaded) {
        const chips = listTourAttractionCat3(cat1, nextCat2).map((c) => ({
          ...c,
          count: Number(cat3Counts[c.code]) || 0,
        }));
        const pick = pickFirstChipNearTarget(chips);
        if (pick) {
          nextCat3 = pick.code;
          changed = true;
        }
      }
    }
  }

  return { cat2: nextCat2, cat3: nextCat3, changed };
}
