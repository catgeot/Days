import { buildCityTags, buildSidoTags, filterByRegion } from './festivalRegionTags.js';
import { groupFestivalsForList } from './festivalPersonalStore.js';

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
