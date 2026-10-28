import { resolveFestivalItemSidoCode } from './koreaAreaFilter.js';
import {
  buildCityTags,
  buildSidoTags,
  extractSubregionLabels,
  filterByRegion,
  isMetroArea,
  LIST_SIDO_CHIP_MIN_COUNT,
} from './festivalRegionTags.js';
import { groupFestivalsForList } from './festivalPersonalStore.js';
import { excludeFestivalsByContentId } from './socialPromoFestivalsLogic.js';

/**
 * List heading «N건» — same pool as list rows (promo duplicates excluded).
 * @param {object[]} panelItems
 * @param {Set<string>} promoContentIds
 */
export function festivalListHeadingCount(panelItems, promoContentIds) {
  return excludeFestivalsByContentId(panelItems || [], promoContentIds).length;
}

/**
 * @param {object[]} panelItems — region/time filtered rows (may still include promo)
 * @param {Set<string>} promoContentIds
 * @param {object[]} chipPoolItems — itemsForChipCounts after the same time filter
 * @param {string} areaCode — sido id
 */
export function auditListHeadingMatchesSidoChip(
  panelItems,
  promoContentIds,
  chipPoolItems,
  areaCode,
) {
  const heading = festivalListHeadingCount(panelItems, promoContentIds);
  const chip = buildSidoTags(chipPoolItems || [], {
    minCount: LIST_SIDO_CHIP_MIN_COUNT,
  }).find((c) => String(c.id) === String(areaCode));
  const chipCount = chip?.count ?? null;
  if (chipCount == null || heading !== chipCount) {
    return { ok: false, heading, chip: chipCount, areaCode };
  }
  return { ok: true };
}

/**
 * @param {object[]} panelItems
 * @param {string} areaCode
 * @returns {{ ok: true } | { ok: false, list: number, chipSum: number, unlabeled: number }}
 */
export function auditCityChipSumMatchesList(panelItems, areaCode) {
  const regionItems = filterByRegion(panelItems || [], {
    areaCode,
    cityName: 'all',
  });
  const chips = buildCityTags(regionItems, { areaCode });
  const chipSum = chips.reduce((acc, c) => acc + c.count, 0);
  let unlabeled = 0;
  for (const item of regionItems) {
    const labels = extractSubregionLabels(item?.addr1, areaCode);
    if (!labels.length) unlabeled += 1;
  }
  if (chipSum !== regionItems.length) {
    return { ok: false, list: regionItems.length, chipSum, unlabeled, areaCode };
  }
  return { ok: true };
}

/**
 * @param {object[]} panelItems
 * @returns {{ ok: true } | { ok: false, mismatches: Array<Record<string, unknown>> }}
 */
export function auditAllSidoCityChipSumsMatchList(panelItems) {
  const sidoChips = buildSidoTags(panelItems || [], {
    minCount: LIST_SIDO_CHIP_MIN_COUNT,
  });
  const mismatches = [];
  for (const chip of sidoChips) {
    const code = String(chip.id);
    const r = auditCityChipSumMatchesList(panelItems, code);
    if (!r.ok) {
      mismatches.push({
        areaCode: code,
        label: chip.label,
        list: r.list,
        chipSum: r.chipSum,
        unlabeled: r.unlabeled,
        metro: isMetroArea(code),
      });
    }
  }
  if (mismatches.length) return { ok: false, mismatches };
  return { ok: true };
}

/**
 * @param {object[]} panelItems — list rows (pin duplicate must stay in this array)
 * @param {string} areaCode
 * @returns {{ ok: true } | { ok: false, mismatches: Array<{ label: string, chip: number, group: number }> }}
 */
export function auditCityChipCountsMatchGroups(panelItems, areaCode) {
  const regionItems = filterByRegion(panelItems || [], {
    areaCode,
    cityName: 'all',
  });
  const chips = buildCityTags(regionItems, { areaCode });
  const groups = groupFestivalsForList(regionItems, { areaCode });
  const mismatches = [];
  for (const chip of chips) {
    const group = groups.find(
      (g) => g.id === chip.id || g.label === chip.label,
    );
    const groupCount = group?.items?.length ?? 0;
    if (groupCount !== chip.count) {
      mismatches.push({
        label: chip.label,
        chip: chip.count,
        group: groupCount,
      });
    }
  }
  if (mismatches.length) return { ok: false, mismatches };
  return { ok: true };
}

/**
 * @param {object[]} panelItems
 * @param {{ minCount?: number }} [opts]
 * @returns {{ ok: true, chipSum: number, list: number, unmapped: number } | { ok: false, list: number, chipSum: number, unmapped: number, reason?: string, hidden?: Array<{ id: string, listCount: number, chipCount: number | null }> }}
 */
export function auditNationwideSidoChipsMatchList(panelItems, opts = {}) {
  const list = panelItems || [];
  const minCount = opts.minCount ?? LIST_SIDO_CHIP_MIN_COUNT;
  const chips = buildSidoTags(list, { minCount });
  const chipSum = chips.reduce((acc, c) => acc + c.count, 0);
  /** @type {Map<string, number>} */
  const bySido = new Map();
  let unmapped = 0;
  for (const item of list) {
    const code = resolveFestivalItemSidoCode(item);
    if (!code) {
      unmapped += 1;
      continue;
    }
    bySido.set(code, (bySido.get(code) || 0) + 1);
  }
  if (unmapped > 0) {
    return {
      ok: false,
      list: list.length,
      chipSum,
      unmapped,
      reason: 'unresolvedSido',
    };
  }
  if (chipSum !== list.length) {
    return { ok: false, list: list.length, chipSum, unmapped, reason: 'chipSum' };
  }
  const hidden = [];
  for (const [id, listCount] of bySido) {
    const chip = chips.find((c) => String(c.id) === String(id));
    const chipCount = chip?.count ?? null;
    if (chipCount !== listCount) {
      hidden.push({ id, listCount, chipCount });
    }
  }
  if (hidden.length) {
    return {
      ok: false,
      list: list.length,
      chipSum,
      unmapped,
      reason: 'coverage',
      hidden,
    };
  }
  return { ok: true, chipSum, list: list.length, unmapped: 0 };
}

/**
 * @param {object[]} panelItems
 * @returns {{ ok: true } | { ok: false, mismatches: Array<{ id: string, chip: number, group: number }> }}
 */
export function auditSidoChipCountsMatchGroups(panelItems) {
  const chips = buildSidoTags(panelItems || [], {
    minCount: LIST_SIDO_CHIP_MIN_COUNT,
  });
  const groups = groupFestivalsForList(panelItems || [], { areaCode: 'all' });
  const mismatches = [];
  for (const chip of chips) {
    const group = groups.find((g) => String(g.id) === String(chip.id));
    const groupCount = group?.items?.length ?? 0;
    if (groupCount !== chip.count) {
      mismatches.push({
        id: chip.id,
        chip: chip.count,
        group: groupCount,
      });
    }
  }
  if (mismatches.length) return { ok: false, mismatches };
  return { ok: true };
}
