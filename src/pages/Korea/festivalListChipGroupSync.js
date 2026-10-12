import {
  buildCityTags,
  buildSidoTags,
  extractSubregionLabels,
  filterByRegion,
  isMetroArea,
} from './festivalRegionTags.js';
import { groupFestivalsForList } from './festivalPersonalStore.js';

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
  const sidoChips = buildSidoTags(panelItems || [], { minCount: 1 });
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
 * @returns {{ ok: true } | { ok: false, mismatches: Array<{ id: string, chip: number, group: number }> }}
 */
export function auditSidoChipCountsMatchGroups(panelItems) {
  const chips = buildSidoTags(panelItems || [], { minCount: 1 });
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
